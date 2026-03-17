import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SetupController } from './setup.controller';

@Module({
  controllers: [AuthController, SetupController],
  providers: [AuthService],
})
export class AuthModule {}
