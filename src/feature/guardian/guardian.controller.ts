import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@Controller('guardians')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Post()
  addGuardian(@Req() req: Request, @Body() dto: CreateGuardianDto) {
    const user = req.user as { userId: string };
    return this.guardianService.addGuardian(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Get()
  getMyGuardians(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.guardianService.getMyGuardians(user.userId);
  }
}

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
