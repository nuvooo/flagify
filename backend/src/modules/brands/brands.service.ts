import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.brand.findMany({
      where: { projectId },
    });
  }

  async findFlagsForBrand(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    
    if (!brand) throw new NotFoundException('Brand not found');

    const flags = await this.prisma.featureFlag.findMany({
      where: { projectId: brand.projectId },
    });

    const environments = await this.prisma.environment.findMany({
      where: { projectId: brand.projectId },
    });

    const flagEnvs = await this.prisma.flagEnvironment.findMany({
      where: { 
        flagId: { in: flags.map(f => f.id) },
        OR: [
          { brandId: null },
          { brandId }
        ]
      },
    });

    return {
      brand: { id: brand.id, name: brand.name, key: brand.key },
      flags: flags.map(f => ({
        id: f.id,
        name: f.name,
        key: f.key,
        flagType: f.flagType,
        environments: environments.map(env => {
          const defaultEnv = flagEnvs.find(fe => 
            fe.flagId === f.id && fe.environmentId === env.id && fe.brandId === null
          );
          const brandEnv = flagEnvs.find(fe => 
            fe.flagId === f.id && fe.environmentId === env.id && fe.brandId === brandId
          );
          
          return {
            id: defaultEnv?.id || brandEnv?.id || '',
            environmentId: env.id,
            environmentName: env.name,
            enabled: brandEnv?.enabled ?? defaultEnv?.enabled ?? false,
            defaultValue: brandEnv?.defaultValue ?? defaultEnv?.defaultValue ?? 'false',
            isBrandSpecific: !!brandEnv,
          };
        }),
      })),
    };
  }

  async create(projectId: string, data: { name: string; key: string; description?: string }) {
    return this.prisma.brand.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description,
        projectId,
      },
    });
  }

  async update(brandId: string, data: { name?: string; description?: string }) {
    return this.prisma.brand.update({
      where: { id: brandId },
      data,
    });
  }

  async delete(brandId: string) {
    await this.prisma.brand.delete({ where: { id: brandId } });
  }

  async toggleFlag(brandId: string, flagId: string, environmentId: string, enabled?: boolean) {
    console.log(`[BrandsService.toggleFlag] brandId=${brandId}, flagId=${flagId}, environmentId=${environmentId}, enabled=${enabled}`);
    
    // Find the flag to check its type
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id: flagId },
    });
    
    if (!flag) throw new NotFoundException('Flag not found');

    // Try to find existing brand-specific flag environment
    const existing = await this.prisma.flagEnvironment.findFirst({
      where: { flagId, environmentId, brandId },
    });
    
    console.log(`[BrandsService.toggleFlag] Existing brand-specific flagEnv:`, existing ? `id=${existing.id}, enabled=${existing.enabled}` : 'not found');

    if (existing) {
      const newEnabled = enabled !== undefined ? enabled : !existing.enabled;
      console.log(`[BrandsService.toggleFlag] Updating existing to enabled=${newEnabled}`);
      
      const updateData: any = { enabled: newEnabled };
      // If it's a BOOLEAN flag, also update the defaultValue to match the new enabled state
      if (flag.flagType === 'BOOLEAN') {
        updateData.defaultValue = String(newEnabled);
      }
      
      return this.prisma.flagEnvironment.update({
        where: { id: existing.id },
        data: updateData,
      });
    }

    // Create new brand-specific flag environment
    console.log(`[BrandsService.toggleFlag] Creating new brand-specific flagEnv`);
    try {
      const newEnabled = enabled ?? true;
      const created = await this.prisma.flagEnvironment.create({
        data: {
          flagId,
          environmentId,
          brandId,
          enabled: newEnabled,
          // If it's a BOOLEAN flag, the value should match the enabled state
          defaultValue: flag.flagType === 'BOOLEAN' ? String(newEnabled) : 'false',
        },
      });
      console.log(`[BrandsService.toggleFlag] Created: id=${created.id}, enabled=${created.enabled}`);
      return created;
    } catch (e: any) {
      console.error(`[BrandsService.toggleFlag] Error creating:`, e.message, e.code);
      // If unique constraint, find and update instead
      if (e.code === 'P2002') {
        const found = await this.prisma.flagEnvironment.findFirst({
          where: { flagId, environmentId, brandId },
        });
        if (found) {
          console.log(`[BrandsService.toggleFlag] Found after conflict, updating id=${found.id}`);
          return this.prisma.flagEnvironment.update({
            where: { id: found.id },
            data: { enabled: enabled ?? true },
          });
        }
      }
      throw e;
    }
  }
}
