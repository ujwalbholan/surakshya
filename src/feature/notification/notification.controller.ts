import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { IsString, IsNotEmpty } from 'class-validator';

class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}

class SendEmailDto {
  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsNotEmpty()
  html!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'POLICE')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send-sms')
  sendSms(@Body() dto: SendSmsDto) {
    return this.notificationService.sendSms(dto);
  }

  @Post('send-email')
  sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationService.sendEmail(dto);
  }
}
