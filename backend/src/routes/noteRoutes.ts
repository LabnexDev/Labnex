import express from 'express';
import {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    createNoteWithAI
} from '../controllers/noteController';
import { auth as protect } from '../middleware/auth'; // Use 'auth' and alias as 'protect' for consistency if needed, or just use 'auth'

const router = express.Router();

// All routes in this file are protected and require authentication
router.use(protect);

router.route('/')
    .get(getNotes)      // GET /api/notes - Get all notes for user (can filter by projectId query)
    .post(createNote);   // POST /api/notes - Create a new note

router.route('/ai') // New route for AI note creation
    .post(createNoteWithAI);

router.route('/:noteId')
    .put(updateNote)    // PUT /api/notes/:noteId - Update a specific note
    .delete(deleteNote);// DELETE /api/notes/:noteId - Delete a specific note

export default router; 