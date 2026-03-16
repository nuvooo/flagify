import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getMyProjects,
  getProject,
  updateProject,
  getProjectFlagsWithBrands
} from '../controllers/projects';
import { ProjectController } from '../interfaces/http/controllers/project.controller';
import { authenticate, requireOrgMember, requireOrgRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { validateOrgId, validateProjectId } from '../middleware/validateId';

const router = Router();
const projectController = new ProjectController();

router.use(authenticate);

// Legacy routes (kept for backward compatibility)
router.get('/', getMyProjects);
router.get('/organization/:orgId', validateOrgId, requireOrgMember, getProjects);
router.get('/:projectId', validateProjectId, authenticate, getProject);
router.patch(
  '/:projectId',
  validateProjectId,
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('type').optional().isIn(['SINGLE', 'MULTI']),
    validate
  ],
  updateProject
);
router.get('/:projectId/flags-with-brands', validateProjectId, authenticate, getProjectFlagsWithBrands);

// New hexagonal routes
router.post(
  '/organization/:orgId',
  validateOrgId,
  requireOrgRole(['OWNER', 'ADMIN']),
  [
    body('name').trim().notEmpty(),
    body('key').trim().notEmpty(),
    body('description').optional().trim(),
    body('type').optional().isIn(['SINGLE', 'MULTI']),
    body('allowedOrigins').optional().isArray(),
    validate
  ],
  (req: Request, res: Response, next: NextFunction) => projectController.create(req, res, next)
);

// New delete route using hexagonal controller
router.delete('/:projectId', validateProjectId, authenticate, (req: Request, res: Response, next: NextFunction) => 
  projectController.delete(req, res, next)
);

export { router as projectsRouter };
