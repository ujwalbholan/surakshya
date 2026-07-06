import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

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
}
