import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(
    @Query('role') role?: string,
    @Query('is_active') is_active?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getUsers({
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @Get('users/:id')
  getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto);
  }

  @Get('devices')
  getDevices(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getDevices(page ?? 1, limit ?? 20);
  }

  @Get('sos-events')
  getSosEvents(
    @Query('status') status?: 'active' | 'resolved',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getSosEvents({
      status,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @Get('sos-events/:id')
  getSosEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getSosEventDetails(id);
  }

  @Patch('sos-events/:id/resolve')
  resolveSosEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resolveSosEvent(id);
  }
}
