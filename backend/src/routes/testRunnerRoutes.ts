import express from 'express';
import {
  createTestRun,
  getTestRun,
  getTestRunResults,
  cancelTestRun,
} from '../controllers/testRunnerController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Test run routes
router.post('/projects/:projectId/test-runs', createTestRun);
router.get('/test-runs/:runId', getTestRun);
router.get('/test-runs/:runId/results', getTestRunResults);
router.post('/test-runs/:runId/cancel', cancelTestRun);

export default router;
