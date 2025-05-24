import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Task, TaskStatus, ITask } from '../models/Task';
import { TestCase, ITestCase } from '../models/TestCase';
import { Project, IProject } from '../models/Project';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { User, IUser } from '../models/User';
import { Role, RoleType } from '../models/roleModel';

const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;

/**
 * @route   GET /api/integrations/discord/project-tasks
 * @desc    Called by the Discord bot to fetch tasks (test cases) for a specific project.
 * @access  Private (Bot authenticated by secret key)
 */
export const getProjectTasksForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, projectIdentifier } = req.query;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }
    if (!projectIdentifier || typeof projectIdentifier !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid projectIdentifier in query parameters.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked to any Labnex account.' });
        }
        const labnexUserId = link.userId;

        let project;
        if (Types.ObjectId.isValid(projectIdentifier)) {
            project = await Project.findById(projectIdentifier);
        } else {
            project = await Project.findOne({ name: projectIdentifier });
        }

        if (!project) {
            return res.status(404).json({ message: `Project not found with identifier: "${projectIdentifier}".` });
        }

        // Verify user has access to this project
        const userIsOwner = project.owner.equals(labnexUserId);
        const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUserId));

        if (!userIsOwner && !userIsMember) {
            return res.status(403).json({ message: 'You do not have permission to view this project\'s tasks.' });
        }

        // Fetch test cases for the project
        const tasks = await TestCase.find({ project: project._id })
            .select('title status priority createdAt updatedAt') // Select relevant fields
            .sort({ updatedAt: -1 }); // Sort by most recently updated

        if (!tasks || tasks.length === 0) {
            return res.status(200).json([]); // Return empty array if no tasks found
        }

        const taskData = tasks.map(task => ({
            id: task._id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        }));

        res.status(200).json(taskData);

    } catch (error) {
        console.error('Error fetching project tasks for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching project tasks.' });
    }
};

/**
 * @route   GET /api/integrations/discord/my-tasks
 * @desc    Called by the Discord bot to fetch tasks assigned to the linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const getMyTasksForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, projectId: queryProjectId } = req.query; // discordUserId and optional projectId for filtering

    // Ensure filterProjectId is a string if it exists
    const filterProjectId = typeof queryProjectId === 'string' ? queryProjectId : undefined;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }
    // Corrected type check for filterProjectId
    if (filterProjectId && !Types.ObjectId.isValid(filterProjectId)) {
        return res.status(400).json({ message: 'Invalid projectId for filtering.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked to any Labnex account. Please use `!labnex link-account`.' });
        }
        const labnexUserId = link.userId;

        const query: any = { assignedTo: labnexUserId };
        if (filterProjectId) {
            query.project = filterProjectId as string;
        }

        const tasks = await Task.find(query)
            .populate('project', 'name')
            .populate('createdBy', 'name')
            .select('title description status priority dueDate project createdBy') // Select relevant fields
            .sort({ dueDate: 1, createdAt: -1 }); // Sort by due date then creation date

        if (!tasks || tasks.length === 0) {
            let message = 'You have no tasks assigned to you.';
            if (filterProjectId) {
                const projectDoc = await Project.findById(filterProjectId).select('name');
                message = `You have no tasks assigned to you in project "${projectDoc ? projectDoc.name : 'Selected Project'}".`;
            }
            return res.status(200).json({ message, tasks: [] });
        }

        res.status(200).json(tasks.map(task => ({
            id: task._id,
            title: task.title,
            description: task.description || 'No description',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
            project: task.project ? (task.project as any).name : 'Unknown Project',
            createdBy: task.createdBy ? (task.createdBy as any).name : 'Unknown User'
        })));

    } catch (error) {
        console.error('Error fetching tasks for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching tasks.' });
    }
};

/**
 * @route   POST /api/integrations/discord/tasks
 * @desc    Called by the Discord bot to create a task for a linked user in a project.
 * @access  Private (Bot authenticated by secret key)
 */
export const createTaskForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, projectIdentifier, title, description, priority, status, dueDate } = req.body;

    if (!BOT_API_SECRET) {
        return res.status(500).json({ message: 'Server configuration error (Bot secret not set).' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !projectIdentifier || !title) {
        return res.status(400).json({ message: 'Missing required fields: discordUserId, projectIdentifier, or title.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked. Use `!labnex link-account`.' });
        }
        const labnexUserId = link.userId;

        let projectDoc;
        if (Types.ObjectId.isValid(projectIdentifier)) {
            projectDoc = await Project.findById(projectIdentifier);
        } else {
            projectDoc = await Project.findOne({ name: { $regex: new RegExp(`^${projectIdentifier}$`, 'i') }, $or: [{owner: labnexUserId}, {members: labnexUserId}] });
        }

        if (!projectDoc) {
            return res.status(404).json({ message: `Project "${projectIdentifier}" not found or you do not have access to it.` });
        }

        const userRole = await Role.findOne({ userId: labnexUserId, projectId: projectDoc._id });
        if (!userRole ||
            !(userRole.type === RoleType.PROJECT_OWNER ||
              userRole.type === RoleType.TEST_MANAGER)) {
            return res.status(403).json({ message: 'You do not have permission to create tasks in this project. Requires Project Owner or Test Manager role.' });
        }

        const newTask = new Task({
            project: projectDoc._id,
            title,
            description,
            createdBy: labnexUserId,
            status: status || 'TODO',
            priority: priority || 'MEDIUM',
            dueDate
        });

        await newTask.save();

        const populatedTask = await Task.findById(newTask._id)
            .populate('project', 'name')
            .populate('createdBy', 'name');

        res.status(201).json({
            message: `Task "${populatedTask?.title}" created successfully in project "${(populatedTask?.project as any)?.name}".`,
            taskId: populatedTask?._id,
            title: populatedTask?.title,
            project: (populatedTask?.project as any)?.name
        });

    } catch (error) {
        console.error('Error creating task for Discord user:', error);
        res.status(500).json({ message: 'Server error while creating task.' });
    }
};

/**
 * @route   PUT /api/integrations/discord/tasks/:taskIdentifier/status
 * @desc    Called by the Discord bot to update the status of a task.
 * @access  Private (Bot authenticated by secret key)
 */
export const updateTaskStatusForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { taskIdentifier } = req.params;
    const { discordUserId, status: newStatusRequest } = req.body;

    if (!BOT_API_SECRET) {
        return res.status(500).json({ message: 'Server configuration error (Bot secret not set).' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !newStatusRequest || !taskIdentifier) {
        return res.status(400).json({ message: 'Missing required fields: discordUserId, newStatus, or taskIdentifier.' });
    }

    const newStatusValue = typeof newStatusRequest === 'string' ? newStatusRequest : '';
    const validStatuses = Object.values(TaskStatus) as string[];
    if (!validStatuses.includes(newStatusValue as TaskStatus)) {
        return res.status(400).json({ message: `Invalid status: "${newStatusRequest}". Valid statuses are: ${validStatuses.join(', ')}` });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked. Use `!labnex link-account`.' });
        }
        const labnexUserId = link.userId;

        let task: ITask | null = null;

        const taskRefRegex = /^([A-Z0-9]{3,5})-([0-9]+)$/i;
        if (taskRefRegex.test(taskIdentifier)) {
            task = await Task.findOne({ taskReferenceId: taskIdentifier.toUpperCase() })
                         .populate('project', '_id owner members')
                         .populate('assignedTo', '_id');
        }

        if (!task && Types.ObjectId.isValid(taskIdentifier)) {
            task = await Task.findById(taskIdentifier)
                         .populate('project', '_id owner members')
                         .populate('assignedTo', '_id');
        }

        if (!task) {
            return res.status(404).json({ message: `Task not found with identifier "${taskIdentifier}".` });
        }

        const projectDoc = task.project as unknown as IProject;
        if (!projectDoc || !projectDoc._id) {
            console.error(`Task ${task._id} (Ref: ${task.taskReferenceId}) is missing valid project population.`);
            return res.status(500).json({ message: 'Error retrieving project details for task permission check.' });
        }

        const userRole = await Role.findOne({ userId: labnexUserId, projectId: projectDoc._id });
        
        const isProjectOwner = projectDoc.owner?.toString() === labnexUserId.toString();
        const hasUpdatePermissionRole = userRole && 
            (userRole.type === RoleType.PROJECT_OWNER || userRole.type === RoleType.TEST_MANAGER);
        
        const isAssignedUser = task.assignedTo && typeof task.assignedTo === 'object' && '_id' in task.assignedTo && 
                               (task.assignedTo as unknown as IUser)._id.toString() === labnexUserId.toString();

        if (!isProjectOwner && !hasUpdatePermissionRole && !isAssignedUser) {
            return res.status(403).json({ message: 'You do not have permission to update this task status.' });
        }

        task.status = newStatusValue as TaskStatus;
        await task.save();

        res.status(200).json({ 
            message: `Status of task "${task.title}" (Ref: ${task.taskReferenceId || task._id}) updated to ${task.status}.`,
            taskId: task._id,
            taskReferenceId: task.taskReferenceId,
            newStatus: task.status
        });

    } catch (error) {
        console.error('Error updating task status for Discord user:', error);
        res.status(500).json({ message: 'Server error while updating task status.' });
    }
};

interface LabnexTaskDetailsForAPI {
    id: string;
    taskReferenceId?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    project: { 
        id: string; 
        name: string;
        projectCode?: string;
    };
    assignee?: { id: string, name: string };
    reporter?: { id: string, name: string };
}

/**
 * @route   GET /api/integrations/discord/task-details/:taskIdentifier
 * @desc    Called by the Discord bot to fetch specific task details for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const getTaskDetailsForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId } = req.query; 
    const { taskIdentifier } = req.params; 

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }

    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }

    if (!taskIdentifier) {
        return res.status(400).json({ message: 'Missing task identifier.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(403).json({ message: 'Discord account not linked. Please link your account first.' });
        }
        const labnexUserId = link.userId;
        const labnexUser = await User.findById(labnexUserId);
        if (!labnexUser) {
            return res.status(404).json({ message: 'Labnex user not found.' });
        }

        let task: ITask | null = null;

        const taskRefRegex = /^([A-Z0-9]{3,5})-([0-9]+)$/i;
        const isTaskReferenceIdFormat = taskRefRegex.test(taskIdentifier);

        if (isTaskReferenceIdFormat) {
            task = await Task.findOne({ taskReferenceId: taskIdentifier.toUpperCase() })
                .populate({ path: 'project', select: 'name projectCode members owner' })
                .populate({ path: 'assignedTo', select: 'name email' })
                .populate({ path: 'createdBy', select: 'name email' });
        }

        if (!task && Types.ObjectId.isValid(taskIdentifier)) {
            task = await Task.findById(taskIdentifier)
                .populate({ path: 'project', select: 'name projectCode members owner' })
                .populate({ path: 'assignedTo', select: 'name email' })
                .populate({ path: 'createdBy', select: 'name email' });
        }
        
        if (!task) {
            const userProjects = await Project.find({
                $or: [{ owner: labnexUserId }, { members: labnexUserId }],
            }).select('_id');

            const userProjectIds = userProjects.map(p => p._id);

            task = await Task.findOne({
                title: { $regex: new RegExp(`^${taskIdentifier}$`, 'i') },
                $or: [
                    { project: { $in: userProjectIds } },
                    { createdBy: labnexUserId },
                    { assignedTo: labnexUserId }
                ]
            })
            .populate({ path: 'project', select: 'name projectCode members owner' })
            .populate({ path: 'assignedTo', select: 'name email' })
            .populate({ path: 'createdBy', select: 'name email' });
        }

        if (!task) {
            return res.status(404).json({ message: `Task not found with identifier "${taskIdentifier}".` });
        }

        const taskProject = task.project as unknown as IProject;
        const isProjectOwner = taskProject.owner?.toString() === labnexUserId.toString();
        const isProjectMember = taskProject.members?.some(memberId => memberId.toString() === labnexUserId.toString());
        const isTaskCreator = task.createdBy && (task.createdBy as unknown as IUser)._id.toString() === labnexUserId.toString();
        const isTaskAssignee = task.assignedTo && typeof task.assignedTo === 'object' && '_id' in task.assignedTo && (task.assignedTo as unknown as IUser)._id.toString() === labnexUserId.toString();

        if (!isProjectOwner && !isProjectMember && !isTaskCreator && !isTaskAssignee) {
            return res.status(403).json({ message: 'You do not have permission to view this task.' });
        }

        const taskDetails: LabnexTaskDetailsForAPI = {
            id: task._id.toString(),
            taskReferenceId: task.taskReferenceId,
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            project: {
                id: taskProject._id.toString(),
                name: taskProject.name,
                projectCode: taskProject.projectCode
            },
            assignee: task.assignedTo && typeof task.assignedTo === 'object' && '_id' in task.assignedTo ? {
                id: (task.assignedTo as unknown as IUser)._id.toString(),
                name: (task.assignedTo as unknown as IUser).name || 'N/A',
            } : undefined,
            reporter: task.createdBy && typeof task.createdBy === 'object' && '_id' in task.createdBy ? {
                id: (task.createdBy as unknown as IUser)._id.toString(),
                name: (task.createdBy as unknown as IUser).name || 'N/A',
            } : undefined,
        };

        res.status(200).json(taskDetails);

    } catch (error: any) {
        console.error(`Error fetching task details for Discord user (identifier: ${taskIdentifier}):`, error);
        res.status(500).json({ message: 'Server error while fetching task details.' });
    }
};

/**
 * @route   POST /api/integrations/discord/test-cases
 * @desc    Called by the Discord bot to create a new test case for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const createTestCaseForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const {
        discordUserId,
        projectIdentifier, 
        title,
        description,
        steps, 
        expectedResult,
        priority 
    } = req.body;

    if (!BOT_API_SECRET) {
        console.error('[createTestCaseForDiscordUser] CRITICAL: LABNEX_API_BOT_SECRET is not configured.');
        return res.status(500).json({ message: 'Server configuration error for test case creation.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret for test case creation.' });
    }

    if (!discordUserId || !projectIdentifier || !title || !steps || !expectedResult) {
        return res.status(400).json({ message: 'Missing required fields: discordUserId, projectIdentifier, title, steps, or expectedResult.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked. Please link your account first.' });
        }
        const labnexUser = await User.findById(link.userId);
        if (!labnexUser) {
            return res.status(404).json({ message: 'Associated Labnex user account not found.' });
        }

        let project: IProject | null = null;
        if (Types.ObjectId.isValid(projectIdentifier)) {
            project = await Project.findById(projectIdentifier);
        } else {
            const escapedIdentifier = projectIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            project = await Project.findOne({ 
                name: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') },
                $or: [{ owner: labnexUser._id }, { members: labnexUser._id }]
            });
        }

        if (!project) {
            return res.status(404).json({ message: `Project "${projectIdentifier}" not found or you do not have access to it.` });
        }

        const isOwner = project.owner.equals(labnexUser._id);
        const isMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUser._id));
        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'You do not have permission to create test cases in this project.' });
        }

        let parsedSteps: string[] = [];
        if (typeof steps === 'string') {
            parsedSteps = steps.split(/\\r?\\n|\\n/)
                               .map(step => step.replace(/^(\\d+\\.|-|\\*)\\s*/, '').trim())
                               .filter(step => step.length > 0);
        } else if (Array.isArray(steps)) {
            parsedSteps = steps.map(s => String(s).trim()).filter(s => s.length > 0);
        }

        if (parsedSteps.length === 0) {
            return res.status(400).json({ message: 'Test case must have at least one valid step.' });
        }

        const newTestCase = new TestCase({
            project: project._id,
            title,
            description: description || '',
            steps: parsedSteps,
            expectedResult,
            priority: priority || 'MEDIUM',
            createdBy: labnexUser._id,
            status: 'pending'
        });

        await newTestCase.save();
        
        const populatedTestCase = await TestCase.findById(newTestCase._id)
            .populate('project', 'name projectCode')
            .populate('createdBy', 'name');

        res.status(201).json({
            message: `Test Case "${populatedTestCase?.title}" created successfully in project "${(populatedTestCase?.project as any)?.name}".`,
            testCaseId: populatedTestCase?._id,
            title: populatedTestCase?.title,
            project: {
                id: (populatedTestCase?.project as any)?._id,
                name: (populatedTestCase?.project as any)?.name,
                projectCode: (populatedTestCase?.project as any)?.projectCode,
            }
        });

    } catch (error: any) {
        console.error(`[createTestCaseForDiscordUser] Error:`, error);
        if (error.code === 11000 && error.message.includes('project_1_title_1')) { 
            return res.status(409).json({ message: `A test case with the title "${title}" already exists in project "${projectIdentifier}". Please use a different title.` });
        }
        res.status(500).json({ message: 'Server error while creating test case. Please try again later.' });
    }
};

/**
 * @route   PUT /api/integrations/discord/test-cases/:testCaseIdentifier/status
 * @desc    Called by the Discord bot to update the status of a test case.
 * @access  Private (Bot authenticated by secret key)
 */
export const updateTestCaseStatusForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { testCaseIdentifier } = req.params;
    const { discordUserId, newStatus, projectIdentifier } = req.body; // projectIdentifier is optional

    if (!BOT_API_SECRET) {
        return res.status(500).json({ message: 'Server configuration error (Bot secret not set).' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !newStatus || !testCaseIdentifier) {
        return res.status(400).json({ message: 'Missing required fields: discordUserId, newStatus, or testCaseIdentifier.' });
    }

    const validStatuses = ['Pass', 'Fail', 'Pending'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status: "${newStatus}". Valid options are: Pass, Fail, Pending.` });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked. Use `!labnex link-account` or the /link command.' });
        }
        const labnexUserId = link.userId;

        let projectDoc: IProject | null = null;
        if (projectIdentifier) {
            if (Types.ObjectId.isValid(projectIdentifier)) {
                projectDoc = await Project.findById(projectIdentifier);
            } else {
                // Case-insensitive search for project name, ensuring user has access
                projectDoc = await Project.findOne({
                    name: { $regex: new RegExp(`^${projectIdentifier}$`, 'i') },
                    $or: [{ owner: labnexUserId }, { members: labnexUserId }]
                });
            }
            if (!projectDoc) {
                return res.status(404).json({ message: `Project "${projectIdentifier}" not found or you do not have access.` });
            }
        }

        let testCase;
        const query: any = {};

        if (Types.ObjectId.isValid(testCaseIdentifier)) {
            query._id = testCaseIdentifier;
        } else {
            query.title = { $regex: new RegExp(`^${testCaseIdentifier}$`, 'i') };
        }

        if (projectDoc) {
            query.project = projectDoc._id;
        }
        
        // If projectDoc is null (projectIdentifier was not provided), 
        // we need to ensure the test case belongs to a project the user can access.
        // This is more complex as a test case title might not be unique across all user projects.

        const testCasesFound = await TestCase.find(query).populate('project', 'name owner members');

        if (testCasesFound.length === 0) {
            let message = `Test case "${testCaseIdentifier}" not found`;
            if (projectDoc) {
                message += ` in project "${projectDoc.name}".`;
            }
            return res.status(404).json({ message });
        }

        // Filter testCasesFound to ensure user has access to the project of each test case
        const accessibleTestCases = testCasesFound.filter(tc => {
            const proj = tc.project as unknown as IProject;
            if (!proj) return false;
            return proj.owner.equals(labnexUserId) || proj.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUserId));
        });

        if (accessibleTestCases.length === 0) {
            // This means test cases were found by title, but none in projects accessible to the user,
            // OR if projectIdentifier was given, this specific check might be redundant if the initial projectDoc lookup was correct.
            return res.status(403).json({ message: `You do not have access to the project containing test case "${testCaseIdentifier}", or it was not found in the specified project.` });
        }
        
        if (accessibleTestCases.length > 1 && !projectIdentifier) {
            // This is the specific case where projectIdentifier was NOT given, and multiple test cases with the same title exist across user's accessible projects.
             return res.status(409).json({
                message: `Multiple test cases found with the name "${testCaseIdentifier}". Please specify the project. Usage: mark "${testCaseIdentifier}" as ${newStatus} in project "[Project Name/ID]"`,
                type: 'AMBIGUOUS_TEST_CASE' // Custom type to help bot decide next step
            });
        }

        testCase = accessibleTestCases[0];
        
        // Double-check user permission for the specific project of the chosen testCase (mostly for !projectIdentifier case)
        const finalProject = testCase.project as unknown as IProject;
        if (!finalProject.owner.equals(labnexUserId) && !finalProject.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUserId))) {
             return res.status(403).json({ message: `Error: You do not have permission to modify test cases in project "${finalProject.name}".` });
        }
        
        // Role check: Only Project Owner, Test Manager, or Tester can update test case status
        const userRole = await Role.findOne({ userId: labnexUserId, projectId: finalProject._id });
         if (!userRole || ![RoleType.PROJECT_OWNER, RoleType.TEST_MANAGER, RoleType.TESTER].includes(userRole.type)) {
            return res.status(403).json({ message: `You need to be a Project Owner, Test Manager, or Tester in project "${finalProject.name}" to update test case status.` });
        }

        testCase.status = newStatus.toLowerCase() as ITestCase['status'];
        testCase.lastUpdatedBy = labnexUserId;
        await testCase.save();

        res.status(200).json({
            message: `Test case "${testCase.title}" in project "${(testCase.project as unknown as IProject).name}" updated to ${newStatus}.`,
            testCaseId: testCase._id,
            title: testCase.title,
            newStatus: testCase.status,
            project: {
                id: (testCase.project as unknown as IProject)._id,
                name: (testCase.project as unknown as IProject).name
            }
        });

    } catch (error) {
        console.error('Error updating test case status for Discord user:', error);
        res.status(500).json({ message: 'Server error while updating test case status.' });
    }
};

/**
 * @route   GET /api/integrations/discord/projects/:projectIdentifier/test-cases
 * @desc    Called by the Discord bot to fetch test cases for a specific project.
 * @access  Private (Bot authenticated by secret key)
 */
export const getTestCasesForProject = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId } = req.query; // discordUserId from query parameters
    const { projectIdentifier } = req.params; // projectIdentifier from route parameters

    if (!BOT_API_SECRET) {
        console.error('[getTestCasesForProject] CRITICAL: LABNEX_API_BOT_SECRET is not configured.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }
    if (!projectIdentifier || typeof projectIdentifier !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid projectIdentifier in route parameters.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked to any Labnex account.' });
        }
        const labnexUserId = link.userId;

        let project: IProject | null = null;
        if (Types.ObjectId.isValid(projectIdentifier)) {
            project = await Project.findById(projectIdentifier);
        } else {
            // Case-insensitive search for project name
            project = await Project.findOne({ name: { $regex: new RegExp(`^${projectIdentifier}$`, 'i') } });
        }

        if (!project) {
            return res.status(404).json({ message: `Project not found with identifier: "${projectIdentifier}".` });
        }

        // Verify user has access to this project
        const userIsOwner = project.owner.equals(labnexUserId);
        const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUserId));

        if (!userIsOwner && !userIsMember) {
            return res.status(403).json({ message: `You do not have permission to view test cases for project "${project.name}".` });
        }

        // Fetch test cases for the project, limit to a reasonable number for display in Discord (e.g., 10)
        // Sorting by updatedAt descending to get the most recently active ones.
        const testCases = await TestCase.find({ project: project._id })
            .select('title status priority') 
            .sort({ updatedAt: -1 })
            .limit(10); // Limiting for now, pagination can be added later

        if (!testCases || testCases.length === 0) {
            return res.status(200).json({
                projectName: project.name,
                projectId: project._id,
                testCases: [] // Return empty array if no test cases found
            }); 
        }

        const testCaseData = testCases.map(tc => ({
            id: tc._id,
            title: tc.title,
            status: tc.status,
            priority: tc.priority
        }));

        res.status(200).json({
            projectName: project.name,
            projectId: project._id,
            testCases: testCaseData
        });

    } catch (error) {
        console.error('[getTestCasesForProject] Error fetching test cases:', error);
        res.status(500).json({ message: 'Server error while fetching test cases.' });
    }
};

/**
 * @route   PUT /api/integrations/discord/test-cases/:testCaseIdentifier/priority
 * @desc    Called by the Discord bot to update the priority of a test case.
 * @access  Private (Bot authenticated by secret key)
 */
export const updateTestCasePriorityForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { testCaseIdentifier } = req.params;
    const { discordUserId, newPriority, projectIdentifier } = req.body; // projectIdentifier is optional

    if (!BOT_API_SECRET) {
        return res.status(500).json({ message: 'Server configuration error (Bot secret not set).' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !newPriority || !testCaseIdentifier) {
        return res.status(400).json({ message: 'Missing required fields: discordUserId, newPriority, or testCaseIdentifier.' });
    }

    const normalizedPriority = newPriority.toLowerCase();
    if (!['low', 'medium', 'high'].includes(normalizedPriority)) {
        return res.status(400).json({ message: `Invalid priority value: "${newPriority}". Must be one of: Low, Medium, High.` });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked. Please use `!labnex link-account`.' });
        }
        const labnexUser = await User.findById(link.userId).select('_id name');
        if (!labnexUser) {
            return res.status(404).json({ message: 'Linked Labnex user not found.' });
        }

        let project: IProject | null = null;
        if (projectIdentifier && typeof projectIdentifier === 'string') {
            if (Types.ObjectId.isValid(projectIdentifier)) {
                project = await Project.findById(projectIdentifier);
            } else {
                project = await Project.findOne({ name: { $regex: new RegExp(`^${projectIdentifier.trim()}$`, 'i') } });
            }
            if (!project) {
                return res.status(404).json({ message: `Project "${projectIdentifier}" not found.` });
            }

            const userIsOwner = project.owner.equals(labnexUser._id);
            const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUser._id));

            if (!userIsOwner && !userIsMember) {
                return res.status(403).json({ message: `You do not have permission to access project "${project.name}".` });
            }
        }

        let testCase;
        const query: any = {};
        if (Types.ObjectId.isValid(testCaseIdentifier)) {
            query._id = testCaseIdentifier;
        } else {
            query.title = { $regex: new RegExp(`^${testCaseIdentifier.trim()}$`, 'i') };
        }
        
        if (project) {
            query.project = project._id;
        }

        // To ensure we pick the right test case if names are not unique across projects,
        // and no project context was given, we might need to ask user to specify project.
        // For now, if multiple are found without project context, we take the first one.
        // This could be enhanced by checking which projects the user has access to.
        const testCasesFound = await TestCase.find(query).populate('project', 'name owner members');

        if (!testCasesFound || testCasesFound.length === 0) {
            let message = `Test Case "${testCaseIdentifier}" not found.`;
            if (project) {
                message += ` in project "${project.name}".`;
            }
            return res.status(404).json({ message });
        }

        // Filter test cases to only those the user has access to
        const accessibleTestCases = testCasesFound.filter(tc => {
            const proj = tc.project as unknown as IProject;
            if (!proj || typeof proj.owner === 'undefined' || typeof proj.members === 'undefined') { 
                console.warn(`[updateTestCasePriority] Test case ${tc._id} has a project that is not fully populated or is invalid.`);
                return false; 
            }
            const userIsOwner = proj.owner.equals(labnexUser._id);
            const userIsMember = (proj.members as Types.ObjectId[]).some((memberId: Types.ObjectId) => memberId.equals(labnexUser._id));
            return userIsOwner || userIsMember;
        });

        if (accessibleTestCases.length === 0) {
            let message = `Test Case \"${testCaseIdentifier}\" not found or you do not have access to it`;
            if (project) {
                message += ` in project \"${project.name}\".`;
            }
            return res.status(404).json({ message });
        }
        
        if (accessibleTestCases.length > 1 && !project) {
            return res.status(400).json({
                message: `Multiple test cases found with the name \"${testCaseIdentifier}\". Please specify the project. ` +
                         `Matching projects: ${accessibleTestCases.map(tc => (tc.project as unknown as IProject).name).join(', ')}`
            });
        }

        testCase = accessibleTestCases[0];

        const testCaseProject = testCase.project as unknown as IProject;

        // Role check for updating test case priority
        const userRole = await Role.findOne({ userId: labnexUser._id, projectId: testCaseProject._id });

        // Corrected RoleType check: Only PROJECT_OWNER or TEST_MANAGER can update priority
        if (!userRole || 
            !(userRole.type === RoleType.PROJECT_OWNER || 
              userRole.type === RoleType.TEST_MANAGER)) {
            return res.status(403).json({ message: `You do not have permission to update test case priority in project \"${testCaseProject.name}\". Requires Project Owner or Test Manager role.` });
        }

        // Ensure priority is correctly cased for comparison and assignment
        const upperCaseNewPriority = newPriority.toUpperCase() as ITestCase['priority'];

        if (testCase.priority === upperCaseNewPriority) {
             return res.status(200).json({
                message: `Test Case \"${testCase.title}\" in project \"${testCaseProject.name}\" already has priority \"${newPriority}\". No changes made.`,
                testCaseId: testCase._id,
                title: testCase.title,
                oldPriority: testCase.priority,
                newPriority: upperCaseNewPriority,
                project: testCaseProject.name,
            });
        }

        testCase.priority = upperCaseNewPriority; // Assign strictly typed priority
        testCase.lastUpdatedBy = labnexUser._id as Types.ObjectId;
        await testCase.save();

        res.status(200).json({
            message: `Priority of Test Case \"${testCase.title}\" in project \"${testCaseProject.name}\" updated to \"${newPriority}\".`,
            testCaseId: testCase._id,
            title: testCase.title,
            priority: testCase.priority, // This will be the new uppercase priority
            project: testCaseProject.name,
            updatedBy: labnexUser.name
        });

    } catch (error) {
        console.error('Error updating test case priority for Discord user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        res.status(500).json({ message: `Server error while updating test case priority: ${errorMessage}` });
    }
};