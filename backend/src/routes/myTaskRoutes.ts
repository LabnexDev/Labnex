import express from 'express';
import { auth } from '../middleware/auth'; // Assuming your auth middleware is here
import { getMyAssignedTasks } from '../controllers/taskController';

const router = express.Router();

/**
 * @route   GET /api/tasks/my
 * @desc    Get all tasks assigned to the current authenticated user
 * @access  Private
 */
router.get('/my', auth, getMyAssignedTasks);

export default router; 