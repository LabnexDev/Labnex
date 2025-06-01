import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { WaitlistEntry, IWaitlistEntry } from '../models/WaitlistEntry';
import { Role, SystemRoleType, IRole } from '../models/roleModel';
import crypto from 'crypto'; // For generating random passwords

// Helper function to generate a random password
const generateRandomPassword = (length: number = 12): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * @desc    Get all waitlist entries
 * @route   GET /api/admin/waitlist
 * @access  Private/Admin
 */
export const getWaitlistEntries = async (req: Request, res: Response) => {
  try {
    const waitlistEntries = await WaitlistEntry.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: waitlistEntries });
  } catch (error: any) {
    console.error('Error fetching waitlist entries:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching waitlist entries' });
  }
};

/**
 * @desc    Approve a waitlist user, create their account, and remove from waitlist
 * @route   POST /api/admin/waitlist/approve
 * @access  Private/Admin
 */
export const approveWaitlistUser = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const waitlistEntry = await WaitlistEntry.findOne({ email });
    if (!waitlistEntry) {
      return res.status(404).json({ success: false, message: 'Email not found in waitlist' });
    }

    let user = await User.findOne({ email });
    if (user) {
      // User already exists, remove from waitlist and inform admin
      await WaitlistEntry.deleteOne({ email });
      return res.status(200).json({ 
        success: true, 
        message: 'User already exists. Removed from waitlist.', 
        data: { id: user._id, name: user.name, email: user.email, systemRole: req.user?.systemRole } // Assuming role might be known or fetched
      });
    }

    // Create new user
    const generatedPassword = generateRandomPassword();
    const userName = email.split('@')[0]; // Basic name generation

    user = new User({
      name: userName,
      email,
      password: generatedPassword, // Password will be hashed by the pre-save hook in User model
    });
    await user.save();

    // Assign system role USER
    const userRole = await Role.create({
      userId: user._id,
      systemRole: SystemRoleType.USER,
    });

    // Remove from waitlist
    await WaitlistEntry.deleteOne({ _id: waitlistEntry._id });

    console.log(`User ${email} approved from waitlist. Password (dev only): ${generatedPassword}`);
    // IMPORTANT: In a real scenario, you would not log the password.
    // You would email it or have a password reset flow.

    res.status(201).json({
      success: true,
      message: 'User created successfully from waitlist entry.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        systemRole: userRole.systemRole,
        // Advise admin about the generated password (in a real app, this would be an email to user)
        generatedPasswordInfo: 'A random password was generated. Inform the user or use a password reset flow.'
      },
    });

  } catch (error: any) {
    console.error('Error approving waitlist user:', error);
    res.status(500).json({ success: false, message: 'Server error while approving waitlist user' });
  }
};

/**
 * @desc    Create a new user (admin, user, etc.)
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createNewUser = async (req: Request, res: Response) => {
  const { name, email, password, systemRole } = req.body;

  if (!name || !email || !password || !systemRole) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and systemRole are required' });
  }

  if (!Object.values(SystemRoleType).includes(systemRole as SystemRoleType)) {
    return res.status(400).json({ success: false, message: 'Invalid systemRole provided' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email,
      password, // Password will be hashed by pre-save hook
    });
    await user.save();

    const newUserRole = await Role.create({
      userId: user._id,
      systemRole: systemRole as SystemRoleType,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        systemRole: newUserRole.systemRole,
      },
    });

  } catch (error: any) {
    console.error('Error creating new user:', error);
    // Handle potential role creation error (e.g., duplicate system role for a user)
    if (error.code === 11000 && error.message.includes('Role validation failed') || error.message.includes('E11000 duplicate key error collection: labnex-dev.roles index: userId_1_systemRole_1')) {
      // Attempt to clean up the created user if role assignment failed
      await User.deleteOne({ email: email });
      return res.status(400).json({ success: false, message: 'Failed to assign role. User with this email might already have a system role. User creation rolled back.'});
    }
    res.status(500).json({ success: false, message: 'Server error while creating user' });
  }
}; 