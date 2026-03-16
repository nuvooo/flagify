/**
 * Feature Flag HTTP Controller
 * Clean controller using Use Cases
 */

import { Request, Response, NextFunction } from 'express';
import { container, CREATE_FLAG_USE_CASE, UPDATE_FLAG_USE_CASE, DELETE_FLAG_USE_CASE, UPDATE_FLAG_VALUE_USE_CASE } from '../../../shared/container';
import { CreateFlagUseCase } from '../../../application/flag/create-flag.usecase';
import { UpdateFlagUseCase } from '../../../application/flag/update-flag.usecase';
import { DeleteFlagUseCase } from '../../../application/flag/delete-flag.usecase';
import { UpdateFlagValueUseCase } from '../../../application/flag/update-flag-value.usecase';
import { DomainError, isDomainError } from '../../../shared/result';

export class FeatureFlagController {
  private createUseCase: CreateFlagUseCase;
  private updateUseCase: UpdateFlagUseCase;
  private deleteUseCase: DeleteFlagUseCase;
  private updateValueUseCase: UpdateFlagValueUseCase;

  constructor() {
    this.createUseCase = container.resolve(CREATE_FLAG_USE_CASE);
    this.updateUseCase = container.resolve(UPDATE_FLAG_USE_CASE);
    this.deleteUseCase = container.resolve(DELETE_FLAG_USE_CASE);
    this.updateValueUseCase = container.resolve(UPDATE_FLAG_VALUE_USE_CASE);
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const orgId = (req as any).user?.organizationId || req.params.orgId;

      const result = await this.createUseCase.execute({
        key: req.body.key,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type || 'BOOLEAN',
        projectId: req.params.projectId,
        organizationId: orgId,
        createdById: userId,
        initialValues: req.body.initialValues
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.status(201).json({
        flag: {
          id: result.data.flag.id,
          key: result.data.flag.key,
          name: result.data.flag.name,
          description: result.data.flag.description,
          type: result.data.flag.type,
          createdAt: result.data.flag.createdAt
        },
        values: result.data.values
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).user?.organizationId;

      const result = await this.updateUseCase.execute({
        flagId: req.params.flagId,
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.json({
        id: result.data.id,
        key: result.data.key,
        name: result.data.name,
        description: result.data.description,
        type: result.data.type,
        updatedAt: result.data.updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).user?.organizationId;

      const result = await this.deleteUseCase.execute({
        flagId: req.params.flagId,
        organizationId: orgId
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async updateValue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).user?.organizationId;

      const result = await this.updateValueUseCase.execute({
        flagId: req.params.flagId,
        environmentId: req.params.environmentId,
        organizationId: orgId,
        brandId: req.body.brandId,
        enabled: req.body.enabled,
        value: req.body.value
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.json({
        id: result.data.id,
        flagId: result.data.flagId,
        environmentId: result.data.environmentId,
        brandId: result.data.brandId,
        enabled: result.data.enabled,
        value: result.data.value
      });
    } catch (error) {
      next(error);
    }
  }

  private getErrorStatus(error: Error | DomainError): number {
    if (isDomainError(error)) {
      switch (error.code) {
        case 'NOT_FOUND':
          return 404;
        case 'ALREADY_EXISTS':
          return 409;
        case 'FORBIDDEN':
          return 403;
        case 'UNAUTHORIZED':
          return 401;
        case 'INVALID_INPUT':
          return 400;
        default:
          return 500;
      }
    }
    // Check for common error patterns in standard Error
    if (error.message?.includes('not found')) return 404;
    if (error.message?.includes('already exists')) return 409;
    if (error.message?.includes('forbidden')) return 403;
    if (error.message?.includes('unauthorized')) return 401;
    return 500;
  }
}
