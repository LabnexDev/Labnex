import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Role, SystemRoleType } from '../models/roleModel';

const generateToken = (user: { id: string; name: string; email: string; systemRole: SystemRoleType | null }) => {
  console.log('Generating token for user:', user.email, 'with role:', user.systemRole);
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    systemRole: user.systemRole,
  };
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions
  );
  console.log('Token generated successfully for user:', user.email);
  return token;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Create a default system role for the new user
    const userRole = await Role.create({
      userId: user._id,
      systemRole: SystemRoleType.ADMIN, // TEMPORARILY SET TO ADMIN FOR FIRST ADMIN CREATION
    });
    console.log('Default system role created for new user:', user.email, 'Role:', userRole.systemRole);

    // Generate token with user details and role
    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      systemRole: userRole.systemRole as SystemRoleType, // Use the role we just created
    });

    // Set token in HttpOnly cookie (good for web, but client also needs it for immediate use if not relying solely on cookies for API calls)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: (process.env.JWT_EXPIRES_IN_SECONDS ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS) : 7 * 24 * 60 * 60) * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          systemRole: userRole.systemRole as SystemRoleType, // Include role in response
        },
        token: token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error); // Added more specific logging
    // Check for duplicate key error for roles if the partial index isn't working as expected
    if (error.code === 11000 && error.keyPattern && error.keyPattern["userId"] === 1 && error.keyPattern["systemRole"] === 1) {
      return res.status(400).json({ message: 'User registration failed: Could not assign default role. This user might already have a system role.' });
    }
    res.status(400).json({ message: error.message || 'User registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt for email:', req.body.email);
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('User found, checking password');

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Password verified successfully for user:', user.email);

    // Update lastLoginAt timestamp
    user.lastLoginAt = new Date();
    await user.save();
    console.log('User lastLoginAt updated:', user.lastLoginAt);

    // Fetch user's system role
    let systemRole: SystemRoleType | null = null;
    const roleDoc = await Role.findOne({ userId: user._id, systemRole: { $exists: true } });
    if (roleDoc) {
      systemRole = roleDoc.systemRole as SystemRoleType;
    }
    console.log('User system role determined as:', systemRole);

    // Generate token with user details and role
    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      systemRole: systemRole,
    });

    // Set token in HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: (process.env.JWT_EXPIRES_IN_SECONDS ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS) : 7 * 24 * 60 * 60) * 1000,
    });

    console.log('Login successful, token cookie set for user:', user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          systemRole: systemRole,
        },
        token: token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      console.log('getMe: No user in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    console.log('getMe called, req.user (from token):', req.user);

    // req.user from token already has id, name, email, systemRole.
    // We just need to ensure the user still exists and fetch fresh, non-sensitive data.
    const userFromDb = await User.findById(req.user.id).select('-password');

    if (!userFromDb) {
      console.log('getMe: User not found in DB for id:', req.user.id);
      return res.status(401).json({ message: 'User not found' });
    }

    // The systemRole is already in req.user (from the JWT).
    // We trust the JWT for the role for this /me endpoint, as it's refreshed on login.
    // If a more robust role check directly from DB is needed here, we'd query Role model.
    // For now, let's use the role from the validated token.
    const systemRole = req.user.systemRole;

    console.log('getMe: User found, systemRole from token:', systemRole);
    
    res.json({ 
      success: true,
      data: { 
        user: {
          id: userFromDb._id,
          name: userFromDb.name,
          email: userFromDb.email,
          avatar: userFromDb.avatar,
          emailNotifications: userFromDb.emailNotifications,
          systemRole: systemRole, // Include systemRole from the token
        } 
      }
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(400).json({ message: error.message });
  }
}; 