import { Request, Response, NextFunction } from 'express';

export function authRunner(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization') || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
  const expected = (process.env.RUNNER_TOKEN || '').trim();

  if (token !== expected) {
    console.warn('Runner token mismatch',
                 { providedLen: token.length, expectedLen: expected.length });
    return res.status(401).json({ success: false, error: 'Unauthorized runner' });
  }
  (req as any).runnerId = 'runner';
  next();
} 