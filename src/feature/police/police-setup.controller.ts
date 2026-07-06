import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PoliceService } from './police.service';
import {
  PoliceSetupPasswordDto,
  PoliceSendOtpDto,
  PoliceVerifyOtpDto,
} from './dto/police-setup.dto';

@ApiTags('Police Setup')
@Controller('police/setup')
export class PoliceSetupController {
  constructor(private readonly policeService: PoliceService) {}

  @ApiOperation({ summary: 'Set password from invitation token' })
  @Post('password')
  setPassword(@Body() dto: PoliceSetupPasswordDto) {
    return this.policeService.completeInvitation(dto.token, dto.password);
  }

  @ApiOperation({ summary: 'Send OTP to police phone' })
  @Post('send-otp')
  sendOtp(@Body() dto: PoliceSendOtpDto) {
    return this.policeService.sendPoliceOtp(dto.email.trim().toLowerCase());
  }

  @ApiOperation({ summary: 'Verify OTP and activate police account' })
  @Post('verify-otp')
  verifyOtp(@Body() dto: PoliceVerifyOtpDto) {
    return this.policeService.verifyPoliceOtp(
      dto.email.trim().toLowerCase(),
      dto.otp.trim(),
    );
  }
}
