import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { Flag } from '../../domain/flag.entity';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagValueDto } from './dto/update-flag-value.dto';

@Injectable()
export class FlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, projectId?: string) {
    if (projectId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundException('Project not found');
      
      const membership = await this.prisma.organizationMember.findFirst({
        where: { userId, organizationId: project.organizationId },
      });
      if (!membership) throw new ForbiddenException('Access denied');
    }

    const where = projectId ? { projectId } : {};
    const flags = await this.prisma.featureFlag.findMany({ where });
    
    return flags.map(f => ({
      id: f.id,
      key: f.key,
      name: f.name,
      description: f.description,
      type: f.flagType,
      projectId: f.projectId,
      isEnabled: false, // Would need separate query
    }));
  }

  async create(projectId: string, userId: string, dto: CreateFlagDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { environments: true },
    });
    
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId: project.organizationId },
    });
    if (!membership) throw new ForbiddenException('Access denied');

    const normalizedKey = dto.key.trim().toLowerCase();
    
    const existing = await this.prisma.featureFlag.findFirst({
      where: { projectId, key: normalizedKey },
    });
    
    if (existing) {
      throw new ConflictException(`Flag with key '${normalizedKey}' already exists`);
    }

    const flag = Flag.create({
      key: normalizedKey,
      name: dto.name,
      description: dto.description || null,
      type: dto.type,
      projectId,
      organizationId: project.organizationId,
      createdById: userId,
    });

    // Create flag
    const created = await this.prisma.featureFlag.create({
      data: {
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        flagType: flag.type,
        projectId: flag.projectId,
        organizationId: flag.organizationId,
        createdById: userId,
      },
    });

    // Create flag environments
    const envs = await Promise.all(
      project.environments.map(env =>
        this.prisma.flagEnvironment.create({
          data: {
            flagId: created.id,
            environmentId: env.id,
            enabled: dto.initialValues?.[env.key]?.enabled ?? false,
            defaultValue: dto.initialValues?.[env.key]?.value ?? 'false',
          },
        })
      )
    );

    return {
      flag: {
        id: created.id,
        key: created.key,
        name: created.name,
        description: created.description,
        type: created.flagType,
      },
      values: envs,
    };
  }

  async updateValue(flagId: string, environmentId: string, dto: UpdateFlagValueDto) {
    const brandId = dto.brandId || null;
    
    // Check if record exists
    const existing = await this.prisma.flagEnvironment.findFirst({
      where: { flagId, environmentId, brandId },
    });

    if (existing) {
      return this.prisma.flagEnvironment.update({
        where: { id: existing.id },
        data: {
          enabled: dto.enabled,
          defaultValue: dto.value,
        },
      });
    }

    return this.prisma.flagEnvironment.create({
      data: {
        flagId,
        environmentId,
        brandId,
        enabled: dto.enabled ?? false,
        defaultValue: dto.value ?? 'false',
      },
    });
  }

  async delete(flagId: string) {
    await this.prisma.featureFlag.delete({ where: { id: flagId } });
  }
}
