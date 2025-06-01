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
// router.use(auth); // Removed global auth for this router

// Test run routes - Apply auth middleware individually
router.post('/projects/:projectId/test-runs', auth, createTestRun);
router.get('/test-runs/:runId', auth, getTestRun);
router.get('/test-runs/:runId/results', auth, getTestRunResults);
router.post('/test-runs/:runId/cancel', auth, cancelTestRun);

export default router;
