import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RegisterDto,
  LoginDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserService } from 'src/feature/user/user.service';
import { TokenService } from 'src/utils/token/token.service';
import { randomInt, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RedisService } from 'src/config/redis/redis.service';
import { EmailService } from '../notification/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { id, full_name, email, phone, role } =
      await this.userService.register(registerDto);

    return {
      message: 'User Registered successfully',
      user_id: id,
      full_name: full_name,
      email: email,
      phone: phone,
      role: role,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.login(loginDto);

    return user;
  }

  refresh() {}

  async forgetPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Email doesn't exist");
    }

    const otp = randomInt(100000, 999999).toString();

    const hashOtp = await bcrypt.hash(otp, 12);

    await this.redisService.set(`password:otp:${email}`, hashOtp, 2 * 60);

    await this.emailService.sendOtpEmail(email, otp);

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

  async logout(userId: string, sessionId: string) {
    await this.tokenService.revokedRefreshToken(userId, sessionId);

    return {
      message: 'Logout successful',
    };
  }
}
