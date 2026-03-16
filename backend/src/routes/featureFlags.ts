import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import {
  getFeatureFlags,
  getMyFeatureFlags,
  getFeatureFlag,
  toggleFlag,
  getFlagEnvironments,
  updateFlagEnvironment,
  createTargetingRule,
  updateTargetingRule,
  deleteTargetingRule
} from '../controllers/featureFlags';
import { FeatureFlagController } from '../interfaces/http/controllers/feature-flag.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { validateProjectId, validateFlagId, validateEnvironmentId } from '../middleware/validateId';

const router = Router();
const flagController = new FeatureFlagController();

router.use(authenticate);

// Legacy routes (kept for backward compatibility)
router.get('/', getMyFeatureFlags);
router.get('/project/:projectId', validateProjectId, authenticate, getFeatureFlags);
router.get('/:flagId', validateFlagId, authenticate, getFeatureFlag);
router.post('/:flagId/toggle', validateFlagId, authenticate, toggleFlag);
router.get('/:flagId/environments', validateFlagId, authenticate, getFlagEnvironments);
router.patch('/:flagId/environments/:environmentId', validateFlagId, validateEnvironmentId, authenticate, updateFlagEnvironment);
router.post('/:flagId/environments/:environmentId/rules', validateFlagId, validateEnvironmentId, authenticate, createTargetingRule);
router.patch('/:flagId/environments/:environmentId/rules/:ruleId', validateFlagId, validateEnvironmentId, authenticate, updateTargetingRule);
router.delete('/:flagId/environments/:environmentId/rules/:ruleId', validateFlagId, validateEnvironmentId, authenticate, deleteTargetingRule);

// New hexagonal routes (using clean architecture)

// Create flag with new controller
router.post(
  '/project/:projectId',
  validateProjectId,
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('key').trim().notEmpty(),
    body('type').optional().isIn(['BOOLEAN', 'STRING', 'NUMBER', 'JSON']),
    body('flagType').optional().isIn(['BOOLEAN', 'STRING', 'NUMBER', 'JSON']), // backward compatibility
    body('description').optional().trim(),
    body('initialValues').optional().isObject(),
    validate
  ],
  (req: Request, res: Response, next: NextFunction) => flagController.create(req, res, next)
);

// Update flag with new controller
router.patch(
  '/:flagId',
  validateFlagId,
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    validate
  ],
  (req: Request, res: Response, next: NextFunction) => flagController.update(req, res, next)
);

// Delete flag with new controller
router.delete('/:flagId', validateFlagId, authenticate, (req, res, next) => 
  flagController.delete(req, res, next)
);

// Update flag value (brand-specific or default) with new controller
router.patch('/:flagId/environments/:environmentId/value', validateFlagId, validateEnvironmentId, authenticate, [
  body('enabled').optional().isBoolean(),
  body('value').optional(),
  body('brandId').optional().isString(),
  validate
], (req: Request, res: Response, next: NextFunction) => flagController.updateValue(req, res, next));

export { router as featureFlagsRouter };
