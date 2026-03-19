import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto, UpdateExperimentDto, TrackEventDto } from './dto/create-experiment.dto';
import { AuthGuard } from '../../shared/auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('organizations/:orgId/projects/:projectId/experiments')
@UseGuards(AuthGuard)
export class ExperimentsController {
  constructor(
    private readonly experimentsService: ExperimentsService,
    private readonly auditService: AuditLogsService
  ) {}

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Query('status') status?: string
  ) {
    return this.experimentsService.findAll(orgId, projectId, status);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Param('orgId') orgId: string
  ) {
    return this.experimentsService.findOne(id, orgId);
  }

  @Get(':id/results')
  getResults(
    @Param('id') id: string,
    @Param('orgId') orgId: string
  ) {
    return this.experimentsService.getResults(id, orgId);
  }

  @Post()
  async create(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateExperimentDto,
    @Req() req
  ) {
    const experiment = await this.experimentsService.create(
      orgId, 
      projectId, 
      req.user.userId, 
      dto
    );

    await this.auditService.create({
      action: 'EXPERIMENT_CREATED',
      entityType: 'experiment',
      entityId: experiment.id,
      organizationId: orgId,
      projectId,
      userId: req.user.userId,
      newValues: dto
    });

    return experiment;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateExperimentDto,
    @Req() req
  ) {
    const oldExp = await this.experimentsService.findOne(id, orgId);
    const experiment = await this.experimentsService.update(id, orgId, dto);

    await this.auditService.create({
      action: 'EXPERIMENT_UPDATED',
      entityType: 'experiment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId,
      oldValues: oldExp,
      newValues: dto
    });

    return experiment;
  }

  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Req() req
  ) {
    const experiment = await this.experimentsService.update(id, orgId, { status: 'RUNNING' });

    await this.auditService.create({
      action: 'EXPERIMENT_STARTED',
      entityType: 'experiment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId
    });

    return experiment;
  }

  @Post(':id/stop')
  async stop(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Req() req
  ) {
    const experiment = await this.experimentsService.update(id, orgId, { status: 'COMPLETED' });

    await this.auditService.create({
      action: 'EXPERIMENT_STOPPED',
      entityType: 'experiment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId
    });

    return experiment;
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Req() req
  ) {
    await this.experimentsService.delete(id, orgId);

    await this.auditService.create({
      action: 'EXPERIMENT_DELETED',
      entityType: 'experiment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId
    });

    return { success: true };
  }
}

// Public SDK endpoint for tracking events
@Controller('sdk/experiments')
export class ExperimentSdkController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post(':experimentKey/events')
  async trackEvent(
    @Param('experimentKey') experimentKey: string,
    @Body() dto: TrackEventDto
  ) {
    await this.experimentsService.trackEvent(experimentKey, dto.eventType, dto);
    return { success: true };
  }
}
