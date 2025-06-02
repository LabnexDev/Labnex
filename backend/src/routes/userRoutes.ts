import express from 'express';
import { auth } from '../middleware/auth';
import { searchUsers, updateProfile, updatePassword, updateNotificationPreferences, deleteMyAccount } from '../controllers/userController';

const router = express.Router();

// Search users
router.get('/search', auth, searchUsers);

// Update user profile
router.put('/profile', auth, updateProfile);

// Update password
router.put('/password', auth, updatePassword);

// Update notification preferences
router.put('/notifications', auth, updateNotificationPreferences);

// Delete own account
router.delete('/me', auth, deleteMyAccount);

export default router; 