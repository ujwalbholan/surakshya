import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { SmsService } from './sms/sms.service';
import { EmailService } from './email.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: SmsService,
          useValue: { send: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { send: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send SMS', async () => {
    const result = await service.sendSms({
      to: '+9779800000000',
      message: 'Hello',
    });
    expect(result.message).toBe('SMS sent successfully');
  });

  it('should send email', async () => {
    const result = await service.sendEmail({
      to: 'test@test.com',
      subject: 'Test',
      text: 'Test',
      html: '<p>Test</p>',
    });
    expect(result.message).toBe('Email sent successfully');
  });
});
