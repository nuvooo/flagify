import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const sendInvalidIdError = (res: Response, fieldName: string = 'ID') => {
  res.status(400).json({ error: `Invalid ${fieldName} format` });
};

export const getEnvironments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;

    const environments = await prisma.environment.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            flagEnvironments: true
          }
        }
      }
    });

    res.json(environments.map(e => ({
      id: e.id,
      name: e.name,
      key: e.key,
      sortOrder: e.sortOrder,
      projectId: e.projectId,
      flagCount: e._count.flagEnvironments,
      createdAt: e.createdAt
    })));
  } catch (error) {
    next(error);
  }
};

export const getEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { environmentId } = req.params;

    if (!isValidObjectId(environmentId)) {
      return sendInvalidIdError(res, 'Environment ID');
    }

    const env = await prisma.environment.findUnique({
      where: { id: environmentId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        flagEnvironments: {
          include: {
            flag: {
              select: {
                id: true,
                name: true,
                key: true,
                flagType: true
              }
            }
          }
        }
      }
    });

    if (!env) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    res.json({
      id: env.id,
      name: env.name,
      key: env.key,
      projectId: env.projectId,
      project: env.project,
      flags: env.flagEnvironments.map(fe => ({
        id: fe.id,
        flagId: fe.flagId,
        name: fe.flag.name,
        key: fe.flag.key,
        type: fe.flag.flagType,
        enabled: fe.enabled,
        defaultValue: fe.defaultValue
      })),
      createdAt: env.createdAt,
      updatedAt: env.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

export const createEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { name, key } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        featureFlags: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create environment and flag environments in transaction
    const result = await prisma.$transaction(async (tx) => {
      const environment = await tx.environment.create({
        data: {
          name,
          key,
          projectId,
          organizationId: project.organizationId
        }
      });

      // Create flag environments for all existing feature flags
      if (project.featureFlags.length > 0) {
        const defaultValues: Record<string, string> = {
          'BOOLEAN': 'false',
          'STRING': '',
          'NUMBER': '0',
          'JSON': '{}'
        };

        await tx.flagEnvironment.createMany({
          data: project.featureFlags.map(flag => ({
            flagId: flag.id,
            environmentId: environment.id,
            enabled: false,
            defaultValue: defaultValues[flag.flagType] || ''
          }))
        });
      }

      return environment;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { environmentId } = req.params;
    const { name } = req.body;

    if (!isValidObjectId(environmentId)) {
      return sendInvalidIdError(res, 'Environment ID');
    }

    const environment = await prisma.environment.update({
      where: { id: environmentId },
      data: { name }
    });

    res.json(environment);
  } catch (error) {
    next(error);
  }
};

export const deleteEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { environmentId } = req.params;

    if (!isValidObjectId(environmentId)) {
      return sendInvalidIdError(res, 'Environment ID');
    }

    await prisma.environment.delete({
      where: { id: environmentId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Reorder environments
export const reorderEnvironments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { environmentIds } = req.body; // Array of environment IDs in new order

    if (!isValidObjectId(projectId)) {
      return sendInvalidIdError(res, 'Project ID');
    }

    if (!Array.isArray(environmentIds)) {
      return res.status(400).json({ error: 'environmentIds must be an array' });
    }

    // Update sortOrder for each environment
    await prisma.$transaction(
      environmentIds.map((id, index) =>
        prisma.environment.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    );

    res.json({ message: 'Environments reordered successfully' });
  } catch (error) {
    next(error);
  }
};
