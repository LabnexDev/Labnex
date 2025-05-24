import express from 'express';
import { auth } from '../middleware/auth';
import {
  getNotifications,
  createProjectInvite,
  acceptProjectInvite,
  rejectProjectInvite,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController';

const router = express.Router();

// Get all notifications for the current user
router.get('/', auth, getNotifications);

// Create a project invite notification
router.post('/invite', auth, createProjectInvite);

// Accept a project invite
router.put('/:notificationId/accept', auth, acceptProjectInvite);

// Reject a project invite
router.put('/:notificationId/reject', auth, rejectProjectInvite);

// Mark notification as read
router.put('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read
router.put('/read-all', auth, markAllAsRead);

// Delete a specific notification
router.delete('/:notificationId', auth, deleteNotification);

export default router; 