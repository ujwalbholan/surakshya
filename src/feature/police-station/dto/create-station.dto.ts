import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStationDto {
  @ApiProperty({ example: 'Kathmandu Police Station' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'Kathmandu, Nepal' })
  @IsString()
  address!: string;

  @ApiProperty({ example: '+977-01-4XXXXXX' })
  @IsString()
  @MaxLength(30)
  contact_number!: string;

  @ApiProperty({ example: 27.7172, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  latitude?: number;

  @ApiProperty({ example: 85.324, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  longitude?: number;
}
