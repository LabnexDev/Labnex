import express from 'express';
import { getPlatformStats, addWaitlistEntry } from '../controllers/statsController';

const router = express.Router();

// Custom middleware to bypass authentication for this endpoint
const allowPublicAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Simply call next() to proceed without adding any custom properties
  next();
};

// Endpoint to fetch platform statistics (publicly accessible, no auth middleware)
// TODO: Ensure this endpoint bypasses any global auth middleware
router.get('/platform-stats', allowPublicAccess, getPlatformStats);

// Endpoint to add a new waitlist entry
router.post('/waitlist', addWaitlistEntry);

export default router; 