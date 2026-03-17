import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../shared/auth.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(AuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('project/:projectId')
  async findAll(@Param('projectId') projectId: string) {
    const auditLogs = await this.auditLogsService.findAll(projectId);
    return { auditLogs };
  }

  @Get('organization/:organizationId')
  async findByOrganization(@Param('organizationId') organizationId: string) {
    const auditLogs = await this.auditLogsService.findByOrganization(organizationId);
    return { auditLogs };
  }

  @Get()
  async findAllGlobal() {
    // For general list if no specific context, just return last 100 overall
    const auditLogs = await this.auditLogsService.findAll('');
    return { auditLogs };
  }
}
