import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    // Get user's organization
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId },
    });

    if (!membership) return [];

    return this.prisma.apiKey.findMany({
      where: { organizationId: membership.organizationId },
      select: {
        id: true,
        name: true,
        key: true,
        type: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async create(orgId: string, userId: string, data: { name: string; type?: string; expiresInDays?: number }) {
    const key = `tk_${crypto.randomBytes(32).toString('hex')}`;
    
    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.apiKey.create({
      data: {
        name: data.name,
        key,
        type: (data.type as any) || 'SDK',
        organizationId: orgId,
        userId: userId,
        expiresAt,
        isActive: true,
      },
    });
  }

  async delete(keyId: string) {
    await this.prisma.apiKey.delete({ where: { id: keyId } });
  }
}
