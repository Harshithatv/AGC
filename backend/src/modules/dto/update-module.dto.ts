import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ModuleMediaType } from '@prisma/client';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  deadlineDays?: number;

  @IsOptional()
  @IsEnum(ModuleMediaType)
  mediaType?: ModuleMediaType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
