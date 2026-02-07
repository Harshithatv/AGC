import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim().toLowerCase()))
  @IsEmail()
  email: string;
}
