import { ModuleMediaType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';

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
  durationMinutes: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  deadlineDays: number;

  @IsEnum(ModuleMediaType)
  mediaType: ModuleMediaType;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  mediaUrl: string;
}
