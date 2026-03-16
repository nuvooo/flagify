/**
 * Dependency Injection Container
 */

import { PrismaClient } from '@prisma/client';
import { PrismaFlagRepository } from '../infrastructure/persistence/prisma/prisma-flag.repository';
import { PrismaProjectRepository } from '../infrastructure/persistence/prisma/prisma-project.repository';
import { PrismaBrandRepository } from '../infrastructure/persistence/prisma/prisma-brand.repository';
import { EvaluateFlagUseCase } from '../application/flag/evaluate-flag.usecase';
import { CreateFlagUseCase } from '../application/flag/create-flag.usecase';
import { UpdateFlagUseCase } from '../application/flag/update-flag.usecase';
import { DeleteFlagUseCase } from '../application/flag/delete-flag.usecase';
import { UpdateFlagValueUseCase } from '../application/flag/update-flag-value.usecase';
import { CreateProjectUseCase } from '../application/project/create-project.usecase';
import { UpdateProjectUseCase } from '../application/project/update-project.usecase';
import { DeleteProjectUseCase } from '../application/project/delete-project.usecase';

export type Constructor<T> = new (...args: any[]) => T;
export type Factory<T> = () => T;

export interface Provider<T = any> {
  token: symbol | string;
  useClass?: Constructor<T>;
  useValue?: T;
  useFactory?: Factory<T>;
}

export class Container {
  private static instance: Container;
  private providers = new Map<symbol | string, Provider>();
  private instances = new Map<symbol | string, any>();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register<T>(provider: Provider<T>): void {
    this.providers.set(provider.token, provider);
  }

  registerClass<T>(token: symbol | string, useClass: Constructor<T>): void {
    this.providers.set(token, { token, useClass });
  }

  registerValue<T>(token: symbol | string, useValue: T): void {
    this.providers.set(token, { token, useValue });
  }

  registerFactory<T>(token: symbol | string, useFactory: Factory<T>): void {
    this.providers.set(token, { token, useFactory });
  }

  resolve<T>(token: symbol | string): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${token.toString()}`);
    }

    let instance: T;

    if (provider.useValue !== undefined) {
      instance = provider.useValue;
    } else if (provider.useFactory) {
      instance = provider.useFactory();
    } else if (provider.useClass) {
      instance = new provider.useClass();
    } else {
      throw new Error(`Invalid provider for token: ${token.toString()}`);
    }

    this.instances.set(token, instance);
    return instance;
  }

  clear(): void {
    this.providers.clear();
    this.instances.clear();
  }
}

export const container = Container.getInstance();

// Tokens
export const FLAG_REPOSITORY = Symbol('FlagRepository');
export const PROJECT_REPOSITORY = Symbol('ProjectRepository');
export const BRAND_REPOSITORY = Symbol('BrandRepository');
export const PRISMA_CLIENT = Symbol('PrismaClient');

// Use Case Tokens
export const EVALUATE_FLAG_USE_CASE = Symbol('EvaluateFlagUseCase');
export const CREATE_FLAG_USE_CASE = Symbol('CreateFlagUseCase');
export const UPDATE_FLAG_USE_CASE = Symbol('UpdateFlagUseCase');
export const DELETE_FLAG_USE_CASE = Symbol('DeleteFlagUseCase');
export const UPDATE_FLAG_VALUE_USE_CASE = Symbol('UpdateFlagValueUseCase');
export const CREATE_PROJECT_USE_CASE = Symbol('CreateProjectUseCase');
export const UPDATE_PROJECT_USE_CASE = Symbol('UpdateProjectUseCase');
export const DELETE_PROJECT_USE_CASE = Symbol('DeleteProjectUseCase');

export function setupContainer(prisma: PrismaClient): void {
  // Prisma
  container.registerValue(PRISMA_CLIENT, prisma);

  // Repositories
  container.registerFactory(FLAG_REPOSITORY, () => new PrismaFlagRepository(prisma));
  container.registerFactory(PROJECT_REPOSITORY, () => new PrismaProjectRepository(prisma));
  container.registerFactory(BRAND_REPOSITORY, () => new PrismaBrandRepository(prisma));

  // Flag Use Cases
  container.registerFactory(EVALUATE_FLAG_USE_CASE, () =>
    new EvaluateFlagUseCase(
      container.resolve(FLAG_REPOSITORY),
      container.resolve(PROJECT_REPOSITORY),
      container.resolve(BRAND_REPOSITORY)
    )
  );

  container.registerFactory(CREATE_FLAG_USE_CASE, () =>
    new CreateFlagUseCase(
      container.resolve(FLAG_REPOSITORY),
      container.resolve(PROJECT_REPOSITORY)
    )
  );

  container.registerFactory(UPDATE_FLAG_USE_CASE, () =>
    new UpdateFlagUseCase(container.resolve(FLAG_REPOSITORY))
  );

  container.registerFactory(DELETE_FLAG_USE_CASE, () =>
    new DeleteFlagUseCase(container.resolve(FLAG_REPOSITORY))
  );

  container.registerFactory(UPDATE_FLAG_VALUE_USE_CASE, () =>
    new UpdateFlagValueUseCase(container.resolve(FLAG_REPOSITORY))
  );

  // Project Use Cases
  container.registerFactory(CREATE_PROJECT_USE_CASE, () =>
    new CreateProjectUseCase(container.resolve(PROJECT_REPOSITORY))
  );

  container.registerFactory(UPDATE_PROJECT_USE_CASE, () =>
    new UpdateProjectUseCase(container.resolve(PROJECT_REPOSITORY))
  );

  container.registerFactory(DELETE_PROJECT_USE_CASE, () =>
    new DeleteProjectUseCase(
      container.resolve(PROJECT_REPOSITORY),
      container.resolve(FLAG_REPOSITORY),
      container.resolve(BRAND_REPOSITORY)
    )
  );
}
