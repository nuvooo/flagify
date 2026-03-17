import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset-demo')
  async resetDemo() {
    // Delete existing demo user and related data
    const existingUser = await this.prisma.user.findUnique({
      where: { email: 'demo@togglely.io' },
    });

    if (existingUser) {
      // Delete organization memberships
      await this.prisma.organizationMember.deleteMany({
        where: { userId: existingUser.id },
      });

      // Find and delete user's organizations and related data
      const memberships = await this.prisma.organizationMember.findMany({
        where: { userId: existingUser.id },
      });

      for (const membership of memberships) {
        // Delete projects and related data
        const projects = await this.prisma.project.findMany({
          where: { organizationId: membership.organizationId },
        });

        for (const project of projects) {
          await this.prisma.flagEnvironment.deleteMany({
            where: { flag: { projectId: project.id } },
          });
          await this.prisma.featureFlag.deleteMany({
            where: { projectId: project.id },
          });
          await this.prisma.environment.deleteMany({
            where: { projectId: project.id },
          });
          await this.prisma.brand.deleteMany({
            where: { projectId: project.id },
          });
        }

        await this.prisma.project.deleteMany({
          where: { organizationId: membership.organizationId },
        });
      }

      // Delete organizations
      const orgIds = memberships.map(m => m.organizationId);
      await this.prisma.organization.deleteMany({
        where: { id: { in: orgIds } },
      });

      // Delete user
      await this.prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    // Create fresh demo user
    const hashedPassword = await bcrypt.hash('demo123!', 12);

    const user = await this.prisma.user.create({
      data: {
        email: 'demo@togglely.io',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
      },
    });

    const org = await this.prisma.organization.create({
      data: {
        name: 'Demo Organization',
        slug: 'demo-organization',
        description: 'A demo organization for testing',
      },
    });

    await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'OWNER',
      },
    });

    // Create sample project
    const project = await this.prisma.project.create({
      data: {
        name: 'Sample Project',
        key: 'sample-project',
        description: 'A sample project',
        type: 'SINGLE',
        organizationId: org.id,
        environments: {
          create: [
            { name: 'Development', key: 'development', organizationId: org.id },
            { name: 'Production', key: 'production', organizationId: org.id },
          ],
        },
      },
    });

    return {
      success: true,
      message: 'Demo data reset successfully',
      credentials: {
        email: 'demo@togglely.io',
        password: 'demo123!',
      },
    };
  }
}
