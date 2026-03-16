import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
