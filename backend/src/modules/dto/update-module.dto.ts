import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ModuleMediaType } from '@prisma/client';
import { Type } from 'class-transformer';

class UpdateModuleFileDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsEnum(ModuleMediaType)
  mediaType: ModuleMediaType;

  @IsString()
  mediaUrl: string;
}

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
  deadlineDays?: number;

  @IsOptional()
  @IsEnum(ModuleMediaType)
  mediaType?: ModuleMediaType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateModuleFileDto)
  filesToAdd?: UpdateModuleFileDto[];
}
