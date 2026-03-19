import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SegmentConditionDto {
  @IsString()
  attribute: string;

  @IsString()
  operator: string;

  @IsString()
  value: string;
}

export class CreateSegmentDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConditionDto)
  conditions?: SegmentConditionDto[];
}

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentConditionDto)
  conditions?: SegmentConditionDto[];
}
