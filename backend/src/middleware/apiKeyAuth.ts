import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import ApiKey from '../models/apiKey';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // no key → let downstream auth handle / or public route
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (token.length < 10) {
    return res.status(401).json({ message: 'Invalid API token.' });
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  try {
    const apiKeyDoc = await ApiKey.findOne({ hashedKey: hashed }).populate('user');
    if (!apiKeyDoc) {
      return res.status(401).json({ message: 'API key not recognised.' });
    }

    // Update lastUsedAt asynchronously (do not block request)
    apiKeyDoc.lastUsedAt = new Date();
    apiKeyDoc.save().catch((e) => console.error('Failed to update lastUsedAt for API key', e));

    const userAny = apiKeyDoc.user as any;
    (req as any).user = {
      id: userAny._id.toString(),
      name: userAny.name,
      email: userAny.email,
      systemRole: userAny.systemRole || null,
    };
    (req as any).apiKeyId = apiKeyDoc._id.toString();

    return next();
  } catch (err) {
    console.error('apiKeyAuth error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 