import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const generateToken = (id: string) => {
  console.log('Generating token for user id:', id);
  const token = jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions
  );
  console.log('Token generated successfully');
  return token;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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
    console.log('Password verified successfully');

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful, sending response');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
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
    console.log('getMe called, req.user:', req.user);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.log('getMe: User not found for id:', req.user._id);
      return res.status(401).json({ message: 'User not found' });
    }
    console.log('getMe: User found, sending response');
    res.json({ 
      success: true,
      data: { user }
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(400).json({ message: error.message });
  }
}; 