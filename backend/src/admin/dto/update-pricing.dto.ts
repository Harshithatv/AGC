import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsString()
  @IsNotEmpty()
  packageType: string;

  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  highlight?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
