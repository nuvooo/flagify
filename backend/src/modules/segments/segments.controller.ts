import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req
} from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/create-segment.dto';
import { AuthGuard } from '../../shared/auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('organizations/:orgId/projects/:projectId/segments')
@UseGuards(AuthGuard)
export class SegmentsController {
  constructor(
    private readonly segmentsService: SegmentsService,
    private readonly auditService: AuditLogsService
  ) {}

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string
  ) {
    return this.segmentsService.findAll(orgId, projectId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Param('orgId') orgId: string
  ) {
    return this.segmentsService.findOne(id, orgId);
  }

  @Post()
  async create(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSegmentDto,
    @Req() req
  ) {
    const segment = await this.segmentsService.create(orgId, projectId, dto);
    
    await this.auditService.create({
      action: 'SEGMENT_CREATED',
      entityType: 'segment',
      entityId: segment.id,
      organizationId: orgId,
      projectId,
      userId: req.user.userId,
      newValues: dto
    });

    return segment;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateSegmentDto,
    @Req() req
  ) {
    const oldSegment = await this.segmentsService.findOne(id, orgId);
    const segment = await this.segmentsService.update(id, orgId, dto);

    await this.auditService.create({
      action: 'SEGMENT_UPDATED',
      entityType: 'segment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId,
      oldValues: oldSegment,
      newValues: dto
    });

    return segment;
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
    @Req() req
  ) {
    await this.segmentsService.delete(id, orgId);

    await this.auditService.create({
      action: 'SEGMENT_DELETED',
      entityType: 'segment',
      entityId: id,
      organizationId: orgId,
      userId: req.user.userId
    });

    return { success: true };
  }
}
