import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ModuleMediaType } from '@prisma/client';

export class UploadModuleFileDto {
  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsEnum(ModuleMediaType)
  mediaType?: ModuleMediaType;
}
