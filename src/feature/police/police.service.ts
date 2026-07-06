import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomBytes, randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { safeUser } from 'src/utils/safe-user';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { RedisService } from 'src/config/redis/redis.service';
import { EmailService } from 'src/feature/notification/email.service';
import { SmsService } from 'src/feature/notification/sms/sms.service';
import { InvitePoliceDto } from './dto/invite-police.dto';

@Injectable()
export class PoliceService {
  private readonly logger = new Logger(PoliceService.name);

  constructor(
    @InjectRepository(SosEvent)
    private readonly sosRepo: Repository<SosEvent>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepo: Repository<GuardianLink>,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async getDashboard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeSosEvents,
      totalDevices,
      totalUsers,
      sosEventsToday,
      pingsToday,
      resolvedToday,
    ] = await Promise.all([
      this.sosRepo.count({ where: { status: 'active' } }),
      this.deviceRepo.count(),
      this.userRepo.count(),
      this.sosRepo.count({ where: { startedAt: MoreThan(todayStart) } }),
      this.pingRepo.count({ where: { recordedAt: MoreThan(todayStart) } }),
      this.sosRepo.find({
        where: { status: 'resolved', resolvedAt: MoreThan(todayStart) },
        relations: ['device'],
        order: { resolvedAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      activeSosEvents,
      totalDevices,
      totalUsers,
      sosEventsToday,
      pingsToday,
      resolvedToday: resolvedToday.map((e) => ({
        id: e.id,
        deviceImei: e.device.imei,
        startedAt: e.startedAt,
        resolvedAt: e.resolvedAt,
      })),
    };
  }

  async getActiveSosEvents() {
    const events = await this.sosRepo.find({
      where: { status: 'active' },
      relations: ['device'],
      order: { startedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      events.map(async (event) => {
        const latestPing = await this.pingRepo.findOne({
          where: { device: { id: event.device.id } },
          order: { recordedAt: 'DESC' },
        });

        return {
          id: event.id,
          deviceId: event.device.id,
          imei: event.device.imei,
          label: event.device.label,
          status: event.status,
          startedAt: event.startedAt,
          resolvedAt: event.resolvedAt,
          lastLocation: latestPing
            ? {
                latitude: latestPing.latitude,
                longitude: latestPing.longitude,
                recordedAt: latestPing.recordedAt,
              }
            : null,
        };
      }),
    );

    return { data: enriched, total: enriched.length };
  }

  async getSosEventDetails(id: string) {
    const event = await this.sosRepo.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!event) throw new NotFoundException('SOS event not found');

    const locationPings = await this.pingRepo.find({
      where: { sosEvent: { id } },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    return { ...event, locationPings };
  }

  async resolveSosEvent(id: string, userId?: string, notes?: string) {
    const event = await this.sosRepo.findOne({
      where: { id },
      relations: ['resolvedBy'],
    });
    if (!event) throw new NotFoundException('SOS event not found');

    event.status = 'resolved';
    event.resolvedAt = new Date();
    event.notes = notes || null;

    if (userId) {
      const user = await this.userRepo.findOneBy({ id: userId });
      if (user) event.resolvedBy = user;
    }

    return this.sosRepo.save(event);
  }

  async getDeviceLatestLocation(deviceId: string) {
    const device = await this.deviceRepo.findOneBy({ id: deviceId });
    if (!device) throw new NotFoundException('Device not found');

    const latestPing = await this.pingRepo.findOne({
      where: { device: { id: deviceId } },
      order: { recordedAt: 'DESC' },
    });

    if (!latestPing) {
      return {
        device: { id: device.id, imei: device.imei, label: device.label },
        lastLocation: null,
      };
    }

    return {
      device: { id: device.id, imei: device.imei, label: device.label },
      lastLocation: {
        id: latestPing.id,
        latitude: latestPing.latitude,
        longitude: latestPing.longitude,
        altitudeM: latestPing.altitudeM,
        speedKmph: latestPing.speedKmph,
        satellites: latestPing.satellites,
        recordedAt: latestPing.recordedAt,
      },
    };
  }

  async getUserInfo(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    return safeUser(user);
  }

  async getUserGuardians(userId: string) {
    const links = await this.guardianLinkRepo.find({
      where: { child_user_id: userId },
      relations: ['guardian'],
    });

    return {
      guardians: links.map((link) => ({
        id: link.guardian.id,
        full_name: link.guardian.full_name,
        email: link.guardian.email,
        phone: link.guardian.phone,
        roles: link.guardian.roles,
        created_at: link.created_at,
      })),
    };
  }

  async invitePolice(dto: InvitePoliceDto) {
    const phone = this.normalizePhone(dto.phone);
    const email = dto.email.trim().toLowerCase();

    const existing = await this.userRepo.findOne({
      where: [{ email }, { phone }],
    });
    if (existing) {
      throw new BadRequestException(
        'A user with this email or phone already exists',
      );
    }

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.userRepo.save(
      this.userRepo.create({
        full_name: dto.full_name.trim(),
        email,
        phone,
        password_hash: passwordHash,
        roles: ['POLICE'],
        station_id: dto.station_id,
        is_active: false,
        phone_verified: false,
      }),
    );

    const token = randomBytes(32).toString('hex');
    await this.redisService.set(
      `police:invitation:${token}`,
      email,
      24 * 60 * 60,
    );

    await this.sendInvitationEmail(
      email,
      dto.full_name.trim(),
      password,
      token,
    );

    return {
      message:
        'Police officer invited. An email with credentials and setup link has been sent.',
      user_id: user.id,
    };
  }

  async completeInvitation(token: string, password: string) {
    const email = await this.redisService.get(`police:invitation:${token}`);
    if (!email) {
      throw new BadRequestException('Invitation token expired or invalid');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found for this invitation');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    user.password_hash = passwordHash;
    await this.userRepo.save(user);

    await this.redisService.del(`police:invitation:${token}`);

    return {
      message:
        'Password set successfully. Please verify your phone via OTP to activate your account.',
    };
  }

  async sendPoliceOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.roles.includes('POLICE')) {
      throw new NotFoundException('No police officer found with this email');
    }

    const otp = randomInt(100000, 999999).toString();
    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(`police:otp:${email}`, hashOtp, 5 * 60);

    try {
      await this.smsService.send(
        user.phone,
        `Your Surakshya police account OTP is: ${otp}. It expires in 5 minutes.`,
      );
    } catch {
      this.logger.warn(
        `[OTP stub] Police OTP for ${email} (${user.phone}): ${otp}`,
      );
    }

    return { message: 'OTP sent to your registered phone number' };
  }

  async verifyPoliceOtp(email: string, otp: string) {
    const key = `police:otp:${email}`;
    const hashedOtp = await this.redisService.get(key);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    await this.redisService.del(key);

    await this.userRepo.update(
      { email },
      { phone_verified: true, is_active: true },
    );

    return {
      message: 'Phone verified and account activated. You can now log in.',
    };
  }

  private async sendInvitationEmail(
    email: string,
    name: string,
    password: string,
    token: string,
  ) {
    try {
      await this.emailService.send({
        to: email,
        subject: 'You have been registered as Police on Surakshya',
        text: `Hello ${name},\n\nYou have been registered as a police officer on Surakshya.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nSetup link: https://surakshya.app/police/setup?token=${token}\n\nPlease complete your setup and verify your phone via OTP.\n\nThank you,\nSurakshya Team`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Police Registration</h2>
            <p>Hello ${name},</p>
            <p>You have been registered as a <strong>police officer</strong> on <strong>Surakshya</strong>.</p>
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><a href="https://surakshya.app/police/setup?token=${token}">Complete your setup here</a></p>
            <p>Thank you,<br/>Surakshya Team</p>
          </div>
        `,
      });
    } catch {
      this.logger.error(
        `Failed to send invitation email to ${email} — credentials logged`,
      );
      this.logger.log(
        `[Email stub] Police invitation for ${email}: Password=${password}, Token=${token}`,
      );
    }
  }

  private generatePassword(): string {
    return randomBytes(8).toString('hex');
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    return trimmed.startsWith('+977') ? trimmed.slice(4) : trimmed;
  }
}
