import express from 'express';
import { auth } from '../middleware/auth';
import { authRunner } from '../middleware/runnerAuth';
import {
  createTestCase,
  getTestCases,
  getTestCase,
  updateTestCase,
  deleteTestCase,
  updateTestCaseStatus,
} from '../controllers/testCaseController';

const router = express.Router({ mergeParams: true });

router.post('/', createTestCase);
router.get('/', getTestCases);
router.get('/runner/:testCaseId', authRunner, getTestCase);
router.use(auth);
router.put('/:testCaseId', updateTestCase);
router.patch('/:testCaseId/status', updateTestCaseStatus);
router.delete('/:testCaseId', deleteTestCase);
router.get('/:testCaseId', getTestCase);

export default router; 