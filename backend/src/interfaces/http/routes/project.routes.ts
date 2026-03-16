/**
 * Project Routes - Using new hexagonal controllers
 */

import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const controller = new ProjectController();

// All routes require authentication
router.use(authenticate);

// Get all projects
router.get('/', (req, res, next) => controller.getAll(req, res, next));

// Create project
router.post('/', (req, res, next) => controller.create(req, res, next));

// Delete project
router.delete('/:projectId', (req, res, next) => controller.delete(req, res, next));

export default router;
