import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PoliceStationService } from './police-station.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Police Stations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/police-stations')
export class PoliceStationController {
  constructor(private readonly stationService: PoliceStationService) {}

  @ApiOperation({ summary: 'Create a police station' })
  @Post()
  create(@Body() dto: CreateStationDto) {
    return this.stationService.create(dto);
  }

  @ApiOperation({ summary: 'List all police stations' })
  @Get()
  findAll() {
    return this.stationService.findAll();
  }

  @ApiOperation({ summary: 'Get police station by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationService.findOne(id);
  }

  @ApiOperation({ summary: 'Update police station' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStationDto,
  ) {
    return this.stationService.update(id, dto);
  }
}
