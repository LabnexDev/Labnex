import express from 'express';
import { searchController } from '../controllers/searchController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Search projects
router.get('/projects', auth, searchController.searchProjects);

// Search test cases
router.get('/test-cases', auth, searchController.searchTestCases);

export default router; 