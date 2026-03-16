/**
 * Unit Tests for EvaluateFlagUseCase
 */

import { EvaluateFlagUseCase } from './evaluate-flag.usecase';
import { FlagRepository } from '../../infrastructure/persistence/flag.repository';
import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { BrandRepository } from '../../infrastructure/persistence/brand.repository';
import { Flag, FlagType } from '../../domain/flag/flag.entity';
import { Project } from '../../domain/project/project.entity';
import { Brand } from '../../domain/brand/brand.entity';
import { FlagValue } from '../../domain/flag/flag-value.entity';
import { success, failure, DomainError } from '../../shared/result';

// Mocks
const mockFlagRepo: jest.Mocked<FlagRepository> = {
  findByKey: jest.fn(),
  findValue: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as any;

const mockProjectRepo: jest.Mocked<ProjectRepository> = {
  findByKey: jest.fn(),
  findByKeyWithOrg: jest.fn(),
  findById: jest.fn(),
  findByOrganizationId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as any;

const mockBrandRepo: jest.Mocked<BrandRepository> = {
  findByKey: jest.fn(),
  findById: jest.fn(),
  findByProjectId: jest.fn(),
  findDefaultForProject: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as any;

describe('EvaluateFlagUseCase', () => {
  let useCase: EvaluateFlagUseCase;

  beforeEach(() => {
    useCase = new EvaluateFlagUseCase(mockFlagRepo, mockProjectRepo, mockBrandRepo);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockProject = Project.reconstitute({
      id: 'proj-1',
      name: 'Test Project',
      key: 'test-project',
      description: null,
      type: 'SINGLE',
      allowedOrigins: [],
      organizationId: 'org-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockFlag = Flag.reconstitute({
      id: 'flag-1',
      key: 'test-flag',
      name: 'Test Flag',
      description: null,
      type: 'BOOLEAN' as FlagType,
      projectId: 'proj-1',
      organizationId: 'org-1',
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should return flag value when flag is enabled', async () => {
      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(mockFlag));
      mockBrandRepo.findByKey.mockResolvedValue(success(null));
      mockFlagRepo.findValue.mockResolvedValue(success(
        FlagValue.reconstitute({
          id: 'fv-1',
          flagId: 'flag-1',
          environmentId: 'production',
          brandId: null,
          enabled: true,
          value: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(true);
        expect(result.data.enabled).toBe(true);
      }
    });

    it('should return false value when flag is disabled', async () => {
      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(mockFlag));
      mockBrandRepo.findByKey.mockResolvedValue(success(null));
      mockFlagRepo.findValue.mockResolvedValue(success(
        FlagValue.reconstitute({
          id: 'fv-1',
          flagId: 'flag-1',
          environmentId: 'production',
          brandId: null,
          enabled: false,
          value: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(false);
        expect(result.data.enabled).toBe(false);
      }
    });

    it('should return error when project not found', async () => {
      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(null));

      const result = await useCase.execute({
        projectKey: 'non-existent',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(false);
    });

    it('should return disabled when flag not found', async () => {
      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(null));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'non-existent',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(false);
        expect(result.data.enabled).toBe(false);
      }
    });

    it('should handle string flag type correctly', async () => {
      const stringFlag = Flag.reconstitute({
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'STRING' as FlagType,
        projectId: 'proj-1',
        organizationId: 'org-1',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(stringFlag));
      mockBrandRepo.findByKey.mockResolvedValue(success(null));
      mockFlagRepo.findValue.mockResolvedValue(success(
        FlagValue.reconstitute({
          id: 'fv-1',
          flagId: 'flag-1',
          environmentId: 'production',
          brandId: null,
          enabled: true,
          value: 'hello world',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('hello world');
      }
    });

    it('should handle number flag type correctly', async () => {
      const numberFlag = Flag.reconstitute({
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'NUMBER' as FlagType,
        projectId: 'proj-1',
        organizationId: 'org-1',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(numberFlag));
      mockBrandRepo.findByKey.mockResolvedValue(success(null));
      mockFlagRepo.findValue.mockResolvedValue(success(
        FlagValue.reconstitute({
          id: 'fv-1',
          flagId: 'flag-1',
          environmentId: 'production',
          brandId: null,
          enabled: true,
          value: '42',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(42);
      }
    });

    it('should handle JSON flag type correctly', async () => {
      const jsonFlag = Flag.reconstitute({
        id: 'flag-1',
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'JSON' as FlagType,
        projectId: 'proj-1',
        organizationId: 'org-1',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProjectRepo.findByKeyWithOrg.mockResolvedValue(success(mockProject));
      mockFlagRepo.findByKey.mockResolvedValue(success(jsonFlag));
      mockBrandRepo.findByKey.mockResolvedValue(success(null));
      mockFlagRepo.findValue.mockResolvedValue(success(
        FlagValue.reconstitute({
          id: 'fv-1',
          flagId: 'flag-1',
          environmentId: 'production',
          brandId: null,
          enabled: true,
          value: '{"key":"value","count":5}',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ));

      const result = await useCase.execute({
        projectKey: 'test-project',
        environmentKey: 'production',
        flagKey: 'test-flag',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toEqual({ key: 'value', count: 5 });
      }
    });
  });
});
