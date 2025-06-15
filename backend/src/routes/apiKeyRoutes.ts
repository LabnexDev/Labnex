import { Router } from 'express';
import { createApiKey, listApiKeys, revokeApiKey } from '../controllers/apiKeyController';
import { protect } from '../middleware/auth'; // Assuming a 'protect' middleware for standard user auth

const router = Router();

// All routes in this file are protected and require a logged-in user.
router.use(protect);

router.post('/', createApiKey);
router.get('/', listApiKeys);
router.delete('/:id', revokeApiKey);

export default router; 