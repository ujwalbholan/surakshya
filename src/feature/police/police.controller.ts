import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string };
}

import { PoliceService } from './police.service';
import { InvitePoliceDto } from './dto/invite-police.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Police')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police')
export class PoliceController {
  constructor(private readonly policeService: PoliceService) {}

  @ApiOperation({ summary: 'Get police dashboard stats' })
  @Get('dashboard')
  getDashboard() {
    return this.policeService.getDashboard();
  }

  @ApiOperation({ summary: 'Get active SOS events' })
  @Get('sos-events')
  getActiveSosEvents() {
    return this.policeService.getActiveSosEvents();
  }

  @ApiOperation({ summary: 'Get SOS event details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('sos-events/:id')
  getSosEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getSosEventDetails(id);
  }

  @ApiOperation({ summary: 'Resolve an SOS event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { properties: { notes: { type: 'string' } } } })
  @Patch('sos-events/:id/resolve')
  resolveSosEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.policeService.resolveSosEvent(id, req.user.id, notes);
  }

  @ApiOperation({ summary: 'Get device latest location' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('devices/:id/location')
  getDeviceLatestLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getDeviceLatestLocation(id);
  }

  @ApiOperation({ summary: 'Get user info' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('users/:id')
  getUserInfo(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserInfo(id);
  }

  @ApiOperation({ summary: 'Get user guardians' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('users/:id/guardians')
  getUserGuardians(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserGuardians(id);
  }
}

@ApiBearerAuth()
@ApiTags('Admin - Police')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/police')
export class AdminPoliceController {
  constructor(private readonly policeService: PoliceService) {}

  @ApiOperation({ summary: 'Invite a police officer' })
  @Post('invite')
  invitePolice(@Body() dto: InvitePoliceDto) {
    return this.policeService.invitePolice(dto);
  }
}
