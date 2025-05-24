import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Auth middleware: Request received');
    console.log('Auth middleware: Headers:', req.headers);
    console.log('Auth middleware: Checking authorization header');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('Auth middleware: No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Auth middleware: Verifying token');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
      // Option 1: Exit the process (safer for production)
      // process.exit(1);
      // Option 2: Throw an error to be caught by a global error handler (if you have one)
      // throw new Error('JWT_SECRET is not defined.');
      // Option 3: For now, returning an error response. Consider a more robust shutdown for unrecoverable errors.
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set.' });
    }
    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log('Auth middleware: Token verified, user id:', decoded.id);

    const user = await User.findById(decoded.id);
    console.log('Auth middleware: User lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      console.log('Auth middleware: User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    // Set the user ID as _id to match the model
    req.user = { _id: user._id.toString() };
    console.log('Auth middleware: User authenticated successfully, user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Please authenticate' });
  }
}; 