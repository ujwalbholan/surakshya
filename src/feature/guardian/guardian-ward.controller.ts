import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { GuardianService } from './guardian.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@Controller('guardian')
export class GuardianWardController {
  constructor(private readonly guardianService: GuardianService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GUARDIAN')
  @Get('me')
  getMyWard(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.guardianService.getMyWard(user.userId);
  }
}
