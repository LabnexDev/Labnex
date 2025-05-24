import express from 'express';
import {
    createSnippet,
    getSnippets,
    getSnippetById,
    updateSnippet,
    deleteSnippet,
    getAISuggestionForSnippet
} from '../controllers/codeSnippetController';
import { auth as protect } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all snippet routes
router.use(protect);

router.route('/')
    .post(createSnippet)    // POST /api/snippets
    .get(getSnippets);      // GET /api/snippets

router.route('/:snippetId')
    .get(getSnippetById)    // GET /api/snippets/:snippetId
    .put(updateSnippet)     // PUT /api/snippets/:snippetId
    .delete(deleteSnippet); // DELETE /api/snippets/:snippetId

router.route('/:snippetId/assist')
    .post(getAISuggestionForSnippet);

export default router; 