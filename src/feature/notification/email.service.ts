import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey?: string;
  private readonly from?: string;
  private readonly transporter?: nodemailer.Transporter;

  constructor() {
    this.from = process.env.MAIL_FROM;
    this.resendApiKey = process.env.RESEND_API_KEY;

    if (this.resendApiKey && this.from) {
      return;
    }

    if (
      !process.env.MAIL_HOST ||
      !process.env.MAIL_PORT ||
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASSWORD ||
      !process.env.MAIL_FROM
    ) {
      this.logger.warn(
        'Mail is disabled because one or more MAIL_* variables are missing',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true',
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.from) {
      this.logger.error('Email delivery failed: MAIL_FROM is not configured');
      throw new ServiceUnavailableException('Email service is unavailable');
    }

    try {
      if (this.resendApiKey) {
        await this.sendWithResend(message);
        return;
      }

      if (!this.transporter) {
        throw new ServiceUnavailableException(
          'No email provider is configured',
        );
      }

      await this.transporter.sendMail({ ...message, from: this.from });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const reason =
        error instanceof Error ? error.message : 'Unknown mail provider error';

      this.logger.error(`Email delivery failed: ${reason}`);
      throw new ServiceUnavailableException('Email service is unavailable');
    }
  }

  private async sendWithResend(message: EmailMessage): Promise<void> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'surakshya-backend/1.0',
        },
        body: JSON.stringify({
          from: this.from,
          ...message,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const details = await response.text();
        this.logger.error(
          `Resend rejected email with status ${response.status}: ${details}`,
        );
        throw new ServiceUnavailableException(
          'Email provider rejected the request',
        );
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const reason =
        error instanceof Error ? error.message : 'Unknown Resend API error';
      this.logger.error(`Unable to reach Resend API: ${reason}`);

      throw new ServiceUnavailableException('Email service is unavailable');
    }
  }
}
