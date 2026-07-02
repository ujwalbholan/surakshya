import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Role } from 'src/feature/auth/dto/auth.dto';

export class CreateUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(15)
  full_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  password!: string;

  @IsEnum(Role)
  role!: Role;
}
