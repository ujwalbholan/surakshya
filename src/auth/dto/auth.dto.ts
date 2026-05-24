import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum Role {
  USER = 'USER',
  GUARDIAN = 'GUARDIAN',
  POLICE = 'POLICE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export class RegisterDto {
  @IsString()
  @MinLength(4, { message: 'Must be more than 4 characters' })
  @MaxLength(15, { message: 'Must be less then 15 characters' })
  full_name!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsEnum(Role)
  role!: Role;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class TokenDto {
  @IsString()
  refreshToken!: string;

  @IsString()
  accessToken!: string;
}
