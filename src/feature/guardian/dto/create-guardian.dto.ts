import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGuardianDto {
  @IsString()
  @MinLength(4, { message: 'Must be more than 4 characters' })
  @MaxLength(15, { message: 'Must be less then 15 characters' })
  full_name!: string;

  @IsString()
  @Matches(/^(\+977)?9[678]\d{8}$/, {
    message: 'Phone must be a valid Nepal mobile number',
  })
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(5)
  password!: string;
}
