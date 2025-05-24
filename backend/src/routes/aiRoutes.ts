import express from 'express';
import {
  generateTestCase,
  optimizeTestSuite,
  analyzeFailure,
} from '../controllers/aiController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// AI routes
router.post('/generate-test-case', generateTestCase);
router.post('/optimize-test-suite/:projectId', optimizeTestSuite);
router.post('/analyze-failure', analyzeFailure);

export default router;
