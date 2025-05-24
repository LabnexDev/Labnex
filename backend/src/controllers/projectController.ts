import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { TestCase } from '../models/TestCase';
import { Role, RoleType, SystemRoleType } from '../models/roleModel';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Create project request received');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);

    const { name, description, projectCode: rawProjectCode } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate projectCode
    if (!rawProjectCode || typeof rawProjectCode !== 'string') {
      return res.status(400).json({ message: 'Project code is required and must be a string.' });
    }

    const projectCode = rawProjectCode.toUpperCase();

    if (!/^[A-Z0-9]{3,5}$/.test(projectCode)) {
      return res
        .status(400)
        .json({
          message:
            'Project code must be 3-5 alphanumeric characters.',
        });
    }

    // Create the project with all required fields
    const projectData = {
      name,
      description: description || '',
      projectCode,
      owner: userId,
      members: [userId],
      isActive: true,
      testCaseCount: 0
    };

    console.log('Creating project with data:', projectData);
    const project = await Project.create(projectData);
    console.log('Project created:', project._id);

    try {
      // Create project role for the user (project role only, no system role)
      const roleData = {
        type: RoleType.PROJECT_OWNER,
        projectId: project._id,
        userId: userId
      };
      
      console.log('Creating role with data:', roleData);
      const role = await Role.create(roleData);
      console.log('Role created:', role._id);

      // Populate the project with owner and members
      const populatedProject = await Project.findById(project._id)
        .populate('owner', 'name email')
        .populate('members', 'name email');

      if (!populatedProject) {
        throw new Error('Failed to populate project after creation');
      }

      res.status(201).json(populatedProject);
    } catch (roleError) {
      console.error('Error creating role:', roleError);
      // If role creation fails, delete the project
      await Project.findByIdAndDelete(project._id);
      throw new Error('Failed to create project role');
    }
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error && error.code === 11000 && error.keyPattern && error.keyPattern.projectCode) {
      return res.status(400).json({ message: 'Project code already exists. Please choose a unique one.' });
    }
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Getting projects for user:', currentUser._id);

    // Get all projects where user is owner or member
    const projects = await Project.find({
      $or: [{ owner: currentUser._id }, { members: currentUser._id }]
    })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ updatedAt: -1 }); // Default sort by most recently updated

    // Get test case counts and other details for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const testCaseCount = await TestCase.countDocuments({ project: project._id });
        const recentTestCases = await TestCase.find({ project: project._id })
          .sort({ updatedAt: -1 })
          .limit(3)
          .select('name status updatedAt');

        return {
          ...project.toObject(),
          testCaseCount,
          recentTestCases,
          memberCount: project.members.length,
          isOwner: project.owner._id.toString() === currentUser._id.toString()
        };
      })
    );

    console.log(`Found ${projectsWithDetails.length} projects`);
    res.json(projectsWithDetails);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ message: 'Error getting projects' });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Getting project:', { id, userId: currentUser._id });

    const project = await Project.findOne({
      _id: id,
      $or: [
        { owner: currentUser._id },
        { members: currentUser._id },
      ],
    }).populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      console.log('Project not found:', id);
      return res.status(404).json({ message: 'Project not found' });
    }

    const testCaseCount = await TestCase.countDocuments({ project: project._id });
    const recentTestCases = await TestCase.find({ project: project._id })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title status updatedAt'); // Fetch title, status, updatedAt

    const projectWithDetails = {
      ...project.toObject(),
      testCaseCount,
      recentTestCases: recentTestCases.map(tc => ({
        _id: tc._id,
        name: tc.title, // Map title to name for frontend compatibility
        status: tc.status,
        updatedAt: tc.updatedAt
      })),
    };

    console.log('Project found:', project._id, 'with', recentTestCases.length, 'recent test cases');
    res.json(projectWithDetails);
  } catch (error: any) {
    console.error('Error getting project:', error);
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description, isActive } = req.body;
    console.log('Updating project:', { id, userId: currentUser._id, name, description, isActive });

    const project = await Project.findOne({
      _id: id,
      owner: currentUser._id,
    });

    if (!project) {
      console.log('Project not found or user is not owner:', id);
      return res.status(404).json({ message: 'Project not found or user is not owner' });
    }

    project.name = name !== undefined ? name : project.name;
    project.description = description !== undefined ? description : project.description;
    if (isActive !== undefined && typeof isActive === 'boolean') {
      project.isActive = isActive;
    }
    
    await project.save();

    const populatedProject = await Project.findById(project._id)
        .populate('owner', 'name email')
        .populate('members', 'name email');

    console.log('Project updated:', populatedProject?._id);
    res.json(populatedProject);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Deleting project:', { id, userId: currentUser._id });

    const project = await Project.findOne({
      _id: id,
      owner: currentUser._id,
    });

    if (!project) {
      console.log('Project not found or user is not owner:', id);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all test cases associated with the project
    await TestCase.deleteMany({ project: project._id });
    // Delete all roles associated with the project
    await Role.deleteMany({ projectId: project._id });
    // Delete the project
    await project.deleteOne();

    console.log('Project deleted:', id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Getting dashboard data for user:', currentUser._id);

    const allUserProjects = await Project.find({
      $or: [{ owner: currentUser._id }, { members: currentUser._id }]
    })
    .populate('owner', 'name email') // Populate owner for isOwner check and display
    .populate('members', 'name email') // Populate members for memberCount consistency
    .sort({ updatedAt: -1 });

    const activeProjectsCount = allUserProjects.filter(p => p.isActive).length;

    const totalTestCases = await TestCase.countDocuments({
      project: { $in: allUserProjects.map(p => p._id) }
    });

    const testCasesByStatus = await TestCase.aggregate([
      {
        $match: {
          project: { $in: allUserProjects.map(p => p._id) }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const allMemberIds = new Set<string>();
    allUserProjects.forEach(project => {
      // After .populate('owner'), project.owner is UserDocument | null
      if (project.owner && project.owner._id) { // If owner exists and is a document with _id
        allMemberIds.add(project.owner._id.toString());
      }

      // After .populate('members'), project.members is (UserDocument | null)[]
      project.members.forEach(member => {
        if (member && member._id) { // If member exists and is a document with _id
          allMemberIds.add(member._id.toString());
        }
      });
    });
    const totalTeamMembers = allMemberIds.size;

    // Prepare recentlyUpdatedProjects with details
    const recentlyUpdatedProjectsPromises = allUserProjects.slice(0, 5).map(async (project) => {
      const testCaseCount = await TestCase.countDocuments({ project: project._id });
      // The DashboardData type on frontend expects recentTestCases (named recentActivity there)
      // For now, let's stick to what the Project type usually has or what's simple.
      // The frontend Project type has recentTestCases, but that's usually populated by getProjects.
      // For simplicity, we are adding testCaseCount and memberCount directly.
      return {
        ...project.toObject(), // Includes populated owner and members
        testCaseCount,
        memberCount: project.members.length, // Already populated
        // recentTestCases: project.recentTestCases (This would be empty unless specifically populated here)
      };
    });
    const recentlyUpdatedProjects = await Promise.all(recentlyUpdatedProjectsPromises);
    
    // Global recent test cases (as it was before)
    const globalRecentTestCases = await TestCase.find({
      project: { $in: allUserProjects.map(p => p._id) }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('project', 'name'); // project name for context

    const dashboardData = {
      totalProjects: allUserProjects.length,
      activeProjects: activeProjectsCount,
      totalTestCases,
      testCasesByStatus,
      totalTeamMembers,
      recentlyUpdatedProjects, // Add this
      recentTestCases: globalRecentTestCases // Keep the global one, rename if needed on frontend
    };

    console.log('Dashboard data retrieved with recently updated projects');
    res.json(dashboardData);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ message: 'Error getting dashboard data' });
  }
}; 