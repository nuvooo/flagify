import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { CreateExperimentDto, UpdateExperimentDto, TrackEventDto } from './dto/create-experiment.dto';
import { ExperimentStatus } from '@prisma/client';

@Injectable()
export class ExperimentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, projectId: string, status?: string) {
    const where: any = { organizationId, projectId };
    if (status) where.status = status;

    return this.prisma.experiment.findMany({
      where,
      include: {
        flag: { select: { id: true, name: true, key: true, flagType: true } },
        variants: true,
        metrics: true,
        _count: { select: { events: true } }
      }
    }) as any;
  }

  async findOne(id: string, organizationId: string) {
    const experiment = await this.prisma.experiment.findFirst({
      where: { id, organizationId },
      include: {
        variants: true,
        metrics: true
      }
    }) as any;

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }

    return experiment;
  }

  async getResults(id: string, organizationId: string) {
    const experiment = await this.prisma.experiment.findFirst({
      where: { id, organizationId },
      include: {
        variants: true,
        metrics: true
      }
    }) as any;

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }
    
    // Get aggregated stats for each variant
    const variantStats = await Promise.all(
      experiment.variants.map(async (variant: any) => {
        const exposures = await this.prisma.experimentEvent.count({
          where: {
            experimentId: id,
            variantId: variant.id,
            eventType: 'exposure'
          }
        });

        const metricResults = await Promise.all(
          experiment.metrics.map(async (metric: any) => {
            const events = await this.prisma.experimentEvent.findMany({
              where: {
                experimentId: id,
                variantId: variant.id,
                eventType: metric.eventName
              }
            });

            let value = 0;
            let uniqueUsers = new Set();

            events.forEach(e => {
              if (e.userId) uniqueUsers.add(e.userId);
              switch (metric.type) {
                case 'CONVERSION':
                  value = events.length > 0 ? 1 : 0;
                  break;
                case 'COUNT':
                  value = events.length;
                  break;
                case 'SUM':
                  value += e.value || 0;
                  break;
                case 'AVERAGE':
                  value += e.value || 0;
                  break;
                case 'UNIQUE_COUNT':
                  value = uniqueUsers.size;
                  break;
              }
            });

            if (metric.type === 'AVERAGE' && events.length > 0) {
              value = value / events.length;
            }

            // Calculate conversion rate if applicable
            let rate = 0;
            if (metric.type === 'CONVERSION' || metric.type === 'UNIQUE_COUNT') {
              rate = exposures > 0 ? (value / exposures) * 100 : 0;
            }

            return {
              metricId: metric.id,
              metricName: metric.name,
              type: metric.type,
              value,
              rate,
              sampleSize: events.length,
              exposures,
              isPrimary: metric.isPrimary
            };
          })
        );

        return {
          variantId: variant.id,
          variantName: variant.name,
          variantKey: variant.key,
          isControl: variant.isControl,
          exposures,
          trafficPercent: variant.trafficPercent,
          metrics: metricResults
        };
      })
    );

    return {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        key: experiment.key,
        status: experiment.status,
        startDate: experiment.startDate,
        endDate: experiment.endDate
      },
      variants: variantStats
    };
  }

  async create(
    organizationId: string,
    projectId: string,
    createdById: string,
    dto: CreateExperimentDto
  ) {
    // Check for duplicate key
    const existing = await this.prisma.experiment.findFirst({
      where: { projectId, key: dto.key }
    });

    if (existing) {
      throw new ConflictException(`Experiment with key '${dto.key}' already exists`);
    }

    // Validate traffic allocation sums to 100%
    const totalTraffic = dto.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
    if (totalTraffic !== 100) {
      throw new BadRequestException(`Variant traffic percentages must sum to 100%, got ${totalTraffic}%`);
    }

    // Ensure exactly one control variant
    const controlCount = dto.variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      throw new BadRequestException('Exactly one variant must be marked as control');
    }

    return this.prisma.experiment.create({
      data: {
        name: dto.name,
        key: dto.key,
        description: dto.description,
        hypothesis: dto.hypothesis,
        organizationId,
        projectId,
        flagId: dto.flagId,
        environmentId: dto.environmentId,
        trafficAllocation: dto.trafficAllocation ?? 100,
        createdById,
        status: ExperimentStatus.DRAFT,
        variants: {
          create: dto.variants.map(v => ({
            name: v.name,
            key: v.key,
            description: v.description,
            value: v.value,
            trafficPercent: v.trafficPercent,
            isControl: v.isControl ?? false
          }))
        },
        metrics: {
          create: dto.metrics?.map(m => ({
            name: m.name,
            type: m.type as any,
            eventName: m.eventName,
            targetValue: m.targetValue,
            isPrimary: m.isPrimary ?? false
          })) || []
        }
      },
      include: {
        variants: true,
        metrics: true
      }
    });
  }

  async update(id: string, organizationId: string, dto: UpdateExperimentDto) {
    const experiment = await this.findOne(id, organizationId);

    // Validate status transitions
    if (dto.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['RUNNING'],
        RUNNING: ['PAUSED', 'COMPLETED'],
        PAUSED: ['RUNNING', 'COMPLETED'],
        COMPLETED: ['ARCHIVED'],
        ARCHIVED: []
      };

      if (!validTransitions[experiment.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${experiment.status} to ${dto.status}`
        );
      }
    }

    // Validate traffic allocation if variants are updated
    if (dto.variants) {
      const totalTraffic = dto.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
      if (totalTraffic !== 100) {
        throw new BadRequestException(`Variant traffic percentages must sum to 100%, got ${totalTraffic}%`);
      }
    }

    const updateData: any = {
      name: dto.name,
      description: dto.description,
      hypothesis: dto.hypothesis,
      status: dto.status,
      trafficAllocation: dto.trafficAllocation
    };

    // Handle status change timestamps
    if (dto.status === ExperimentStatus.RUNNING && experiment.status === ExperimentStatus.DRAFT) {
      updateData.startDate = new Date();
    }
    if (dto.status === ExperimentStatus.COMPLETED && experiment.status !== ExperimentStatus.COMPLETED) {
      updateData.endDate = new Date();
    }

    // Update variants if provided
    if (dto.variants) {
      await this.prisma.experimentVariant.deleteMany({ where: { experimentId: id } });
      updateData.variants = {
        create: dto.variants.map(v => ({
          name: v.name,
          key: v.key,
          description: v.description,
          value: v.value,
          trafficPercent: v.trafficPercent,
          isControl: v.isControl ?? false
        }))
      };
    }

    // Update metrics if provided
    if (dto.metrics) {
      await this.prisma.experimentMetric.deleteMany({ where: { experimentId: id } });
      updateData.metrics = {
        create: dto.metrics.map(m => ({
          name: m.name,
          type: m.type as any,
          eventName: m.eventName,
          targetValue: m.targetValue,
          isPrimary: m.isPrimary ?? false
        }))
      };
    }

    return this.prisma.experiment.update({
      where: { id },
      data: updateData,
      include: { variants: true, metrics: true }
    });
  }

  async delete(id: string, organizationId: string) {
    const experiment = await this.findOne(id, organizationId);

    if (experiment.status === ExperimentStatus.RUNNING) {
      throw new BadRequestException('Cannot delete a running experiment. Stop it first.');
    }

    await this.prisma.experiment.delete({ where: { id } });
    return { success: true };
  }

  // SDK: Get variant assignment for a user
  async getVariantForUser(
    experimentKey: string,
    userId: string,
    environmentId: string
  ): Promise<{ variant: any; experiment: any } | null> {
    const experiment = await this.prisma.experiment.findFirst({
      where: {
        key: experimentKey,
        environmentId,
        status: ExperimentStatus.RUNNING
      },
      include: { 
        variants: true,
        flag: { select: { flagType: true } }
      }
    });

    if (!experiment) return null;

    // Deterministic hash of userId to assign variant
    const hash = this.hashString(`${experiment.id}:${userId}`);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.trafficPercent;
      if (bucket < cumulative) {
        // Track exposure
        await this.trackExposure(experiment.id, variant.id, userId);
        return { variant, experiment };
      }
    }

    // Fallback to control
    const control = experiment.variants.find(v => v.isControl);
    if (control) {
      await this.trackExposure(experiment.id, control.id, userId);
      return { variant: control, experiment };
    }

    return null;
  }

  private async trackExposure(experimentId: string, variantId: string, userId: string) {
    // Use upsert to avoid duplicate exposures in a short window
    // For simplicity, we just create - in production you'd want deduplication
    await this.prisma.experimentEvent.create({
      data: {
        experimentId,
        variantId,
        userId,
        eventType: 'exposure'
      }
    }).catch(() => {
      // Ignore duplicate errors if any
    });
  }

  async trackEvent(
    experimentKey: string,
    eventName: string,
    dto: TrackEventDto
  ) {
    const experiment = await this.prisma.experiment.findFirst({
      where: {
        key: experimentKey,
        status: ExperimentStatus.RUNNING
      },
      include: { variants: true }
    });

    if (!experiment || !dto.userId) return;

    // Find which variant this user was assigned to
    const exposure = await this.prisma.experimentEvent.findFirst({
      where: {
        experimentId: experiment.id,
        userId: dto.userId,
        eventType: 'exposure'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!exposure) return;

    await this.prisma.experimentEvent.create({
      data: {
        experimentId: experiment.id,
        variantId: exposure.variantId,
        userId: dto.userId,
        sessionId: dto.sessionId,
        eventType: eventName,
        value: dto.value,
        metadata: dto.metadata
      }
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
