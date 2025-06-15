import { Request, Response, NextFunction } from 'express';

export function authRunner(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  const expected = process.env.RUNNER_TOKEN;
  if (!expected) {
    console.error('RUNNER_TOKEN not set in env');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }
  if (token !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized runner' });
  }
  (req as any).runnerId = 'runner';
  next();
} 