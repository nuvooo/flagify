import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/create-segment.dto';

@Injectable()
export class SegmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, projectId: string) {
    return this.prisma.segment.findMany({
      where: { organizationId, projectId },
      include: {
        conditions: true,
        _count: {
          select: { targetingRules: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, organizationId: string) {
    const segment = await this.prisma.segment.findFirst({
      where: { id, organizationId },
      include: {
        conditions: true,
        targetingRules: {
          include: {
            flagEnvironment: {
              include: {
                flag: true,
                environment: true
              }
            }
          }
        }
      }
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    return segment;
  }

  async create(
    organizationId: string,
    projectId: string,
    dto: CreateSegmentDto
  ) {
    // Check for duplicate key
    const existing = await this.prisma.segment.findFirst({
      where: { projectId, key: dto.key }
    });

    if (existing) {
      throw new ConflictException(`Segment with key '${dto.key}' already exists`);
    }

    return this.prisma.segment.create({
      data: {
        name: dto.name,
        key: dto.key,
        description: dto.description,
        organizationId,
        projectId,
        conditions: {
          create: dto.conditions?.map(c => ({
            attribute: c.attribute,
            operator: c.operator as any,
            value: c.value
          })) || []
        }
      },
      include: { conditions: true }
    });
  }

  async update(id: string, organizationId: string, dto: UpdateSegmentDto) {
    const segment = await this.findOne(id, organizationId);

    return this.prisma.segment.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.conditions && {
          conditions: {
            deleteMany: {},
            create: dto.conditions.map(c => ({
              attribute: c.attribute,
              operator: c.operator as any,
              value: c.value
            }))
          }
        })
      },
      include: { conditions: true }
    });
  }

  async delete(id: string, organizationId: string) {
    const segment = await this.findOne(id, organizationId);

    // Check if segment is used in any targeting rules
    const usageCount = await this.prisma.targetingRule.count({
      where: { segmentId: id }
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Cannot delete segment: it is used in ${usageCount} targeting rule(s)`
      );
    }

    await this.prisma.segment.delete({ where: { id } });
    
    return { success: true };
  }

  // Evaluate if a user matches a segment
  async evaluateSegment(
    segmentId: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      include: { conditions: true }
    });

    if (!segment) return false;

    // All conditions must match (AND logic)
    return segment.conditions.every(condition => {
      const value = context[condition.attribute];
      if (value === undefined) return false;

      switch (condition.operator) {
        case 'EQUALS':
          return String(value) === condition.value;
        case 'NOT_EQUALS':
          return String(value) !== condition.value;
        case 'CONTAINS':
          return String(value).includes(condition.value);
        case 'NOT_CONTAINS':
          return !String(value).includes(condition.value);
        case 'GREATER_THAN':
          return Number(value) > Number(condition.value);
        case 'LESS_THAN':
          return Number(value) < Number(condition.value);
        case 'IN':
          return condition.value.split(',').map(v => v.trim()).includes(String(value));
        case 'NOT_IN':
          return !condition.value.split(',').map(v => v.trim()).includes(String(value));
        case 'STARTS_WITH':
          return String(value).startsWith(condition.value);
        case 'ENDS_WITH':
          return String(value).endsWith(condition.value);
        case 'MATCHES_REGEX':
          try {
            return new RegExp(condition.value).test(String(value));
          } catch {
            return false;
          }
        default:
          return false;
      }
    });
  }
}
