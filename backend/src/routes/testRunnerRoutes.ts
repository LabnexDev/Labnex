import express from 'express';
import {
  createTestRun,
  getTestRun,
  getTestRunResults,
  cancelTestRun,
  listTestRuns,
  claimNextRun,
  updateRunProgress,
  completeRun,
} from '../controllers/testRunnerController';
import { auth } from '../middleware/auth';
import { authRunner } from '../middleware/runnerAuth';

const router = express.Router();

// All routes require authentication
// router.use(auth); // Removed global auth for this router

// Test run routes - Apply auth middleware individually
router.post('/projects/:projectId/test-runs', auth, createTestRun);
router.get('/projects/:projectId/test-runs', auth, listTestRuns);
router.get('/test-runs/:runId', auth, getTestRun);
router.get('/test-runs/:runId/results', auth, getTestRunResults);
router.post('/test-runs/:runId/cancel', auth, cancelTestRun);

// Cloud runner endpoints
router.patch('/test-runs/claim-next', authRunner, claimNextRun);
router.patch('/test-runs/:runId/progress', authRunner, updateRunProgress);
router.patch('/test-runs/:runId/complete', authRunner, completeRun);

export default router;
