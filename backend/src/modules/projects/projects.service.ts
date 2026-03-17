import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { Project } from '../../domain/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: { include: { projects: { include: { environments: true } } } } },
    });
    
    const projects = memberships.flatMap(m => m.organization.projects);
    
    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const flagCount = await this.prisma.featureFlag.count({
          where: { projectId: p.id },
        });

        return {
          id: p.id,
          name: p.name,
          key: p.key,
          description: p.description,
          type: p.type,
          allowedOrigins: p.allowedOrigins,
          organizationId: p.organizationId,
          environments: p.environments,
          environmentCount: p.environments.length,
          flagCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    return projectsWithCounts;
  }

  async findOne(projectId: string) {
    const p = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { environments: true },
    });
    
    if (!p) throw new NotFoundException('Project not found');
    
    const flagCount = await this.prisma.featureFlag.count({
      where: { projectId },
    });
    
    return {
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      type: p.type,
      allowedOrigins: p.allowedOrigins,
      organizationId: p.organizationId,
      environments: p.environments,
      environmentCount: p.environments.length,
      flagCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getEnvironments(projectId: string) {
    const envs = await this.prisma.environment.findMany({
      where: { projectId },
    });
    return envs;
  }

  async getFlagsWithBrands(projectId: string) {
    // Get project with environments
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { environments: true },
    });
    
    if (!project) throw new NotFoundException('Project not found');

    const flags = await this.prisma.featureFlag.findMany({
      where: { projectId },
      include: {
        flagEnvironments: {
          include: { environment: true },
        },
      },
    });

    const brands = await this.prisma.brand.findMany({
      where: { projectId },
    });

    // Ensure all flags have default environments
    for (const flag of flags) {
      const existingEnvIds = new Set(
        flag.flagEnvironments
          .filter(fe => !fe.brandId)
          .map(fe => fe.environmentId)
      );
      
      const missingEnvs = project.environments.filter(
        env => !existingEnvIds.has(env.id)
      );
      
      for (const env of missingEnvs) {
        try {
          await this.prisma.flagEnvironment.create({
            data: {
              flagId: flag.id,
              environmentId: env.id,
              brandId: null,
              enabled: false,
              defaultValue: flag.flagType === 'BOOLEAN' ? 'false' : 
                           flag.flagType === 'NUMBER' ? '0' : 
                           flag.flagType === 'JSON' ? '{}' : '',
            },
          });
        } catch (e: any) {
          if (e.code !== 'P2002') throw e;
        }
      }
    }

    // Reload flags with created environments
    const flagsWithEnvs = await this.prisma.featureFlag.findMany({
      where: { projectId },
      include: {
        flagEnvironments: {
          include: { environment: true },
        },
      },
    });

    const result = flagsWithEnvs.map(f => {
      const envs = f.flagEnvironments.filter(fe => !fe.brandId);
      
      return {
        id: f.id,
        name: f.name,
        key: f.key,
        flagType: f.flagType,
        environments: envs.map(env => ({
          id: env.id,
          environmentId: env.environmentId,
          environmentName: env.environment.name,
          enabled: env.enabled,
          defaultValue: env.defaultValue,
          brandValues: brands.map(b => {
            const brandEnv = f.flagEnvironments.find(
              fe => fe.environmentId === env.environmentId && fe.brandId === b.id
            );
            // Always return brand, using default env values if no override exists
            return {
              brandId: b.id,
              brandName: b.name,
              enabled: brandEnv?.enabled ?? env.enabled,
              value: brandEnv?.defaultValue ?? env.defaultValue,
              isOverride: !!brandEnv,
            };
          }),
        })),
      };
    });

    return { flags: result };
  }

  async create(orgId: string, userId: string, dto: CreateProjectDto): Promise<Project> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId: orgId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    
    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    const normalizedKey = dto.key.trim().toLowerCase();
    
    const existing = await this.prisma.project.findUnique({
      where: { organizationId_key: { organizationId: orgId, key: normalizedKey } },
    });
    
    if (existing) {
      throw new ConflictException(`Project with key '${normalizedKey}' already exists`);
    }

    const project = Project.create({
      name: dto.name,
      key: normalizedKey,
      description: dto.description || null,
      type: dto.type || 'SINGLE',
      allowedOrigins: dto.allowedOrigins || [],
      organizationId: orgId,
    });

    const created = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        type: project.type,
        allowedOrigins: project.allowedOrigins,
        organizationId: project.organizationId,
        environments: {
          create: [
            { name: 'Development', key: 'development', organizationId: orgId },
            { name: 'Production', key: 'production', organizationId: orgId },
          ],
        },
      },
    });

    return Project.reconstitute({
      id: created.id,
      name: project.name,
      key: project.key,
      description: project.description,
      type: project.type,
      allowedOrigins: project.allowedOrigins,
      organizationId: project.organizationId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async update(projectId: string, data: { name?: string; description?: string; type?: 'SINGLE' | 'MULTI'; allowedOrigins?: string[] }) {
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data,
      include: { environments: true },
    });

    return {
      id: updated.id,
      name: updated.name,
      key: updated.key,
      description: updated.description,
      type: updated.type,
      allowedOrigins: updated.allowedOrigins,
      organizationId: updated.organizationId,
      environments: updated.environments,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async findByOrganization(orgId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId: orgId },
      include: { environments: true },
    });
    
    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const flagCount = await this.prisma.featureFlag.count({
          where: { projectId: p.id },
        });

        return {
          id: p.id,
          name: p.name,
          key: p.key,
          description: p.description,
          type: p.type,
          allowedOrigins: p.allowedOrigins,
          organizationId: p.organizationId,
          environments: p.environments,
          environmentCount: p.environments.length,
          flagCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    return projectsWithCounts;
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: { 
        userId, 
        organizationId: project.organizationId, 
        role: { in: ['OWNER', 'ADMIN'] } 
      },
    });
    
    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.project.delete({ where: { id: projectId } });
  }
}
