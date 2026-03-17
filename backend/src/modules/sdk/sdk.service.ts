import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { Flag } from '../../domain/flag.entity';

@Injectable()
export class SdkService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateFlag(
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    brandKey?: string,
  ) {
    // Find project by key (need orgId, so we search)
    const project = await this.prisma.project.findFirst({
      where: { key: projectKey },
    });
    
    if (!project) throw new NotFoundException('Project not found');

    const environment = await this.prisma.environment.findFirst({
      where: { projectId: project.id, key: environmentKey },
    });
    
    if (!environment) throw new NotFoundException('Environment not found');

    const flag = await this.prisma.featureFlag.findFirst({
      where: { projectId: project.id, key: flagKey },
    });
    
    if (!flag) return { value: false, enabled: false, flagType: 'BOOLEAN' };

    let brandId: string | null = null;
    if (brandKey && project.type === 'MULTI') {
      const brand = await this.prisma.brand.findFirst({
        where: { projectId: project.id, key: brandKey },
      });
      if (brand) brandId = brand.id;
    }

    // Find flag environment - handle both null and undefined for brandId
    const flagEnvs = await this.prisma.flagEnvironment.findMany({
      where: {
        flagId: flag.id,
        environmentId: environment.id,
      },
    });
    
    // Find matching environment (check for brand match or default/no brand)
    const flagEnv = flagEnvs.find(fe => 
      brandId ? fe.brandId === brandId : !fe.brandId
    );

    if (!flagEnv || !flagEnv.enabled) {
      return { value: false, enabled: false, flagType: flag.flagType };
    }

    const domainFlag = Flag.reconstitute({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.flagType as any,
      projectId: flag.projectId,
      organizationId: project.organizationId,
      createdById: flag.createdById || '',
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    });

    return {
      value: domainFlag.parseValue(flagEnv.defaultValue),
      enabled: flagEnv.enabled,
      flagType: flag.flagType,
    };
  }

  async evaluateAllFlags(
    projectKey: string,
    environmentKey: string,
    brandKey?: string,
  ) {
    // Find project by key
    const project = await this.prisma.project.findFirst({
      where: { key: projectKey },
    });
    
    if (!project) throw new NotFoundException('Project not found');

    const environment = await this.prisma.environment.findFirst({
      where: { projectId: project.id, key: environmentKey },
    });
    
    if (!environment) throw new NotFoundException('Environment not found');

    // Get all flags for project
    const flags = await this.prisma.featureFlag.findMany({
      where: { projectId: project.id },
    });

    let brandId: string | null = null;
    if (brandKey && project.type === 'MULTI') {
      const brand = await this.prisma.brand.findFirst({
        where: { projectId: project.id, key: brandKey },
      });
      if (brand) brandId = brand.id;
    }

    // Get all flag environments for this environment
    const flagEnvs = await this.prisma.flagEnvironment.findMany({
      where: {
        environmentId: environment.id,
      },
    });

    const results: Record<string, any> = {};

    for (const flag of flags) {
      // Find matching flag environment
      const flagEnv = flagEnvs.find(fe => 
        fe.flagId === flag.id && (brandId ? fe.brandId === brandId : !fe.brandId)
      );

      if (!flagEnv || !flagEnv.enabled) {
        results[flag.key] = {
          value: false,
          enabled: false,
          flagType: flag.flagType,
        };
      } else {
        const domainFlag = Flag.reconstitute({
          id: flag.id,
          key: flag.key,
          name: flag.name,
          description: flag.description,
          type: flag.flagType as any,
          projectId: flag.projectId,
          organizationId: project.organizationId,
          createdById: flag.createdById || '',
          createdAt: flag.createdAt,
          updatedAt: flag.updatedAt,
        });

        results[flag.key] = {
          value: domainFlag.parseValue(flagEnv.defaultValue),
          enabled: flagEnv.enabled,
          flagType: flag.flagType,
        };
      }
    }

    return results;
  }

  async validateApiKey(apiKey: string, projectKey: string): Promise<boolean> {
    // API keys are stored with their full value or hash
    // Check if the provided key matches any active key for this project
    const keys = await this.prisma.apiKey.findMany({
      where: {
        isActive: true,
      },
      include: {
        organization: {
          include: {
            projects: {
              where: { key: projectKey },
            },
          },
        },
      },
    });
    
    // Check if any key matches (comparing with or without 'tk_' prefix)
    const normalizedInput = apiKey.startsWith('tk_') ? apiKey : `tk_${apiKey}`;
    return keys.some(k => k.key === apiKey || k.key === normalizedInput);
  }
}
