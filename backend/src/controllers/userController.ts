import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

// Search users by email or name
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    const currentUser = req.user;

    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search for users by email or name, excluding the current user
    const users = await User.find({
      _id: { $ne: currentUser._id },
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
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: currentUser._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
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
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(currentUser._id);
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
    if (!currentUser?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { emailNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      currentUser._id,
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