import express from 'express';
import { auth } from '../middleware/auth';
import {
  assignRole,
  getProjectRoles,
  removeRole,
  getUserRole,
  searchUsers
} from '../controllers/roleController';

const router = express.Router();

// Search users
router.get('/search', auth, searchUsers);

// Assign role to user
router.post('/assign', auth, assignRole);

// Get all roles for a project
router.get('/project/:projectId', auth, getProjectRoles);

// Get user's role for a project
router.get('/project/:projectId/user', auth, getUserRole);

// Remove role from user
router.delete('/project/:projectId/user/:userId', auth, removeRole);

export default router; 