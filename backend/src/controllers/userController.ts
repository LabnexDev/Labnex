import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { JwtPayload } from '../middleware/auth';
import { Role, SystemRoleType } from '../models/roleModel';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TestCase } from '../models/TestCase';
import { Note } from '../models/Note';
import { CodeSnippet } from '../models/CodeSnippet';
import mongoose from 'mongoose';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Search users by email or name
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const currentUser = req.user;

    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search for users by email or name, excluding the current user
    const users = await User.find({
      _id: { $ne: currentUser.id },
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email')
    .limit(10);

    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: currentUser.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      currentUser.id,
      { name, email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Update password
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(currentUser.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { emailNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      currentUser.id,
      { emailNotifications },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Error updating notification preferences' });
  }
};

// Delete own account
export const deleteMyAccount = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: 'Unauthorized - No user ID found in token' });
    }

    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required for account deletion' });
    }

    const user = await User.findById(currentUser.id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Current password is incorrect' });
    }

    const userId = new mongoose.Types.ObjectId(currentUser.id);

    // 1. Handle Projects, Tasks, and TestCases
    const projectsOwned = await Project.find({ owner: userId }).session(session);
    for (const project of projectsOwned) {
      await Task.deleteMany({ project: project._id }).session(session);
      await TestCase.deleteMany({ project: project._id }).session(session);
      await Project.findByIdAndDelete(project._id).session(session);
    }

    // Remove user from other projects' member lists
    await Project.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    ).session(session);

    // 2. Handle Tasks created by the user in projects not owned by them (if any left)
    // And unassign tasks assigned to the user
    await Task.deleteMany({ createdBy: userId, project: { $nin: projectsOwned.map(p => p._id) } }).session(session);
    await Task.updateMany({ assignedTo: userId }, { $unset: { assignedTo: "" } }).session(session);


    // 3. Handle TestCases created by the user in projects not owned by them (if any left)
    // And update lastUpdatedBy if it was the user
    await TestCase.deleteMany({ createdBy: userId, project: { $nin: projectsOwned.map(p => p._id) } }).session(session);
    await TestCase.updateMany({ lastUpdatedBy: userId }, { $unset: { lastUpdatedBy: "" } }).session(session);

    // 4. Delete Notes
    await Note.deleteMany({ userId: userId }).session(session);

    // 5. Delete CodeSnippets
    await CodeSnippet.deleteMany({ userId: userId }).session(session);
    
    // 6. Delete the user's system role
    await Role.deleteOne({ userId: userId, systemRole: { $exists: true } }).session(session);

    // 7. Delete the user
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Account and associated data deleted successfully' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting account:', error);
    // Check for specific error types if needed, e.g., transaction errors
    if (error instanceof mongoose.Error) {
        res.status(500).json({ message: 'Database error during account deletion.' });
    } else {
        res.status(500).json({ message: 'Error deleting account' });
    }
  }
}; 