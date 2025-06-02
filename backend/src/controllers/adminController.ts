import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { WaitlistEntry, IWaitlistEntry } from '../models/WaitlistEntry';
import { Role, SystemRoleType, IRole } from '../models/roleModel';
import crypto from 'crypto'; // For generating random passwords
import { sendEmail } from '../utils/emailService'; // Added import
import { getAccountCreationEmailHtml } from '../utils/emailTemplates'; // Added import

// Import additional models for engagement stats
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TestCase } from '../models/TestCase';
import { Note } from '../models/Note';
import { CodeSnippet } from '../models/CodeSnippet';

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
      
      // Fetch the existing user's role
      const existingUserRole = await Role.findOne({ userId: user._id });
      
      return res.status(200).json({ 
        success: true, 
        message: 'User already exists. Removed from waitlist.', 
        data: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          systemRole: existingUserRole?.systemRole || SystemRoleType.USER // Use fetched role or fallback
        }
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

    // Send account creation email
    const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'https://labnexdev.github.io/Labnex/login'; // Define login URL
    const emailHtml = getAccountCreationEmailHtml({
      userName: user.name,
      email: user.email,
      temporaryPassword: generatedPassword,
      loginUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: '🚀 Your Labnex Account is Ready!',
        html: emailHtml,
      });
      console.log(`Account creation email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`Failed to send account creation email to ${user.email}:`, emailError);
      // Potentially notify admin that email failed, but user was still created.
      // For now, the main operation succeeded.
    }
    
    // Update the response message to the admin
    res.status(201).json({
      success: true,
      message: 'User created successfully from waitlist entry. Account details emailed to user.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        systemRole: userRole.systemRole,
        // No longer sending generatedPasswordInfo directly, as email is sent.
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

/**
 * @desc    Get user engagement statistics
 * @route   GET /api/admin/user-engagement-stats
 * @access  Private/Admin
 */
export const getUserEngagementStats = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password').lean(); // .lean() for plain JS objects
    const engagementStats = [];

    for (const user of users) {
      const userId = user._id;

      // Get system role
      const roleDoc = await Role.findOne({ userId: userId, systemRole: { $exists: true } }).lean();

      // Get counts of various items
      const projectsOwnedCount = await Project.countDocuments({ owner: userId });
      const tasksCreatedCount = await Task.countDocuments({ createdBy: userId });
      const testCasesCreatedCount = await TestCase.countDocuments({ createdBy: userId });
      const notesCreatedCount = await Note.countDocuments({ userId: userId });
      const snippetsCreatedCount = await CodeSnippet.countDocuments({ userId: userId });

      engagementStats.push({
        id: userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        systemRole: roleDoc ? roleDoc.systemRole : null,
        projectsOwned: projectsOwnedCount,
        tasksCreated: tasksCreatedCount,
        testCasesCreated: testCasesCreatedCount,
        notesCreated: notesCreatedCount,
        snippetsCreated: snippetsCreatedCount,
      });
    }

    res.json({ success: true, data: engagementStats });

  } catch (error: any) {
    console.error('Error fetching user engagement stats:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user engagement stats' });
  }
}; 