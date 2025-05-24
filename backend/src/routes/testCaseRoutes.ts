import express from 'express';
import { auth } from '../middleware/auth';
import {
  createTestCase,
  getTestCases,
  getTestCase,
  updateTestCase,
  deleteTestCase,
  updateTestCaseStatus,
} from '../controllers/testCaseController';

const router = express.Router({ mergeParams: true });

router.use(auth);

router.post('/', createTestCase);
router.get('/', getTestCases);
router.get('/:testCaseId', getTestCase);
router.put('/:testCaseId', updateTestCase);
router.patch('/:testCaseId/status', updateTestCaseStatus);
router.delete('/:testCaseId', deleteTestCase);

export default router; 