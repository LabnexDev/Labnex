import { Request, Response } from 'express';
import { Notification, NotificationStatus, NotificationType, INotification } from '../models/Notification';
import { Role, RoleType, SystemRoleType } from '../models/roleModel';
import { Project, IProject } from '../models/Project';
import { User } from '../models/User';
import mongoose, { Schema, Document } from 'mongoose';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    _id: string;
    name?: string;
  };
}

// Get all notifications for the current user
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id;
    console.log('Getting notifications for user:', userId);

    const notifications = await Notification.find({ userId })
      .populate('projectId', 'name')
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found notifications:', notifications.length);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Error getting notifications' });
  }
};

// Create a project invite notification
export const createProjectInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, projectId, roleType } = req.body;
    const senderId = req.user._id;
    console.log('Creating project invite:', { userId, projectId, roleType, senderId });

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      type: NotificationType.PROJECT_INVITE,
      status: NotificationStatus.PENDING,
      projectId,
      senderId,
      message: `You have been invited to join ${project.name} as a ${roleType.replace('_', ' ').toLowerCase()}`
    });

    console.log('Created notification:', notification);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating project invite:', error);
    res.status(500).json({ message: 'Error creating project invite' });
  }
};

// Accept a project invite
export const acceptProjectInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user._id;
    const { notificationId } = req.params;

    // Fetch the notification and ensure it includes assignedRoleType
    const notification = await Notification.findOne({
      _id: notificationId, userId, type: NotificationType.PROJECT_INVITE, status: NotificationStatus.PENDING
    }).populate('projectId') as INotification | null;

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or already processed' });
    }

    // Runtime check for populated projectId
    if (!notification.projectId || !(typeof notification.projectId === 'object' && '_id' in notification.projectId)) {
      console.error('Project data is missing or not populated on the notification for acceptance.', { notificationId });
      return res.status(500).json({ message: 'Error processing invite: Project data unavailable.' });
    }
    const populatedProject = notification.projectId as IProject;

    console.log('[Accept Invite] About to save notification status');
    notification.status = NotificationStatus.ACCEPTED;
    await notification.save();
    console.log('[Accept Invite] Notification status saved');

    console.log('[Accept Invite] About to update project members');
    await Project.findByIdAndUpdate(populatedProject._id, { $addToSet: { members: userId } });
    console.log('[Accept Invite] Project members updated');

    // Determine the role type: use assignedRoleType from notification, or default to TESTER
    const roleToAssign = notification.assignedRoleType || RoleType.TESTER;
    console.log(`[Accept Invite] Assigning role: ${roleToAssign}`);

    console.log('[Accept Invite] About to create or update role');
    await Role.findOneAndUpdate(
      { projectId: populatedProject._id, userId }, 
      { 
        type: roleToAssign, 
        systemRole: SystemRoleType.USER, // Ensure SystemRoleType is imported or defined
        projectId: populatedProject._id, 
        userId
      }, 
      { upsert: true, new: true, runValidators: true } 
    );
    console.log('[Accept Invite] Role created or updated');

    // Ensure user's name is available for the notification message
    let currentUserName = req.user.name;
    if (!currentUserName) {
      const currentUser = await User.findById(userId).select('name');
      if (currentUser) {
        currentUserName = currentUser.name;
      }
    }

    if (notification.senderId && currentUserName && populatedProject.name) {
      console.log('[Accept Invite] About to create sender notification for acceptance');
      await Notification.create({
        userId: notification.senderId,
        type: NotificationType.INVITE_ACCEPTED,
        status: NotificationStatus.PENDING,
        projectId: populatedProject._id,
        senderId: userId, // Current user who accepted
        message: `${currentUserName} accepted your invitation to join project ${populatedProject.name}.`
      });
      console.log('[Accept Invite] Sender notification created for acceptance');
    } else {
      console.warn('[Accept Invite] Skipped sender notification creation: missing senderId, user name, or project name.', 
                   { senderId: notification.senderId, userName: currentUserName, projectName: populatedProject.name });
    }
    res.status(200).json({ message: 'Project invite accepted' });
  } catch (error) {
    console.error('Error accepting project invite:', error);
    res.status(500).json({ message: 'Error accepting project invite' });
  }
};

// Reject a project invite
export const rejectProjectInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId, userId, type: NotificationType.PROJECT_INVITE, status: NotificationStatus.PENDING
    }).populate('projectId') as INotification | null;

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or already processed' });
    }

    let populatedProjectName = 'the project'; // Fallback
    let populatedProjectId: mongoose.Types.ObjectId | undefined = undefined;

    if (notification.projectId && typeof notification.projectId === 'object' && '_id' in notification.projectId) {
      const tempProject = notification.projectId as IProject;
      populatedProjectName = tempProject.name || populatedProjectName;
      populatedProjectId = tempProject._id; // Use the ObjectId directly
    }

    // If the project ID is known, remove user from project members and delete their role for this project
    if (populatedProjectId) {
      console.log('[Reject Invite] About to remove user from project members and delete role');
      await Project.findByIdAndUpdate(populatedProjectId, { $pull: { members: userId } });
      await Role.deleteOne({ projectId: populatedProjectId, userId });
      console.log('[Reject Invite] User removed from project members and role deleted');
    } else {
      console.warn('[Reject Invite] Project ID not available, cannot remove from members or delete role. Notification ID:', notificationId);
    }

    notification.status = NotificationStatus.REJECTED;
    await notification.save();

    // Ensure user's name is available for the notification message
    let currentUserName = req.user.name;
    if (!currentUserName) {
      const currentUser = await User.findById(userId).select('name');
      if (currentUser) {
        currentUserName = currentUser.name;
      }
    }

    if (notification.senderId && currentUserName) {
      await Notification.create({
        userId: notification.senderId,
        type: NotificationType.INVITE_REJECTED,
        status: NotificationStatus.PENDING,
        projectId: populatedProjectId, 
        senderId: userId, // Current user who rejected
        message: `${currentUserName} rejected your invitation to join ${populatedProjectName}.`
      });
    } else {
      console.warn('Could not create INVITE_REJECTED notification: missing senderId or user name.', 
                   { senderId: notification.senderId, userName: currentUserName, projectName: populatedProjectName });
    }
    res.status(200).json({ message: 'Project invite rejected' });
  } catch (error) {
    console.error('Error rejecting project invite:', error);
    res.status(500).json({ message: 'Error rejecting project invite' });
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { notificationId } = req.params;
    const userId = req.user._id;
    console.log('Marking notification as read:', { notificationId, userId });

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      console.log('Notification not found');
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.status = NotificationStatus.READ;
    await notification.save();

    console.log('Notification marked as read');
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id;
    console.log('Marking all notifications as read for user:', userId);

    await Notification.updateMany(
      { userId, status: { $ne: NotificationStatus.READ } },
      { status: NotificationStatus.READ }
    );

    console.log('All notifications marked as read');
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Delete a specific notification for the current user
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { notificationId } = req.params;
    const userId = req.user._id;
    console.log('Deleting notification:', { notificationId, userId });

    const result = await Notification.deleteOne({
      _id: notificationId,
      userId
    });

    if (result.deletedCount === 0) {
      console.log('Notification not found or user not authorized to delete');
      return res.status(404).json({ message: 'Notification not found or not authorized' });
    }

    console.log('Notification deleted successfully');
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
}; 