import express from 'express';
import { auth } from '../middleware/auth';
import {
    createTask,
    getTasksForProject,
    getTaskById,
    updateTask,
    deleteTask
} from '../controllers/taskController';

const router = express.Router({ mergeParams: true }); // mergeParams allows us to access :projectId from parent router

// @route   POST /api/projects/:projectId/tasks
// @desc    Create a new task for a specific project
// @access  Private (Permissions checked in controller)
router.post('/', auth, createTask);

// @route   GET /api/projects/:projectId/tasks
// @desc    Get all tasks for a project
// @access  Private (Permissions checked in controller)
router.get('/', auth, getTasksForProject);

// @route   GET /api/projects/:projectId/tasks/:taskId
// @desc    Get a single task by ID
// @access  Private (Permissions checked in controller)
router.get('/:taskId', auth, getTaskById);

// @route   PUT /api/projects/:projectId/tasks/:taskId
// @desc    Update a task by ID
// @access  Private (Permissions checked in controller)
router.put('/:taskId', auth, updateTask);

// @route   DELETE /api/projects/:projectId/tasks/:taskId
// @desc    Delete a task by ID
// @access  Private (Permissions checked in controller)
router.delete('/:taskId', auth, deleteTask);

// TODO: Define other routes for tasks:
// router.delete('/:taskId', auth, deleteTask);

// Special route for "My Tasks" - might be top-level or user-specific
// router.get('/user/my-tasks', auth, getTasksForUser); // Example path, could be /api/tasks/my

export default router; 