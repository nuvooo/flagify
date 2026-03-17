import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class EnvironmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.environment.findMany({
      where: { projectId },
    });
  }

  async create(projectId: string, data: { name: string; key: string; organizationId: string }) {
    return this.prisma.environment.create({
      data: {
        name: data.name,
        key: data.key,
        projectId,
        organizationId: data.organizationId,
      },
    });
  }

  async update(envId: string, data: { name?: string }) {
    return this.prisma.environment.update({
      where: { id: envId },
      data,
    });
  }

  async delete(envId: string) {
    await this.prisma.environment.delete({ where: { id: envId } });
  }
}
