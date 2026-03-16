/**
 * Create Flag Use Case
 */

import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { Result, success, failure, DomainError } from '../../shared/result';
import { Flag, FlagType } from '../../domain/flag/flag.entity';
import { FlagValue } from '../../domain/flag/flag-value.entity';

export interface CreateFlagInput {
  key: string;
  name: string;
  description?: string | null;
  type: FlagType;
  projectId: string;
  organizationId: string;
  createdById: string;
  // Initial values for environments
  initialValues?: Array<{
    environmentId: string;
    enabled: boolean;
    value: string;
    brandId?: string | null;
  }>;
}

export interface CreateFlagOutput {
  flag: Flag;
  values: FlagValue[];
}

export class CreateFlagUseCase {
  constructor(
    private readonly flagRepo: FlagRepository,
    private readonly projectRepo: ProjectRepository
  ) {}

  async execute(input: CreateFlagInput): Promise<Result<CreateFlagOutput>> {
    // 1. Validate project exists
    const projectResult = await this.projectRepo.findById(input.projectId);
    if (!projectResult.success) {
      return failure(projectResult.error);
    }
    
    const project = projectResult.data;
    if (!project) {
      return failure(DomainError.notFound('Project', input.projectId));
    }

    if (project.organizationId !== input.organizationId) {
      return failure(DomainError.forbidden());
    }

    // 2. Check if flag key already exists in project
    const existingResult = await this.flagRepo.findByKey(input.projectId, input.key);
    if (!existingResult.success) {
      return failure(existingResult.error);
    }
    
    if (existingResult.data) {
      return failure(DomainError.alreadyExists('Flag', input.key));
    }

    // 3. Create flag entity
    const flag = Flag.create({
      key: input.key,
      name: input.name,
      description: input.description || null,
      type: input.type,
      projectId: input.projectId,
      organizationId: input.organizationId,
      createdById: input.createdById
    });

    // 4. Save flag
    const saveResult = await this.flagRepo.save(flag);
    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    // 5. Create initial values if provided
    const values: FlagValue[] = [];
    if (input.initialValues && input.initialValues.length > 0) {
      for (const init of input.initialValues) {
        const value = FlagValue.create({
          flagId: flag.id,
          environmentId: init.environmentId,
          brandId: init.brandId || null,
          enabled: init.enabled,
          value: init.value
        });

        const valueSaveResult = await this.flagRepo.saveValue(value);
        if (valueSaveResult.success) {
          values.push(valueSaveResult.data);
        }
      }
    }

    return success({ flag: saveResult.data, values });
  }
}
