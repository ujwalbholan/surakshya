import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string };
}

import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Device')
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiOperation({ summary: 'Create a new device (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @ApiOperation({ summary: 'List all devices (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @ApiOperation({ summary: 'Get device by ID (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceService.findOne(id);
  }

  @ApiOperation({ summary: 'Update device by ID (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @ApiOperation({ summary: 'Delete device by ID (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceService.remove(id);
  }

  @ApiOperation({ summary: 'Claim a device by IMEI (any authenticated user)' })
  @UseGuards(JwtAuthGuard)
  @Post('claim')
  claim(@Body() dto: ClaimDeviceDto, @Req() req: RequestWithUser) {
    return this.deviceService.claim(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Get my claimed devices' })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  myDevices(@Req() req: RequestWithUser) {
    return this.deviceService.findMyDevices(req.user.id);
  }
}
