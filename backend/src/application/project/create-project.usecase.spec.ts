/**
 * Unit Tests for CreateProjectUseCase
 */

import { CreateProjectUseCase } from './create-project.usecase';
import { ProjectRepository } from '../../infrastructure/persistence/project.repository';
import { Project } from '../../domain/project/project.entity';
import { success, failure, DomainError } from '../../shared/result';

const mockProjectRepo: jest.Mocked<ProjectRepository> = {
  findByKey: jest.fn(),
  findById: jest.fn(),
  findByOrganizationId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as any;

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    useCase = new CreateProjectUseCase(mockProjectRepo);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new project successfully', async () => {
      mockProjectRepo.findByKey.mockResolvedValue(success(null));
      mockProjectRepo.save.mockImplementation((project) => Promise.resolve(success(project)));

      const result = await useCase.execute({
        name: 'Test Project',
        key: 'test-project',
        description: 'A test project',
        type: 'SINGLE',
        allowedOrigins: ['https://example.com'],
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
        expect(result.data.key).toBe('test-project');
        expect(result.data.description).toBe('A test project');
        expect(result.data.type).toBe('SINGLE');
        expect(result.data.allowedOrigins).toEqual(['https://example.com']);
        expect(result.data.organizationId).toBe('org-1');
      }
    });

    it('should create project with default type SINGLE', async () => {
      mockProjectRepo.findByKey.mockResolvedValue(success(null));
      mockProjectRepo.save.mockImplementation((project) => Promise.resolve(success(project)));

      const result = await useCase.execute({
        name: 'Test Project',
        key: 'test-project',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('SINGLE');
        expect(result.data.allowedOrigins).toEqual([]);
      }
    });

    it('should return error if project key already exists', async () => {
      const existingProject = Project.reconstitute({
        id: 'existing-id',
        name: 'Existing Project',
        key: 'test-project',
        description: null,
        type: 'SINGLE',
        allowedOrigins: [],
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProjectRepo.findByKey.mockResolvedValue(success(existingProject));

      const result = await useCase.execute({
        name: 'Test Project',
        key: 'test-project',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already exists');
      }
    });

    it('should create multi-tenant project', async () => {
      mockProjectRepo.findByKey.mockResolvedValue(success(null));
      mockProjectRepo.save.mockImplementation((project) => Promise.resolve(success(project)));

      const result = await useCase.execute({
        name: 'Multi Tenant Project',
        key: 'multi-tenant',
        type: 'MULTI',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('MULTI');
        expect(result.data.isMultiTenant).toBe(true);
      }
    });

    it('should trim and normalize project key', async () => {
      mockProjectRepo.findByKey.mockResolvedValue(success(null));
      mockProjectRepo.save.mockImplementation((project) => Promise.resolve(success(project)));

      const result = await useCase.execute({
        name: 'Test Project',
        key: '  Test-PROJECT  ',
        organizationId: 'org-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('test-project');
      }
    });
  });
});
