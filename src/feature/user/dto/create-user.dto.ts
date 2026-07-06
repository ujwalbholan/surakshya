import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(4)
  @MaxLength(15)
  full_name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+97798XXXXXXXX' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;
}
