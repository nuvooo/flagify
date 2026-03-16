/**
 * Create Project Use Case
 */

import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { Result, success, failure, DomainError } from '../../shared/result';
import { Project, ProjectType } from '../../domain/project/project.entity';

export interface CreateProjectInput {
  name: string;
  key: string;
  description?: string | null;
  type?: ProjectType;
  organizationId: string;
  allowedOrigins?: string[];
}

export class CreateProjectUseCase {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Result<Project>> {
    // Normalize key: trim and lowercase
    const normalizedKey = input.key.trim().toLowerCase();
    
    // 1. Check if key already exists
    const existingResult = await this.projectRepo.findByKey(
      input.organizationId,
      normalizedKey
    );
    
    if (!existingResult.success) {
      return failure(existingResult.error);
    }
    
    if (existingResult.data) {
      return failure(DomainError.alreadyExists('Project', normalizedKey));
    }

    // 2. Create entity
    const project = Project.create({
      name: input.name,
      key: normalizedKey,
      description: input.description || null,
      type: input.type || 'SINGLE',
      allowedOrigins: input.allowedOrigins || [],
      organizationId: input.organizationId
    });

    // 3. Save
    return await this.projectRepo.save(project);
  }
}
