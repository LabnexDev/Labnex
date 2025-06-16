import { Request, Response, NextFunction } from 'express';

export function authRunner(req: Request, res: Response, next: NextFunction) {
  const tokenHeader = req.headers['authorization'] || '';
  const token = tokenHeader.split(' ')[1]?.trim();
  const expected = (process.env.RUNNER_TOKEN || '').trim();
  console.log('[runnerAuth] provided="' + token + '" len=' + (token?.length || 0));
  console.log('[runnerAuth] expected ="' + expected + '" len=' + expected.length);

  if (!token || token !== expected) {
    console.warn('[runnerAuth] Token mismatch');
    return res.status(401).json({ success: false, error: 'Unauthorized runner' });
  }
  (req as any).runnerId = 'runner';
  next();
} 