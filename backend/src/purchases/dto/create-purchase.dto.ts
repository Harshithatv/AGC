import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class CreatePurchaseDto {
  @IsEnum(OrganizationType)
  packageType: OrganizationType;

  @IsString()
  organizationName: string;

  @IsString()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;

  @IsOptional()
  @IsString()
  instituteName?: string;

  @IsOptional()
  @IsString()
  roleAtSchool?: string;
}
