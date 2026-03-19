import { Module } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { SegmentsController } from './segments.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService]
})
export class SegmentsModule {}
