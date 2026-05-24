/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registe(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  //WIP i guess  we need to send token expectily in json fro mobile
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      user: result.user,
    };
  }

  @Post('forget-password')
  forgetPassword(@Body() dto: ForgotPasswordDto) {
    const sanitizedEmail = dto.email.trim().toLowerCase();

    return this.authService.forgetPassword(sanitizedEmail);
  }

  @Post('verify-reset-opt')
  verifyResetOtp(@Body() verifyOpt: VerifyResetOtpDto) {
    const sanitizedOtp = verifyOpt.otp.trim();
    const sanitizedEmail = verifyOpt.email.trim().toLowerCase();

    return this.authService.verifyResetOtp({
      email: sanitizedEmail,
      otp: sanitizedOtp,
    });
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const sanitizedEmail = resetPasswordDto.email.trim().toLowerCase();
    const newPassword = resetPasswordDto.newPassword.trim();
    const comparePassword = resetPasswordDto.comparePassword.trim();
    const resetToken = resetPasswordDto.resetToken?.trim();

    return this.authService.resetPassword({
      email: sanitizedEmail,
      newPassword,
      comparePassword,
      resetToken,
    });
  }

  @Post('refresh')
  refresh() {}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as {
      userId: string;
      sessionId: string;
      role: string;
    };

    const result = await this.authService.logout(user.userId, user.sessionId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return result.message;
  }
}
