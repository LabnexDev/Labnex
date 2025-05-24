import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Task, TaskStatus, TaskPriority, ITask } from '../models/Task';
import { Project, IProject } from '../models/Project';
import { User } from '../models/User';
import { TestCase } from '../models/TestCase';
import { Role, RoleType } from '../models/roleModel'; // Corrected import path
import { Notification, NotificationType } from '../models/Notification'; // Added for task assignment notifications
import { getNextSequenceValue } from '../utils/sequenceUtils'; // Import the new utility

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create a new task within a project
 * @access  Private (Requires specific project roles)
 */
export const createTask = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, status, testCases, dueDate } = req.body;
    const createdBy = (req as any).user._id;

    if (!Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' });
    }

    try {
        // 1. Verify Project exists and get projectCode
        const projectDoc = await Project.findById(projectId).select('projectCode owner members'); // Select projectCode
        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        if (!projectDoc.projectCode) {
            // This should not happen if projectCode is required in the model and always set
            console.error(`Project ${projectId} is missing its projectCode.`);
            return res.status(500).json({ message: 'Project configuration error: missing project code.' });
        }

        // 2. Check user's role and permission in the project
        const userRole = await Role.findOne({ userId: createdBy, projectId: projectId });
        if (!userRole || 
            !(userRole.type === RoleType.PROJECT_OWNER || 
              userRole.type === RoleType.TEST_MANAGER)) {
            return res.status(403).json({ message: 'You do not have permission to create tasks in this project. Requires Project Owner or Test Manager role.' });
        }
        
        // 3. Validate assignedTo user (if provided)
        if (assignedTo) {
            if (!Types.ObjectId.isValid(assignedTo)) {
                return res.status(400).json({ message: 'Invalid assigned user ID.' });
            }
            const assignee = await User.findById(assignedTo);
            if (!assignee) {
                return res.status(404).json({ message: 'Assigned user not found.' });
            }
            // Check if assignee is part of the project (owner or member)
            const isAssigneeOwner = projectDoc.owner.equals(assignee._id);
            const isAssigneeMember = projectDoc.members.some((memberId: Types.ObjectId) => memberId.equals(assignee._id));
            if (!isAssigneeOwner && !isAssigneeMember) {
                return res.status(400).json({ message: 'Assigned user is not a member of this project.' });
            }
        }

        // 4. Validate testCases (if provided)
        if (testCases && testCases.length > 0) {
            for (const tcId of testCases) {
                if (!Types.ObjectId.isValid(tcId)) {
                    return res.status(400).json({ message: `Invalid TestCase ID: ${tcId}` });
                }
                const tc = await TestCase.findById(tcId);
                if (!tc) {
                    return res.status(404).json({ message: `TestCase not found: ${tcId}` });
                }
                if (!tc.project.equals(projectId)) {
                    return res.status(400).json({ message: `TestCase ${tcId} does not belong to project ${projectId}.` });
                }
            }
        }

        // 5. Generate taskReferenceId
        const counterName = `task_sequence_${projectDoc.projectCode}`;
        const sequenceNumber = await getNextSequenceValue(counterName);
        const taskReferenceId = `${projectDoc.projectCode}-${sequenceNumber}`;
        
        // 6. Create and save the new task
        const newTaskData: Partial<ITask> = {
            project: new Types.ObjectId(projectId),
            taskReferenceId, // Add the generated ID
            title,
            description,
            createdBy: new Types.ObjectId(createdBy),
            status: status || TaskStatus.TODO, 
            priority: priority || TaskPriority.MEDIUM,
        };
        if (assignedTo) newTaskData.assignedTo = new Types.ObjectId(assignedTo);
        if (testCases) newTaskData.testCases = testCases.map((tcId: string) => new Types.ObjectId(tcId));
        if (dueDate) newTaskData.dueDate = new Date(dueDate);

        const task = new Task(newTaskData);
        await task.save();

        // 7. Create notification for assigned user (if any)
        if (assignedTo && assignedTo !== createdBy.toString()) {
            await Notification.create({
                userId: assignedTo,
                type: NotificationType.TASK_ASSIGNED,
                message: `You have been assigned a new task: "${task.title}" in project "${projectDoc.name}".`,
                senderId: createdBy,
                projectId: projectId,
                // taskId: task._id // You might want to add taskId here if your Notification model supports it
            });
        }

        // Populate necessary fields for the response
        const populatedTask = await Task.findById(task._id)
            .populate('project', 'name projectCode') // Populate projectCode as well
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name');

        res.status(201).json(populatedTask);

    } catch (error: any) {
        console.error('Error creating task:', error);
        // Handle specific errors like unique constraint violation for taskReferenceId if necessary
        if (error.code === 11000 && error.keyValue && error.keyValue.taskReferenceId) {
            // This might happen in a rare race condition if the sequence generation had an issue
            // or if a taskReferenceId was manually inserted that collides.
            return res.status(500).json({ message: 'Failed to generate unique task reference ID. Please try again.' });
        }
        res.status(500).json({ message: 'Server error while creating task.' });
    }
};

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get all tasks for a specific project, with optional filtering and sorting
 * @access  Private (Requires project membership)
 */
export const getTasksForProject = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { status, assignedTo, priority, sortBy, sortOrder } = req.query;
    const userId = (req as any).user._id;

    if (!Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    try {
        const projectDoc = await Project.findById(projectId);
        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const userRole = await Role.findOne({ userId: userId, projectId: projectId });
        
        if (!userRole) {
            return res.status(403).json({ message: 'You are not a member of this project and cannot view its tasks.' });
        }

        const query: any = { project: projectId };
        if (status) query.status = status as string;
        if (priority) query.priority = priority as string;
        if (assignedTo && Types.ObjectId.isValid(assignedTo as string)) {
            query.assignedTo = assignedTo as string;
        }

        const sortOptions: any = {};
        if (sortBy && typeof sortBy === 'string') {
            sortOptions[sortBy] = (sortOrder === 'desc') ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('testCases', 'title')
            .sort(sortOptions);

        res.status(200).json(tasks);

    } catch (error) {
        console.error('Error fetching tasks for project:', error);
        res.status(500).json({ message: 'Server error while fetching tasks.' });
    }
};

/**
 * @route   GET /api/projects/:projectId/tasks/:taskId
 * @desc    Get a specific task by its ID
 * @access  Private (Requires project membership)
 */
export const getTaskById = async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;
    const userId = (req as any).user._id;

    if (!Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }
    if (!Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
    }

    try {
        const userRole = await Role.findOne({ userId: userId, projectId: projectId });
        if (!userRole) {
            const projectExists = await Project.findById(projectId);
            if (!projectExists) {
                return res.status(404).json({ message: 'Project not found.' });
            }
            return res.status(403).json({ message: 'You are not a member of this project and cannot view its tasks.' });
        }

        const task = await Task.findById(taskId)
            .populate('project', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('testCases');

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (task.project._id.toString() !== projectId) {
            console.warn(`Potential unauthorized access attempt: User ${userId} tried to access task ${taskId} via project ${projectId}, but task belongs to project ${task.project._id}.`);
            return res.status(404).json({ message: 'Task not found in this project.' }); 
        }

        res.status(200).json(task);

    } catch (error) {
        console.error('Error fetching task by ID:', error);
        res.status(500).json({ message: 'Server error while fetching task.' });
    }
};

// All CRUD operations implemented: createTask, getTasksForProject, getTaskById, updateTask, deleteTask, getMyAssignedTasks 

/**
 * @route   PUT /api/projects/:projectId/tasks/:taskId
 * @desc    Update an existing task
 * @access  Private (Project Owner/Test Manager or assigned user for status updates)
 */
export const updateTask = async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;
    const userId = (req as any).user._id;
    const updateData = req.body;

    if (!Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }
    if (!Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
    }

    try {
        const projectDoc = await Project.findById(projectId);
        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        let task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const originalAssignedToBeforeUpdate = task.assignedTo ? task.assignedTo.toString() : null;

        if (task.project.toString() !== projectId) {
            return res.status(404).json({ message: 'Task not found in this project.' });
        }

        const userRole = await Role.findOne({ userId: userId, projectId: projectId });

        const isProjectOwnerOrManager = userRole && 
            (userRole.type === RoleType.PROJECT_OWNER || userRole.type === RoleType.TEST_MANAGER);

        const isAssignedUser = task.assignedTo && task.assignedTo.equals(userId);

        if (!isProjectOwnerOrManager && !isAssignedUser) {
            return res.status(403).json({ message: 'You do not have permission to update this task.' });
        }

        if (isAssignedUser && !isProjectOwnerOrManager) {
            if (Object.keys(updateData).length !== 1 || !updateData.hasOwnProperty('status')) {
                return res.status(403).json({ message: 'As an assigned user, you can only update the task status.' });
            }
        }

        if (isProjectOwnerOrManager) {
            if (updateData.title !== undefined) task.title = updateData.title;
            if (updateData.description !== undefined) task.description = updateData.description;
            if (updateData.priority !== undefined) {
                if (!Object.values(TaskPriority).includes(updateData.priority)) {
                    return res.status(400).json({ message: 'Invalid task priority.' });
                }
                task.priority = updateData.priority;
            }
            if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;

            if (updateData.assignedTo !== undefined) {
                if (updateData.assignedTo === null) {
                    task.assignedTo = undefined;
                } else {
                    if (!Types.ObjectId.isValid(updateData.assignedTo)) {
                        return res.status(400).json({ message: 'Invalid assigned user ID.' });
                    }
                    const assignee = await User.findById(updateData.assignedTo);
                    if (!assignee) {
                        return res.status(404).json({ message: 'Assigned user not found.' });
                    }
                    const isAssigneeOwner = projectDoc.owner.equals(assignee._id);
                    const isAssigneeMember = projectDoc.members.some((memberId: Types.ObjectId) => memberId.equals(assignee._id));
                    if (!isAssigneeOwner && !isAssigneeMember) {
                        return res.status(400).json({ message: 'Assigned user is not a member of this project.' });
                    }
                    task.assignedTo = updateData.assignedTo;
                }
            }

            if (updateData.testCases !== undefined) {
                if (!Array.isArray(updateData.testCases)) {
                     return res.status(400).json({ message: 'testCases must be an array.' });
                }
                for (const tcId of updateData.testCases) {
                    if (!Types.ObjectId.isValid(tcId)) {
                        return res.status(400).json({ message: `Invalid TestCase ID: ${tcId}` });
                    }
                    const tc = await TestCase.findById(tcId);
                    if (!tc) {
                        return res.status(404).json({ message: `TestCase not found: ${tcId}` });
                    }
                    if (!tc.project.equals(projectId)) {
                        return res.status(400).json({ message: `TestCase ${tcId} does not belong to project ${projectId}.` });
                    }
                }
                task.testCases = updateData.testCases;
            }
        }

        if (updateData.status !== undefined) {
            if (!Object.values(TaskStatus).includes(updateData.status)) {
                return res.status(400).json({ message: 'Invalid task status.' });
            }
            task.status = updateData.status;
        }

        await task.save();
        
        const populatedUpdatedTask = await Task.findById(task._id)
            .populate('project', 'name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('testCases', 'title');

        // Create notification if assignedTo changed to a new user
        const newAssignedToAfterUpdate = populatedUpdatedTask?.assignedTo ? (populatedUpdatedTask.assignedTo as any)._id.toString() : null;

        if (newAssignedToAfterUpdate && newAssignedToAfterUpdate !== originalAssignedToBeforeUpdate && populatedUpdatedTask?.project) {
            try {
                const project = populatedUpdatedTask.project as unknown as { name: string; _id: Types.ObjectId }; 
                
                await Notification.create({
                    userId: newAssignedToAfterUpdate,
                    type: NotificationType.TASK_ASSIGNED,
                    message: `Task "${populatedUpdatedTask.title}" in project "${project.name}" has been assigned to you.`,
                    projectId: project._id,
                    senderId: userId, // User who performed the update
                });
            } catch (notificationError) {
                console.error('Failed to create task assignment notification during task update:', notificationError);
                // Do not fail the main operation if notification fails
            }
        }

        res.status(200).json(populatedUpdatedTask);

    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task.' });
    }
};

/**
 * @route   DELETE /api/projects/:projectId/tasks/:taskId
 * @desc    Delete a task
 * @access  Private (Requires Project Owner or Test Manager role)
 */
export const deleteTask = async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;
    const userId = (req as any).user._id;

    if (!Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }
    if (!Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID.' });
    }

    try {
        const projectDoc = await Project.findById(projectId);
        if (!projectDoc) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (task.project.toString() !== projectId) {
            return res.status(404).json({ message: 'Task not found in this project.' });
        }

        const userRole = await Role.findOne({ userId: userId, projectId: projectId });
        if (!userRole || 
            !(userRole.type === RoleType.PROJECT_OWNER || 
              userRole.type === RoleType.TEST_MANAGER)) {
            return res.status(403).json({ message: 'You do not have permission to delete tasks in this project. Requires Project Owner or Test Manager role.' });
        }

        await Task.findByIdAndDelete(taskId);

        res.status(200).json({ message: 'Task deleted successfully.' });

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error while deleting task.' });
    }
};

/**
 * @route   GET /api/tasks/my
 * @desc    Get all tasks assigned to the current user, with optional filtering and sorting
 * @access  Private
 */
export const getMyAssignedTasks = async (req: Request, res: Response) => {
    const { projectId, status, priority, sortBy, sortOrder } = req.query;
    const userId = (req as any).user._id;

    try {
        const query: any = { assignedTo: userId };
        if (projectId && Types.ObjectId.isValid(projectId as string)) {
            query.project = projectId as string;
        }
        if (status) query.status = status as string;
        if (priority) query.priority = priority as string;

        const sortOptions: any = {};
        if (sortBy && typeof sortBy === 'string') {
            sortOptions[sortBy] = (sortOrder === 'desc') ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const tasks = await Task.find(query)
            .populate('project', '_id name')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('testCases', 'title')
            .sort(sortOptions);

        res.status(200).json(tasks);

    } catch (error) {
        console.error('Error fetching assigned tasks for user:', error);
        res.status(500).json({ message: 'Server error while fetching assigned tasks.' });
    }
}; 