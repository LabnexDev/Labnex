import express from 'express';
import { auth } from '../middleware/auth'; // Corrected path to singular 'middleware'
import {
    getBotStatus,
    startBot,
    stopBot
} from '../controllers/botStatus.controller';

const router = express.Router();

// Bot status and management routes
// All routes are for a specific bot identified by :botId (e.g., 'labnexAI')

// Get status of a bot
router.get('/:botId/status', auth, getBotStatus);

// Start a bot
router.post('/:botId/start', auth, startBot);

// Stop a bot
router.post('/:botId/stop', auth, stopBot);

export default router; 