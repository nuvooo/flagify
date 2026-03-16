/**
 * Update Flag Value Use Case
 */

import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { Result, success, failure, DomainError } from '../../shared/result';
import { FlagValue } from '../../domain/flag/flag-value.entity';

export interface UpdateFlagValueInput {
  flagId: string;
  environmentId: string;
  organizationId: string;
  brandId?: string | null;  // null = default value
  enabled?: boolean;
  value?: string;
}

export class UpdateFlagValueUseCase {
  constructor(private readonly flagRepo: FlagRepository) {}

  async execute(input: UpdateFlagValueInput): Promise<Result<FlagValue>> {
    // 1. Find flag to check ownership
    const flagResult = await this.flagRepo.findById(input.flagId);
    if (!flagResult.success) {
      return failure(flagResult.error);
    }

    const flag = flagResult.data;
    if (!flag) {
      return failure(DomainError.notFound('Flag', input.flagId));
    }

    if (flag.organizationId !== input.organizationId) {
      return failure(DomainError.forbidden());
    }

    // 2. Find existing value
    const existingResult = await this.flagRepo.findValue(
      input.flagId,
      input.environmentId,
      input.brandId ?? null
    );

    if (!existingResult.success) {
      return failure(existingResult.error);
    }

    let flagValue: FlagValue;

    if (existingResult.data) {
      // Update existing
      flagValue = existingResult.data.update({
        enabled: input.enabled,
        value: input.value
      });
    } else {
      // Create new
      flagValue = FlagValue.create({
        flagId: input.flagId,
        environmentId: input.environmentId,
        brandId: input.brandId ?? null,
        enabled: input.enabled ?? false,
        value: input.value ?? ''
      });
    }

    // 3. Save
    return await this.flagRepo.saveValue(flagValue);
  }
}
