import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './email.service';
import { OtpEmailService } from './email/otp.email';
import { WelcomeEmailService } from './email/welcome.email';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    OtpEmailService,
    WelcomeEmailService,
  ],
  exports: [OtpEmailService, WelcomeEmailService],
})
export class NotificationModule {}
