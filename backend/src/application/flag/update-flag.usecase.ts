/**
 * Update Flag Use Case
 */

import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { Result, success, failure, DomainError } from '../../shared/result';
import { Flag } from '../../domain/flag/flag.entity';

export interface UpdateFlagInput {
  flagId: string;
  organizationId: string;
  name?: string;
  description?: string | null;
}

export class UpdateFlagUseCase {
  constructor(private readonly flagRepo: FlagRepository) {}

  async execute(input: UpdateFlagInput): Promise<Result<Flag>> {
    // 1. Find flag
    const flagResult = await this.flagRepo.findById(input.flagId);
    if (!flagResult.success) {
      return failure(flagResult.error);
    }

    const flag = flagResult.data;
    if (!flag) {
      return failure(DomainError.notFound('Flag', input.flagId));
    }

    // 2. Check organization
    if (flag.organizationId !== input.organizationId) {
      return failure(DomainError.forbidden());
    }

    // 3. Update entity
    const updatedFlag = flag.update({
      name: input.name,
      description: input.description
    });

    // 4. Save
    return await this.flagRepo.save(updatedFlag);
  }
}
