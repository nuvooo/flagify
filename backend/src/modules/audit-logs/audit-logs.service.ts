import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma.service'

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    action: string
    entityType: string
    entityId: string
    userId: string
    organizationId: string
    projectId?: string
    oldValues?: any
    newValues?: any
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        organizationId: data.organizationId,
        projectId: data.projectId,
        oldValues: data.oldValues,
        newValues: data.newValues,
      },
    })
  }

  async findAll(projectId?: string) {
    const where: any = {}
    if (projectId) where.projectId = projectId

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async findByOrganization(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }
}
