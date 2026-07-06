import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RegisterDto,
  LoginDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
  BootstrapAdminDto,
} from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { UserService } from 'src/feature/user/user.service';
import { TokenService } from 'src/utils/token/token.service';
import { randomInt, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { RedisService } from 'src/config/redis/redis.service';
import { OtpEmailService } from '../notification/email/otp.email';
import { WelcomeEmailService } from '../notification/email/welcome.email';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly otpEmailService: OtpEmailService,
    private readonly welcomeEmailService: WelcomeEmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userService.register(registerDto);

    try {
      await this.welcomeEmailService.sendWelcomeEmail(
        user.email,
        user.full_name,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Welcome email failed for registered user ${user.id}: ${message}`,
      );
    }

    return {
      message: 'User Registered successfully',
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.login(loginDto);
    return user;
  }

  refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Email doesn't exist");
    }

    const otp = randomInt(100000, 999999).toString();

    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(`password:otp:${email}`, hashOtp, 2 * 60);

    await this.otpEmailService.sendPasswordResetOtp(email, otp);

    return {
      message: 'Otp sent successfully',
    };
  }

  async verifyResetOtp(opt: VerifyResetOtpDto) {
    const key = `password:otp:${opt.email}`;

    const hashedOtp = await this.redisService.get(key);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(opt.otp, hashedOtp);

    if (!isValid) {
      throw new BadRequestException('OTP expired or invalid');
    }

    await this.redisService.del(key);

    const resetToken = randomUUID();

    await this.redisService.set(
      `password:reset:${resetToken}`,
      opt.email,
      5 * 60,
    );

    return {
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.comparePassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const key = `password:reset:${dto.resetToken}`;

    const email = await this.redisService.get(key);

    if (!email) {
      throw new BadRequestException('Reset token expired or invalid');
    }

    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid reset request');
    }

    await this.userService.updatePassword(email, dto.newPassword);

    await this.redisService.del(key);

    return {
      message: 'Password reset successfully',
    };
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const expectedKey = process.env.BOOTSTRAP_KEY;
    if (!expectedKey || dto.key !== expectedKey) {
      throw new ForbiddenException('Invalid bootstrap key');
    }

    const existingSuperAdmin = await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: 'SUPER_ADMIN' })
      .getOne();
    if (existingSuperAdmin) {
      throw new BadRequestException('A SUPER_ADMIN already exists');
    }

    const phone = dto.phone.trim().replace(/^\+977/, '');
    const email = dto.email.trim().toLowerCase();

    const duplicate = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });
    if (duplicate) {
      throw new BadRequestException('Email or phone already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      full_name: dto.full_name.trim(),
      email,
      phone,
      password_hash: passwordHash,
      roles: ['SUPER_ADMIN'],
      is_active: true,
      phone_verified: false,
    });

    const saved = await this.userRepository.save(user);

    return {
      message: 'Super admin created successfully',
      user_id: saved.id,
      email: saved.email,
      roles: saved.roles,
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.tokenService.revokedRefreshToken(userId, sessionId);
  }
}
