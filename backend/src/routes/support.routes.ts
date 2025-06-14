import { Router } from 'express';
import { handleSupportRequest } from '../controllers/support.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/contact', optionalAuth, handleSupportRequest);

export default router; 