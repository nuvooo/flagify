import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export enum EnvironmentType {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  key: string

  @IsString()
  @IsNotEmpty()
  projectId: string

  @IsString()
  @IsNotEmpty()
  organizationId: string
}

export class UpdateEnvironmentDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  key?: string
}
