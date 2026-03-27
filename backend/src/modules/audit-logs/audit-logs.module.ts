import { Global, Module } from '@nestjs/common'
import { PrismaModule } from '../../shared/prisma.module'
import { AuditLogsController } from './audit-logs.controller'
import { AuditLogsService } from './audit-logs.service'

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
