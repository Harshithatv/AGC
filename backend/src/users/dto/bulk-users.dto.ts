import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';

class BulkUserItemDto {
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

export class BulkUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkUserItemDto)
  users: BulkUserItemDto[];
}
