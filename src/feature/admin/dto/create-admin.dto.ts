import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  full_name!: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '9800000000' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
