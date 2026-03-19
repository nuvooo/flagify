import { 
  IsString, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsEnum, 
  IsNumber, 
  IsBoolean,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExperimentVariantDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  value: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  trafficPercent: number;

  @IsOptional()
  @IsBoolean()
  isControl?: boolean;
}

export class ExperimentMetricDto {
  @IsString()
  name: string;

  @IsEnum(['CONVERSION', 'COUNT', 'SUM', 'AVERAGE', 'UNIQUE_COUNT'])
  type: string;

  @IsString()
  eventName: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  targetValue?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateExperimentDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  hypothesis?: string;

  @IsString()
  flagId: string;

  @IsString()
  environmentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  trafficAllocation?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants: ExperimentVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentMetricDto)
  metrics?: ExperimentMetricDto[];
}

export class UpdateExperimentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  hypothesis?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  trafficAllocation?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants?: ExperimentVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentMetricDto)
  metrics?: ExperimentMetricDto[];
}

export class TrackEventDto {
  @IsString()
  eventType: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
