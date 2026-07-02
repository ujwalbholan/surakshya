import {
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { PoliceService } from './police.service';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police')
export class PoliceController {
  constructor(private readonly policeService: PoliceService) {}

  @Get('sos-events')
  getActiveSosEvents() {
    return this.policeService.getActiveSosEvents();
  }

  @Get('sos-events/:id')
  getSosEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getSosEventDetails(id);
  }

  @Patch('sos-events/:id/resolve')
  resolveSosEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.resolveSosEvent(id);
  }

  @Get('devices/:id/location')
  getDeviceLatestLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getDeviceLatestLocation(id);
  }

  @Get('users/:id')
  getUserInfo(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserInfo(id);
  }

  @Get('users/:id/guardians')
  getUserGuardians(@Param('id', ParseUUIDPipe) id: string) {
    return this.policeService.getUserGuardians(id);
  }
}
