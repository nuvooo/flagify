/**
 * Update Project Use Case
 */

import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { Result, success, failure, DomainError } from '../../shared/result';
import { Project } from '../../domain/project/project.entity';

export interface UpdateProjectInput {
  projectId: string;
  organizationId: string;
  name?: string;
  description?: string | null;
  allowedOrigins?: string[];
}

export class UpdateProjectUseCase {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Result<Project>> {
    // 1. Find project
    const projectResult = await this.projectRepo.findById(input.projectId);
    if (!projectResult.success) {
      return failure(projectResult.error);
    }

    const project = projectResult.data;
    if (!project) {
      return failure(DomainError.notFound('Project', input.projectId));
    }

    // 2. Check ownership
    if (project.organizationId !== input.organizationId) {
      return failure(DomainError.forbidden());
    }

    // 3. Update
    const updatedProject = project.update({
      name: input.name,
      description: input.description,
      allowedOrigins: input.allowedOrigins
    });

    // 4. Save
    return await this.projectRepo.save(updatedProject);
  }
}
