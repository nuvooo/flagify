/**
 * Delete Flag Use Case
 * Handles cascade delete of flag values
 */

import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { Result, success, failure, DomainError } from '../../shared/result';

export interface DeleteFlagInput {
  flagId: string;
  organizationId: string;
}

export class DeleteFlagUseCase {
  constructor(private readonly flagRepo: FlagRepository) {}

  async execute(input: DeleteFlagInput): Promise<Result<void>> {
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

    // 3. Delete in transaction
    const transactionResult = await this.flagRepo.transaction(async () => {
      // Delete all flag values first
      await this.flagRepo.deleteValuesByFlag(input.flagId);
      
      // Delete flag
      await this.flagRepo.delete(input.flagId);
    });

    return transactionResult;
  }
}
