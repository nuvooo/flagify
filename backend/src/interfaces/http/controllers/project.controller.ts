/**
 * Project HTTP Controller
 */

import { Request, Response, NextFunction } from 'express';
import { container, CREATE_PROJECT_USE_CASE, UPDATE_PROJECT_USE_CASE, DELETE_PROJECT_USE_CASE, PROJECT_REPOSITORY } from '../../../shared/container';
import { CreateProjectUseCase } from '../../../application/project/create-project.usecase';
import { UpdateProjectUseCase } from '../../../application/project/update-project.usecase';
import { DeleteProjectUseCase } from '../../../application/project/delete-project.usecase';
import { ProjectRepository } from '../../../infrastructure/persistence/project.repository';
import { DomainError, isDomainError } from '../../../shared/result';

export class ProjectController {
  private createUseCase: CreateProjectUseCase;
  private updateUseCase: UpdateProjectUseCase;
  private deleteUseCase: DeleteProjectUseCase;
  private projectRepo: ProjectRepository;

  constructor() {
    this.createUseCase = container.resolve(CREATE_PROJECT_USE_CASE);
    this.updateUseCase = container.resolve(UPDATE_PROJECT_USE_CASE);
    this.deleteUseCase = container.resolve(DELETE_PROJECT_USE_CASE);
    this.projectRepo = container.resolve(PROJECT_REPOSITORY);
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId || (req as any).user?.organizationId;
      
      const result = await this.projectRepo.findMany({
        organizationId: orgId
      });

      if (!result.success) {
        res.status(500).json({ error: result.error.message });
        return;
      }

      res.json(result.data.map(p => ({
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        type: p.type,
        allowedOrigins: p.allowedOrigins,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.projectRepo.findById(req.params.projectId);

      if (!result.success) {
        res.status(500).json({ error: result.error.message });
        return;
      }

      if (!result.data) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const p = result.data;
      res.json({
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        type: p.type,
        allowedOrigins: p.allowedOrigins,
        organizationId: p.organizationId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId;

      const result = await this.createUseCase.execute({
        name: req.body.name,
        key: req.body.key,
        description: req.body.description,
        type: req.body.type || 'SINGLE',
        organizationId: orgId,
        allowedOrigins: req.body.allowedOrigins || []
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.status(201).json({
        id: result.data.id,
        name: result.data.name,
        key: result.data.key,
        description: result.data.description,
        type: result.data.type,
        allowedOrigins: result.data.allowedOrigins,
        createdAt: result.data.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).user?.organizationId;

      const result = await this.updateUseCase.execute({
        projectId: req.params.projectId,
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description,
        allowedOrigins: req.body.allowedOrigins
      });

      if (!result.success) {
        const status = this.getErrorStatus(result.error);
        res.status(status).json({ error: result.error.message });
        return;
      }

      res.json({
        id: result.data.id,
        name: result.data.name,
        key: result.data.key,
        description: result.data.description,
        type: result.data.type,
        allowedOrigins: result.data.allowedOrigins,
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
        projectId: req.params.projectId,
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
