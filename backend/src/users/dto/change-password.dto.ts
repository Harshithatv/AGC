import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangePasswordDto {
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  @MinLength(6)
  newPassword: string;
}
