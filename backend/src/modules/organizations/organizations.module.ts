import { Module } from '@nestjs/common'
import { MailerModule } from '../../shared/mailer.module'
import { PrismaModule } from '../../shared/prisma.module'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from './organizations.service'

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
