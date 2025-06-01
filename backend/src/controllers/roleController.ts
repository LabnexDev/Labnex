import { Request, Response } from 'express';
import { Role, RoleType, SystemRoleType } from '../models/roleModel';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { Notification, NotificationType, NotificationStatus } from '../models/Notification';
import mongoose from 'mongoose';
import { JwtPayload } from '../middleware/auth';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Assign a role to a user for a project
export const assignRole = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, projectId, roleType } = req.body;
    console.log('Initiating invitation (assignRole):', { userId, projectId, roleType, currentUserId: currentUser.id });

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if current user is project owner
    if (project.owner.toString() !== currentUser.id.toString()) {
        // Attempt to find an explicit PROJECT_OWNER role if direct owner check fails or is not the sole method
        const currentUserOwnerRole = await Role.findOne({
            projectId,
            userId: currentUser.id,
            type: RoleType.PROJECT_OWNER
        });
        if (!currentUserOwnerRole) {
            console.log('User is not project owner:', { userId: currentUser.id, projectId });
            return res.status(403).json({ message: 'Only project owners can assign roles or invite users.' });
        }
    }

    // Get the invited user's details
    const invitedUser = await User.findById(userId);
    if (!invitedUser) {
      console.log('Invited user not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // DO NOT create or update the Role here. This will be handled upon invite acceptance.

    // Create project invite notification for the invited user, including the assignedRoleType
    const inviteNotification = await Notification.create({
      userId,
      type: NotificationType.PROJECT_INVITE,
      status: NotificationStatus.PENDING,
      projectId,
      senderId: currentUser.id,
      message: `You have been invited to join ${project.name} as a ${roleType.replace('_', ' ').toLowerCase()}.`,
      assignedRoleType: roleType as RoleType
    });

    // Optional: Create notification for the sender to track the invite (if desired)
    // Consider if this is redundant if the main invite is already tracked elsewhere or via UI
    await Notification.create({
      userId: currentUser.id,
      type: NotificationType.PROJECT_INVITE_SENT,
      status: NotificationStatus.PENDING, // Or another status like 'INFO' if it doesn't require action
      projectId,
      senderId: userId, // In this context, senderId might refer to the invitee for the sender's notification
      message: `You invited ${invitedUser.name} to join ${project.name} as a ${roleType.replace('_', ' ').toLowerCase()}.`
      // No assignedRoleType needed for the sender's own tracking notification
    });

    console.log('Project invitation sent successfully via assignRole flow, notification ID:', inviteNotification._id);
    // Return the notification or a success message. 
    // Returning the role is no longer appropriate as it's not created here.
    res.status(200).json({ 
      message: 'Invitation sent successfully.', 
      notificationId: inviteNotification._id 
    });

  } catch (error) {
    console.error('Error in assignRole (invitation flow):', error);
    // It's crucial to check the type of roleType before using it as RoleType
    const { roleType } = req.body;
    if (!Object.values(RoleType).includes(roleType as RoleType)) {
      return res.status(400).json({ message: `Invalid roleType: ${roleType}` });
    }
    res.status(500).json({ message: 'Error processing invitation' });
  }
};

// Get all roles for a project
export const getProjectRoles = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    console.log('Getting project roles:', { projectId, userId: currentUser.id });

    // Check if user has access to project
    const userRole = await Role.findOne({
      projectId,
      userId: currentUser.id
    });

    if (!userRole) {
      console.log('User has no role in project:', { userId: currentUser.id, projectId });
      return res.status(403).json({ message: 'Access denied' });
    }

    const roles = await Role.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found roles:', roles.length);
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error getting project roles:', error);
    res.status(500).json({ message: 'Error getting project roles' });
  }
};

// Remove a role from a user
export const removeRole = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, projectId } = req.params;
    console.log('Removing role:', { userId, projectId, currentUserId: currentUser.id });

    // Check if current user is project owner
    const currentUserRole = await Role.findOne({
      projectId,
      userId: currentUser.id,
      type: RoleType.PROJECT_OWNER
    });

    if (!currentUserRole) {
      console.log('User is not project owner:', { userId: currentUser.id, projectId });
      return res.status(403).json({ message: 'Only project owners can remove roles' });
    }

    // Don't allow removing the last project owner
    if (userId === currentUser.id.toString()) {
      const ownerCount = await Role.countDocuments({
        projectId,
        type: RoleType.PROJECT_OWNER
      });

      if (ownerCount <= 1) {
        console.log('Cannot remove last project owner');
        return res.status(400).json({ message: 'Cannot remove the last project owner' });
      }
    }

    await Role.findOneAndDelete({ projectId, userId });
    console.log('Role removed successfully');
    res.status(200).json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ message: 'Error removing role' });
  }
};

// Get user's role for a project
export const getUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.params;
    console.log('Getting user role:', { projectId, userId: currentUser.id });

    const role = await Role.findOne({
      projectId,
      userId: currentUser.id
    }).populate('userId', 'name email');

    console.log('Role found:', role);

    if (!role) {
      console.log('No role found for user in project');
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json(role);
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({ message: 'Error getting user role' });
  }
};

// Search users by email or name
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { query } = req.query;
    console.log('Searching users with query:', query);

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).select('name email');

    console.log('Found users:', users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
}; 