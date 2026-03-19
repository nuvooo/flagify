import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SetupController } from './setup.controller';
import { PrismaModule } from '../../shared/prisma.module';
import { MailerModule } from '../../shared/mailer.module';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [AuthController, SetupController],
  providers: [AuthService],
})
export class AuthModule {}
