import { IsArray, IsIn, IsOptional, IsString } from 'class-validator'

export class CreateProjectDto {
  @IsString()
  name: string

  @IsString()
  key: string

  @IsString()
  @IsOptional()
  description?: string

  @IsIn(['SINGLE', 'MULTI'])
  @IsOptional()
  type?: 'SINGLE' | 'MULTI' = 'SINGLE'

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedOrigins?: string[] = []
}
