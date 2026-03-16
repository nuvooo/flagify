import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { getRedis } from '../utils/redis';

// Cache utilities
const getCacheKey = (envId: string, flagKey?: string) => 
  flagKey ? `flags:${envId}:${flagKey}` : `flags:${envId}:all`;

const getAllFlagsCacheKey = (envId: string) => `flags:${envId}:all`;

const CACHE_TTL = 60; // 1 minute for SDK endpoints

interface FlagContext {
  userId?: string;
  email?: string;
  country?: string;
  region?: string;
  tenantId?: string;
  brandKey?: string;
  [key: string]: any;
}

const evaluateCondition = (context: FlagContext, condition: any): boolean => {
  const value = context[condition.attribute];
  
  switch (condition.operator) {
    case 'EQUALS':
      return value === condition.value;
    case 'NOT_EQUALS':
      return value !== condition.value;
    case 'CONTAINS':
      return String(value).includes(condition.value);
    case 'GREATER_THAN':
      return Number(value) > Number(condition.value);
    case 'LESS_THAN':
      return Number(value) < Number(condition.value);
    case 'IN':
      return condition.value.split(',').map((v: string) => v.trim()).includes(String(value));
    default:
      return false;
  }
};

const evaluateTargetingRules = (context: FlagContext, rules: any[]): any | null => {
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    if (!rule.conditions || rule.conditions.length === 0) {
      return rule.serveValue;
    }

    const results = rule.conditions.map((c: any) => evaluateCondition(context, c));
    const matches = rule.operator === 'OR' 
      ? results.some((r: boolean) => r) 
      : results.every((r: boolean) => r);

    if (matches) {
      return rule.serveValue;
    }
  }

  return null;
};

/**
 * Parse flag value based on type
 * Returns the actual value if enabled, or false/null if disabled
 */
const parseFlagValue = (value: string | null, type: string, enabled: boolean): any => {
  // If disabled, return false
  if (!enabled) {
    return false;
  }
  
  // If enabled but no value, return true for boolean, empty for others
  if (value === null || value === undefined) {
    return type === 'BOOLEAN' ? true : '';
  }

  switch (type) {
    case 'BOOLEAN':
      return value === 'true';
    case 'NUMBER':
      return Number(value);
    case 'JSON':
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    default:
      return value;
  }
};

export const getAllFlags = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectKey, environmentKey } = req.params;
    const organizationId = req.organizationId;
    const context: FlagContext = req.query.context ? JSON.parse(req.query.context as string) : {};
    const brandKey = (req.query.brandKey as string) || context.tenantId || context.brandKey || null;

    const environment = await prisma.environment.findFirst({
      where: {
        key: environmentKey,
        project: { 
          key: projectKey,
          organizationId 
        }
      },
      include: { project: true }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    let brand: { id: string } | null = null;
    if (brandKey) {
      brand = await prisma.brand.findFirst({
        where: { key: brandKey, projectId: environment.projectId },
        select: { id: true }
      });
    }

    // Try cache first - ONLY if no brand specified
    const redis = getRedis();
    const cacheKey = getAllFlagsCacheKey(environment.id);
    if (!brandKey) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // For multi-tenant: only return brand-specific flags
    // If no brand specified, return empty (no defaults in multi-tenant)
    let flagEnvs: any[] = [];
    
    if (brand) {
      // Fetch brand-specific flags
      flagEnvs = await prisma.flagEnvironment.findMany({
        where: {
          environmentId: environment.id,
          brandId: brand.id
        },
        include: {
          flag: { select: { id: true, key: true, flagType: true } },
          targetingRules: { include: { conditions: true } }
        }
      });
    }
    // If no brand specified, flagEnvs stays empty → all flags will return false

    const result: Record<string, { value: any; enabled: boolean }> = {};

    for (const flagEnv of flagEnvs) {
      let value = parseFlagValue(flagEnv.defaultValue, flagEnv.flag.flagType, flagEnv.enabled);
      
      // Only evaluate targeting rules if enabled and context provided
      if (flagEnv.enabled && Object.keys(context).length > 0 && flagEnv.targetingRules.length > 0) {
        const ruleValue = evaluateTargetingRules(context, flagEnv.targetingRules);
        if (ruleValue !== null) {
          value = parseFlagValue(ruleValue, flagEnv.flag.flagType, true);
        }
      }

      result[flagEnv.flag.key] = {
        value,
        enabled: flagEnv.enabled
      };
    }

    // Cache only if no brand specified
    if (!brandKey) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFlag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectKey, environmentKey, flagKey } = req.params;
    const organizationId = req.organizationId;
    const context: FlagContext = req.query.context ? JSON.parse(req.query.context as string) : {};
    const brandKey = (req.query.brandKey as string) || context.tenantId || context.brandKey || null;
    
    console.log(`[SDK] GetFlag: project=${projectKey}, env=${environmentKey}, flag=${flagKey}, brand=${brandKey}`);

    const environment = await prisma.environment.findFirst({
      where: {
        key: environmentKey,
        project: { 
          key: projectKey,
          organizationId 
        }
      },
      include: { project: true }
    });

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    // Look up brand if brandKey provided
    let brand: { id: string } | null = null;
    if (brandKey) {
      brand = await prisma.brand.findFirst({
        where: { key: brandKey, projectId: environment.projectId },
        select: { id: true }
      });
    }

    // For multi-tenant: only return brand-specific flag
    // If no brand specified or brand not found, return false
    let flagEnv = null;
    
    if (brand) {
      flagEnv = await prisma.flagEnvironment.findFirst({
        where: {
          environmentId: environment.id,
          brandId: brand.id,
          flag: { key: flagKey }
        },
        include: {
          flag: true,
          targetingRules: { include: { conditions: true } }
        }
      });
    }

    if (!flagEnv) {
      console.log(`[SDK] Flag not found: ${flagKey}`);
      return res.json({
        value: false,
        enabled: false
      });
    }

    console.log(`[SDK] Found: type=${flagEnv.flag.flagType}, value=${flagEnv.defaultValue}, enabled=${flagEnv.enabled}`);

    // Parse value based on type and enabled state
    let value = parseFlagValue(flagEnv.defaultValue, flagEnv.flag.flagType, flagEnv.enabled);
    
    // Evaluate targeting rules only if enabled
    if (flagEnv.enabled && Object.keys(context).length > 0 && flagEnv.targetingRules.length > 0) {
      const ruleValue = evaluateTargetingRules(context, flagEnv.targetingRules);
      if (ruleValue !== null) {
        value = parseFlagValue(ruleValue, flagEnv.flag.flagType, true);
      }
    }

    console.log(`[SDK] Returning: value=${JSON.stringify(value)}, enabled=${flagEnv.enabled}`);
    
    res.json({
      value,
      enabled: flagEnv.enabled
    });
  } catch (error) {
    next(error);
  }
};

export const evaluateFlag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectKey, environmentKey, flagKey } = req.params;
    const context: FlagContext = req.body.context || {};
    
    const result = await getFlag(
      { ...req, query: { context: JSON.stringify(context) }, params: { projectKey, environmentKey, flagKey } } as any,
      res,
      next
    );
    
    return result;
  } catch (error) {
    next(error);
  }
};
