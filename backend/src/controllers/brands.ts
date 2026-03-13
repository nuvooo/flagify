import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { invalidateFlagCache } from '../utils/redis';
import { createAuditLog } from '../services/auditLog';

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Get all flags for a brand (with brand-specific values)
export const getBrandFlags = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { brandId } = req.params;

    if (!isValidObjectId(brandId)) {
      return res.status(400).json({ error: 'Invalid brand ID' });
    }

    // Get brand with project info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { project: true }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Get all flags for this project
    const flags = await prisma.featureFlag.findMany({
      where: { projectId: brand.projectId },
      include: {
        flagEnvironments: {
          where: {
            OR: [
              { brandId: null }, // Default values
              { brandId: brandId } // Brand-specific values
            ]
          },
          include: {
            environment: {
              select: { id: true, name: true, key: true }
            }
          }
        }
      }
    });

    // Transform to include brand-specific or default values
    const transformedFlags = flags.map(flag => ({
      id: flag.id,
      name: flag.name,
      key: flag.key,
      description: flag.description,
      flagType: flag.flagType,
      environments: flag.flagEnvironments.map(fe => {
        const isBrandSpecific = fe.brandId === brandId;
        const defaultEnv = flag.flagEnvironments.find(e => e.environmentId === fe.environmentId && !e.brandId);
        return {
          id: fe.id,
          environmentId: fe.environmentId,
          environmentName: fe.environment.name,
          enabled: fe.enabled,
          defaultValue: fe.defaultValue,
          isBrandSpecific,
          // If this is the default (non-brand) entry, check if brand has override
          brandOverride: isBrandSpecific ? null : {
            enabled: defaultEnv?.enabled ?? fe.enabled,
            defaultValue: defaultEnv?.defaultValue ?? fe.defaultValue
          }
        };
      }).filter((fe, index, self) => 
        // Remove duplicates - keep only brand-specific or default if no brand-specific
        self.findIndex(e => e.environmentId === fe.environmentId) === index
      )
    }));

    res.json({
      brand,
      flags: transformedFlags
    });
  } catch (error) {
    next(error);
  }
};

// Toggle flag for a brand
export const toggleBrandFlag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { brandId, flagId } = req.params;
    const { environmentId, enabled } = req.body;
    const userId = req.user!.userId;

    if (!isValidObjectId(brandId) || !isValidObjectId(flagId) || !isValidObjectId(environmentId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Get brand and flag
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { project: true }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { id: flagId }
    });

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    // Check if brand-specific flag environment exists
    let flagEnv = await prisma.flagEnvironment.findFirst({
      where: {
        flagId,
        environmentId,
        brandId
      }
    });

    if (flagEnv) {
      // Update existing
      flagEnv = await prisma.flagEnvironment.update({
        where: { id: flagEnv.id },
        data: { enabled }
      });
    } else {
      // Get default value to copy
      const defaultEnv = await prisma.flagEnvironment.findFirst({
        where: {
          flagId,
          environmentId,
          brandId: null
        }
      });

      // Create brand-specific
      flagEnv = await prisma.flagEnvironment.create({
        data: {
          flagId,
          environmentId,
          brandId,
          enabled,
          defaultValue: defaultEnv?.defaultValue || 'false'
        }
      });
    }

    await invalidateFlagCache(environmentId, flag.key);

    await createAuditLog({
      action: 'TOGGLE_BRAND',
      entityType: 'FLAG_ENVIRONMENT',
      entityId: flagEnv.id,
      organizationId: brand.project.organizationId,
      projectId: brand.projectId,
      userId,
      newValues: { brandId, flagId, environmentId, enabled }
    });

    res.json(flagEnv);
  } catch (error) {
    next(error);
  }
};

// Update brand flag value
export const updateBrandFlagValue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { brandId, flagId } = req.params;
    const { environmentId, defaultValue } = req.body;
    const userId = req.user!.userId;

    if (!isValidObjectId(brandId) || !isValidObjectId(flagId) || !isValidObjectId(environmentId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Get brand and flag
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { project: true }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { id: flagId }
    });

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    // Check if brand-specific flag environment exists
    let flagEnv = await prisma.flagEnvironment.findFirst({
      where: {
        flagId,
        environmentId,
        brandId
      }
    });

    if (flagEnv) {
      // Update existing
      flagEnv = await prisma.flagEnvironment.update({
        where: { id: flagEnv.id },
        data: { defaultValue }
      });
    } else {
      // Get default value for enabled state
      const defaultEnv = await prisma.flagEnvironment.findFirst({
        where: {
          flagId,
          environmentId,
          brandId: null
        }
      });

      // Create brand-specific
      flagEnv = await prisma.flagEnvironment.create({
        data: {
          flagId,
          environmentId,
          brandId,
          enabled: defaultEnv?.enabled || false,
          defaultValue
        }
      });
    }

    await invalidateFlagCache(environmentId, flag.key);

    await createAuditLog({
      action: 'UPDATE_BRAND_VALUE',
      entityType: 'FLAG_ENVIRONMENT',
      entityId: flagEnv.id,
      organizationId: brand.project.organizationId,
      projectId: brand.projectId,
      userId,
      newValues: { brandId, flagId, environmentId, defaultValue }
    });

    res.json(flagEnv);
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    
    if (!isValidObjectId(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const brands = await prisma.brand.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(brands);
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { name, key, description } = req.body;

    if (!isValidObjectId(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        key,
        description,
        projectId
      }
    });

    res.status(201).json(brand);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Brand key already exists' });
    }
    next(error);
  }
};

export const updateBrand = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { brandId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(brandId)) {
      return res.status(400).json({ error: 'Invalid brand ID' });
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json(brand);
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { brandId } = req.params;

    if (!isValidObjectId(brandId)) {
      return res.status(400).json({ error: 'Invalid brand ID' });
    }

    await prisma.brand.delete({
      where: { id: brandId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
