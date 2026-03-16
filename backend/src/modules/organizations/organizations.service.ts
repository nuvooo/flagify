import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        members: {
          some: { userId },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async create(data: { name: string; slug: string }, userId: string) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
  }
}
