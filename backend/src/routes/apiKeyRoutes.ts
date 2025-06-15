import { Router } from 'express';
import { createApiKey, listApiKeys, revokeApiKey } from '../controllers/apiKeyController';
import { auth } from '../middleware/auth';

const router = Router();

// All routes in this file are protected and require a logged-in user.
router.use(auth);

router.post('/', createApiKey);
router.get('/', listApiKeys);
router.delete('/:id', revokeApiKey);

export default router; 