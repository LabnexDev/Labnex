import { Router } from 'express';
import { handleSupportRequest } from '../controllers/support.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/contact', auth, handleSupportRequest);

export default router; 