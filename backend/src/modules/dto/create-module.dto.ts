import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { ModuleMediaType } from '@prisma/client';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  deadlineDays: number;

  @IsEnum(ModuleMediaType)
  mediaType: ModuleMediaType;

  @IsString()
  mediaUrl: string;
}
