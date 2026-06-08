import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly from: string;
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    if (
      !process.env.MAIL_HOST ||
      !process.env.MAIL_PORT ||
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASSWORD ||
      !process.env.MAIL_FROM
    ) {
      throw new InternalServerErrorException('Mail env is not configured');
    }

    this.from = process.env.MAIL_FROM;
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      ...message,
      from: this.from,
    });
  }
}
