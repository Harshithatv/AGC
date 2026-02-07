import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  @MinLength(6)
  newPassword: string;
}
