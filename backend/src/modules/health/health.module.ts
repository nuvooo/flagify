import { Module } from '@nestjs/common'
import { PrismaModule } from '../../shared/prisma.module'
import { HealthController } from './health.controller'

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
