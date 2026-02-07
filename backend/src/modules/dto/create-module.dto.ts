import { ModuleMediaType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class CreateModuleFileDto {
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsOptional()
  @IsString()
  title?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;

  @IsEnum(ModuleMediaType)
  mediaType: ModuleMediaType;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  mediaUrl: string;
}

export class CreateModuleDto {
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  title: string;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  deadlineDays: number;

  @IsEnum(ModuleMediaType)
  mediaType: ModuleMediaType;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  mediaUrl: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuleFileDto)
  files?: CreateModuleFileDto[];
}
