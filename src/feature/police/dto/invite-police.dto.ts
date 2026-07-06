import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class InvitePoliceDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  full_name!: string;

  @ApiProperty({ example: 'john@police.gov.np' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '9800000000' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'uuid-of-police-station' })
  @IsUUID()
  station_id!: string;
}
