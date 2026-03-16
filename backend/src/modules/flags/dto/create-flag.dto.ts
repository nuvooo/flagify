import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['BOOLEAN', 'STRING', 'NUMBER', 'JSON'])
  type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';

  @IsObject()
  @IsOptional()
  initialValues?: Record<string, { enabled: boolean; value: string }>;
}
