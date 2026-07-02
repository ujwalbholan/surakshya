import { IsString, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  imei!: string;

  @IsOptional()
  @IsString()
  label?: string;
}
