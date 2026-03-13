import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function resetDemoData() {
  console.log('🔄 Resetting demo data...');

  try {
    // 1. Find the demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@flagify.io' }
    });

    if (demoUser) {
      // 2. Find all organizations where the demo user is an OWNER
      const demoOrgs = await prisma.organizationMember.findMany({
        where: {
          userId: demoUser.id,
          role: 'OWNER'
        },
        select: { organizationId: true }
      });

      const orgIds = demoOrgs.map(o => o.organizationId);

      if (orgIds.length > 0) {
        // 3. Delete everything associated with those organizations
        // Delete Audit Logs
        await prisma.auditLog.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete API Keys
        await prisma.apiKey.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete Flag Environments (Targeting Rules delete cascade usually, but manual check for MongoDB)
        await prisma.targetingRule.deleteMany({ where: { organizationId: { in: orgIds } } });
        await prisma.flagEnvironment.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete Feature Flags
        await prisma.featureFlag.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete Brands
        await prisma.brand.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete Environments
        await prisma.environment.deleteMany({ where: { organizationId: { in: orgIds } } });
        // Delete Projects
        await prisma.project.deleteMany({ where: { organizationId: { in: orgIds } } });
        
        // Final: Delete the Organizations themselves
        await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
        
        // Also delete memberships
        await prisma.organizationMember.deleteMany({ where: { organizationId: { in: orgIds } } });
      }

      // 4. Re-create the seed data
      const hashedPassword = await hashPassword('demo1234');
      
      // Update user password and name just in case it was changed
      await prisma.user.update({
        where: { id: demoUser.id },
        data: {
          firstName: 'Demo',
          lastName: 'User',
          password: hashedPassword
        }
      });

      // Create organization
      const org = await prisma.organization.create({
        data: {
          name: 'Demo Organization',
          slug: 'demo-organization',
          description: 'A demo organization for testing'
        }
      });

      // Add user as owner
      await prisma.organizationMember.create({
        data: {
          userId: demoUser.id,
          organizationId: org.id,
          role: 'OWNER'
        }
      });

      // Create project
      const project = await prisma.project.create({
        data: {
          name: 'Demo Project',
          key: 'demo-project',
          description: 'A demo project with sample feature flags',
          organizationId: org.id
        }
      });

      // Create environments
      const devEnv = await prisma.environment.create({
        data: {
          name: 'Development',
          key: 'development',
          projectId: project.id,
          organizationId: org.id,
          sortOrder: 0
        }
      });

      const prodEnv = await prisma.environment.create({
        data: {
          name: 'Production',
          key: 'production',
          projectId: project.id,
          organizationId: org.id,
          sortOrder: 1
        }
      });

      // Create sample feature flags
      const flags = [
        {
          name: 'New Dashboard',
          key: 'new-dashboard',
          description: 'Enable the new dashboard UI',
          flagType: 'BOOLEAN' as const,
          devEnabled: true,
          prodEnabled: false,
          defaultValue: 'false'
        },
        {
          name: 'Dark Mode',
          key: 'dark-mode',
          description: 'Enable dark mode theme',
          flagType: 'BOOLEAN' as const,
          devEnabled: true,
          prodEnabled: true,
          defaultValue: 'true'
        }
      ];

      for (const flagData of flags) {
        await prisma.featureFlag.create({
          data: {
            name: flagData.name,
            key: flagData.key,
            description: flagData.description,
            flagType: flagData.flagType,
            organizationId: org.id,
            projectId: project.id,
            createdById: demoUser.id,
            flagEnvironments: {
              create: [
                {
                  environmentId: devEnv.id,
                  enabled: flagData.devEnabled,
                  defaultValue: flagData.defaultValue,
                  organizationId: org.id
                },
                {
                  environmentId: prodEnv.id,
                  enabled: flagData.prodEnabled,
                  defaultValue: flagData.defaultValue,
                  organizationId: org.id
                }
              ]
            }
          }
        });
      }

      // Create a demo API key
      await prisma.apiKey.create({
        data: {
          name: 'Demo SDK Key',
          key: 'flagify_demo_sdk_key_for_testing_purposes_only',
          type: 'SDK',
          organizationId: org.id,
          userId: demoUser.id
        }
      });

      console.log('✅ Demo data reset successfully');
    }
  } catch (error) {
    console.error('❌ Demo data reset failed:', error);
  }
}
