import express from 'express';
import {
  generateTestCase,
  optimizeTestSuite,
  analyzeFailure,
  interpretTestStep,
  suggestAlternative,
  getDynamicSelectorSuggestion,
  analyzeFailureConversational,
  chatWithAI,
} from '../controllers/aiController';
import { auth } from '../middleware/auth';
import { fetchMessages, saveMessage } from '../controllers/aiMessageController';
import { createSession, listSessions, deleteSession } from '../controllers/aiSessionController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// AI routes
router.post('/generate-test-case', generateTestCase);
router.post('/optimize-test-suite/:projectId', optimizeTestSuite);
router.post('/analyze-failure/:testRunId/:failureId', analyzeFailure);
router.post('/analyze-failure/conversational', analyzeFailureConversational);
router.post('/interpret', interpretTestStep);
router.post('/suggest-alternative', suggestAlternative);
router.post('/suggest-selector', getDynamicSelectorSuggestion);
router.post('/chat', chatWithAI);

// Chat memory
router.get('/messages', fetchMessages);
router.post('/message', saveMessage);

// Sessions
router.post('/session', createSession);
router.get('/sessions', listSessions);
router.delete('/session/:id', deleteSession);

export default router;
