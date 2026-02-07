import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ModuleMediaType } from '@prisma/client';

export class UploadModuleFileDto {
  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ModuleMediaType)
  mediaType?: ModuleMediaType;
}
