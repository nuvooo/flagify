import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PrismaModule } from '../../shared/prisma.module';
import { MailerModule } from '../../shared/mailer.module';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
