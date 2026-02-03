import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';

class BulkUserItemDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

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
