import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  name: string;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsEmail()
  email: string;

  @Transform(({ value }) => (value === null || value === undefined ? value : String(value).trim()))
  @IsString()
  @MinLength(6)
  password: string;
}
