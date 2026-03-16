import { IsBoolean, IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateFlagValueDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  value?: string;

  @IsUUID()
  @IsOptional()
  brandId?: string | null;
}
