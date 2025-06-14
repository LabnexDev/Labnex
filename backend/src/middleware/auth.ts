import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SystemRoleType } from '../models/roleModel';
import cookieParser from 'cookie-parser';

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRoleType | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Auth middleware: Attempting to authenticate path: ${req.path}`);
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Auth middleware: Token found in cookie.');
  } else {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('Auth middleware: Token found in Authorization header.');
    }
  }

  if (!token) {
    console.log('Auth middleware: No token provided in cookie or Authorization header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    console.log('Auth middleware: Verifying token');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set.' });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log('Auth middleware: Token verified, decoded payload:', decoded);

    req.user = decoded;
    
    console.log('Auth middleware: User authenticated successfully, req.user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`OptionalAuth middleware: Checking for token on path: ${req.path}`);
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('OptionalAuth middleware: Token found in cookie.');
  } else {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('OptionalAuth middleware: Token found in Authorization header.');
    }
  }

  if (!token) {
    console.log('OptionalAuth middleware: No token provided, proceeding as guest.');
    return next();
  }

  try {
    console.log('OptionalAuth middleware: Verifying token.');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
      // Don't expose server configuration errors to the client, just log and proceed as guest.
      return next();
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log('OptionalAuth middleware: Token verified, attaching user to request.');
    req.user = decoded;
    next();
  } catch (error) {
    console.warn('OptionalAuth middleware: Token provided but is invalid. Proceeding as guest.', error);
    // If token is invalid (expired, etc.), just proceed without authenticating the user.
    next();
  }
};

// Middleware to authorize admin users
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.systemRole !== SystemRoleType.ADMIN) {
    console.log('Authorization failed: User is not an admin. User:', req.user);
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  console.log('Admin authorization successful for user:', req.user.email);
  next();
}; 