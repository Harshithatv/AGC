import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  packageType: string;

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
