/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('MAIL_HOST:', process.env.MAIL_HOST);

    if (
      !process.env.MAIL_HOST ||
      !process.env.MAIL_PORT ||
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASSWORD ||
      !process.env.MAIL_FROM
    ) {
      throw new InternalServerErrorException('Mail env is not configured');
    }

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

  async sendOtpEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Password Reset OTP',

      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>

          <p>Your OTP code is:</p>

          <h1 style="letter-spacing: 5px;">
            ${otp}
          </h1>

          <p>This OTP will expire in 2 minutes.</p>

          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });
  }
}
