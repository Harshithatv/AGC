import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class UpdatePricingDto {
  @IsEnum(OrganizationType)
  packageType: OrganizationType;

  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
