import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ClaimDeviceDto {
  @ApiProperty({ example: 'IMEI123456789' })
  @IsString()
  imei!: string;
}
