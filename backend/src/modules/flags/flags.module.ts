import { Module } from '@nestjs/common'
import { FlagsController } from './flags.controller'
import { FlagsService } from './flags.service'

@Module({
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
