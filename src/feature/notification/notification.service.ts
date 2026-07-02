import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms/sms.service';
import { EmailService } from './email.service';

export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async sendSms(options: SendSmsOptions) {
    await this.smsService.send(options.to, options.message);
    return { message: 'SMS sent successfully' };
  }

  async sendEmail(options: SendEmailOptions) {
    await this.emailService.send({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { message: 'Email sent successfully' };
  }
}
