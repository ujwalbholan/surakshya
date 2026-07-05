import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { SmsService } from './sms/sms.service';
import { EmailService } from './email.service';
import { NotificationFailure } from './entities/notification-failure.entity';

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
    @InjectRepository(NotificationFailure)
    private readonly failureRepo: Repository<NotificationFailure>,
  ) {}

  async sendSms(options: SendSmsOptions) {
    try {
      await this.smsService.send(options.to, options.message);
      return { message: 'SMS sent successfully' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      await this.failureRepo.save({
        type: 'sms',
        recipient: options.to,
        message: options.message,
        error: reason,
      });
      throw error;
    }
  }

  async sendEmail(options: SendEmailOptions) {
    try {
      await this.emailService.send({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return { message: 'Email sent successfully' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      await this.failureRepo.save({
        type: 'email',
        recipient: options.to,
        message: options.subject,
        error: reason,
      });
      throw error;
    }
  }

  async getFailures(options: {
    type?: 'sms' | 'email';
    page: number;
    limit: number;
  }) {
    const query = this.failureRepo.createQueryBuilder('f');

    if (options.type) {
      query.andWhere('f.type = :type', { type: options.type });
    }

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await query
      .skip(skip)
      .take(options.limit)
      .orderBy('f.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getFailuresCountSince(since: Date): Promise<number> {
    return this.failureRepo.count({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }
}
