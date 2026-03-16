/**
 * Delete Project Use Case
 * Handles cascade delete
 */

import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { BrandRepository } from '../../infrastructure/persistence/brand.repository';
import { Result, success, failure, DomainError } from '../../shared/result';

export interface DeleteProjectInput {
  projectId: string;
  organizationId: string;
}

export class DeleteProjectUseCase {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly flagRepo: FlagRepository,
    private readonly brandRepo: BrandRepository
  ) {}

  async execute(input: DeleteProjectInput): Promise<Result<void>> {
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

    // 3. Get all flags for this project
    const flagsResult = await this.flagRepo.findMany({ projectId: input.projectId });
    if (!flagsResult.success) {
      return failure(flagsResult.error);
    }

    // 4. Delete everything in transaction
    const transactionResult = await this.flagRepo.transaction(async () => {
      // Delete all flag values and flags
      for (const flag of flagsResult.data || []) {
        await this.flagRepo.deleteValuesByFlag(flag.id);
        await this.flagRepo.delete(flag.id);
      }

      // Delete all brands
      await this.brandRepo.deleteByProject(input.projectId);

      // Delete project
      await this.projectRepo.delete(input.projectId);
    });

    return transactionResult;
  }
}
