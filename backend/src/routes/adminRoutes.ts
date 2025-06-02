import { Router } from 'express';
import { auth } from '../middleware/auth'; // Assuming auth.ts is where your main auth middleware is
import { authorizeAdmin } from '../middleware/auth'; // Assuming authorizeAdmin is also in auth.ts
import {
  getWaitlistEntries,
  approveWaitlistUser,
  createNewUser,
  getUserEngagementStats
} from '../controllers/adminController';

const router = Router();

// Get all waitlist entries
// GET /api/admin/waitlist
router.get(
  '/waitlist',
  auth,       // Ensure user is authenticated
  authorizeAdmin, // Ensure user is an admin
  getWaitlistEntries
);

// Approve a user from the waitlist
// POST /api/admin/waitlist/approve
router.post(
  '/waitlist/approve',
  auth,
  authorizeAdmin,
  approveWaitlistUser
);

// Create a new user (admin can specify role)
// POST /api/admin/users
router.post(
  '/users',
  auth,
  authorizeAdmin,
  createNewUser
);

// Get user engagement statistics
// GET /api/admin/user-engagement-stats
router.get(
  '/user-engagement-stats',
  auth,
  authorizeAdmin,
  getUserEngagementStats
);

export default router; 