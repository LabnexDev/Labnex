import express, { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getDashboardData
} from '../controllers/projectController';
import testCaseRoutes from './testCaseRoutes';
import taskRoutes from './taskRoutes';

const router: Router = express.Router();

// Log all requests to project routes
router.use((req, res, next) => {
  console.log('Project route accessed:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

router.use(auth);

router.post('/', createProject);
router.get('/', getProjects);
// Dashboard route must come before :id route
router.get('/dashboard', getDashboardData);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Mount test case routes nested under a project
router.use('/:projectId/test-cases', testCaseRoutes);

// Mount task routes nested under a project
router.use('/:projectId/tasks', taskRoutes);

export default router; 