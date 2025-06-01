import { Request, Response } from 'express';
import { TestCase, ITestCase } from '../models/TestCase';
import { Project } from '../models/Project';
import { Role, RoleType } from '../models/roleModel';
import { JwtPayload } from '../middleware/auth';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const createTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, description, steps, expectedResult } = req.body;
    const projectId = req.params.projectId;

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });

    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        hasAccess = true;
        projectToUse = await Project.findById(projectId);
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project or required permissions to create test cases.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCase = await TestCase.create({
      title,
      description,
      steps,
      expectedResult,
      project: projectId,
      createdBy: currentUser.id,
    });

    res.status(201).json(testCase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTestCases = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projectId = req.params.projectId;

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });
    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        hasAccess = true;
        projectToUse = await Project.findById(projectId);
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project to view test cases.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCases = await TestCase.find({ project: projectId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(testCases);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, testCaseId } = req.params;

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });
    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        hasAccess = true;
        projectToUse = await Project.findById(projectId);
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project to view this test case.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCase = await TestCase.findOne({
      _id: testCaseId,
      project: projectId,
    }).populate('createdBy', 'name email');

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    res.json(testCase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, testCaseId } = req.params;
    const { title, description, steps, expectedResult, status, priority } = req.body;

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });
    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        hasAccess = true;
        projectToUse = await Project.findById(projectId);
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project or required permissions to update test cases.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCase = await TestCase.findOne({
      _id: testCaseId,
      project: projectId,
    });

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const updatePayload: Partial<ITestCase> = {};

    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (steps !== undefined) updatePayload.steps = steps;
    if (expectedResult !== undefined) updatePayload.expectedResult = expectedResult;
    if (priority !== undefined) updatePayload.priority = priority as 'LOW' | 'MEDIUM' | 'HIGH';

    // Handle status mapping if status is provided in the update
    if (status) {
      const upperStatus = status.toString().toUpperCase();
      if (upperStatus === 'PASSED') {
        updatePayload.status = 'pass';
      } else if (upperStatus === 'FAILED') {
        updatePayload.status = 'fail';
      } else if (upperStatus === 'PENDING') {
        updatePayload.status = 'pending';
      } else {
        // If status is provided but invalid, return an error
        return res.status(400).json({ message: 'Invalid status value in update' });
      }
    }

    const updatedTestCase = await TestCase.findByIdAndUpdate(
      testCaseId,
      updatePayload, // Use the constructed payload
      { new: true, runValidators: true } // Added runValidators
    ).populate('project', 'name').populate('createdBy', 'name email');

    if (!updatedTestCase) {
        return res.status(404).json({ message: 'Test case not found after update attempt.' });
    }

    res.json(updatedTestCase);
  } catch (error: any) {
    console.error("Error updating test case:", error);
    res.status(500).json({ message: 'Error updating test case', error: error.message });
  }
};

export const deleteTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, testCaseId } = req.params;

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });
    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        if (userRoleInProject.type === RoleType.PROJECT_OWNER || userRoleInProject.type === RoleType.TEST_MANAGER) {
            hasAccess = true;
        } else {
            hasAccess = false;
        }
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project or required permissions to delete test cases.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCase = await TestCase.findOne({
      _id: testCaseId,
      project: projectId,
    });

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    await testCase.deleteOne();
    res.json({ message: 'Test case deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to update only the status of a test case
export const updateTestCaseStatus = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId, testCaseId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['PASSED', 'FAILED', 'PENDING'].includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // --- Updated Permission Check ---
    const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: currentUser.id });
    let hasAccess = !!projectForOwnerCheck;
    let projectToUse = projectForOwnerCheck;

    if (!hasAccess) {
      const userRoleInProject = await Role.findOne({ projectId, userId: currentUser.id });
      if (userRoleInProject) {
        hasAccess = true;
        projectToUse = await Project.findById(projectId);
      }
    }

    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(403).json({ message: 'Forbidden: You do not have access to this project or required permissions to update test case status.' });
    }

    if (!projectToUse) {
      console.error('Project document missing after access check for projectId:', projectId);
      return res.status(404).json({ message: 'Project not found (internal error after access check)' });
    }
    // --- End of Updated Permission Check ---

    const testCase = await TestCase.findOne({
      _id: testCaseId,
      project: projectId,
    });

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    // Map to schema enum values
    let schemaStatus: 'pass' | 'fail' | 'pending';
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'PASSED') {
      schemaStatus = 'pass';
    } else if (upperStatus === 'FAILED') {
      schemaStatus = 'fail';
    } else if (upperStatus === 'PENDING') {
      schemaStatus = 'pending';
    } else {
      // This case should ideally be caught by the validation above,
      // but as a safeguard:
      return res.status(400).json({ message: 'Invalid status value after mapping attempt' });
    }

    testCase.status = schemaStatus;
    await testCase.save();
    
    // Populate necessary fields before sending back
    const updatedTestCase = await TestCase.findById(testCaseId)
        .populate('project', 'name')
        .populate('createdBy', 'name email');

    if (!updatedTestCase) {
        // This case should ideally not happen if save was successful
        return res.status(404).json({ message: 'Test case not found after update' });
    }

    res.json(updatedTestCase);
  } catch (error: any) {
    console.error("Error updating test case:", error);
    res.status(500).json({ message: 'Error updating test case', error: error.message });
  }
}; 