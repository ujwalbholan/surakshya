import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
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

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyResetOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(5)
  newPassword!: string;

  @IsString()
  @MinLength(5)
  comparePassword!: string;

  @IsString()
  @IsNotEmpty()
  resetToken!: string;
}
