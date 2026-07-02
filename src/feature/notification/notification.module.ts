import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './email.service';
import { OtpEmailService } from './email/otp.email';
import { WelcomeEmailService } from './email/welcome.email';
import { SmsService } from './sms/sms.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    OtpEmailService,
    WelcomeEmailService,
    SmsService,
  ],
  exports: [OtpEmailService, WelcomeEmailService, SmsService],
})
export class NotificationModule {}
