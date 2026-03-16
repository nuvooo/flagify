/**
 * Feature Flag Routes - Using new hexagonal controllers
 */

import { Router } from 'express';
import { FeatureFlagController } from '../controllers/feature-flag.controller';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const controller = new FeatureFlagController();

// All routes require authentication
router.use(authenticate);

// Create flag
router.post('/', (req, res, next) => controller.create(req, res, next));

// Update flag
router.put('/:flagId', (req, res, next) => controller.update(req, res, next));

// Delete flag
router.delete('/:flagId', (req, res, next) => controller.delete(req, res, next));

// Update flag value (environment + optional brand)
router.put('/:flagId/environments/:environmentId/value', (req, res, next) => 
  controller.updateValue(req, res, next)
);

export default router;
