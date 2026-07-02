import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Guardians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardians')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @ApiOperation({ summary: 'Add a guardian for current user' })
  @Roles('USER')
  @Post()
  addGuardian(@Req() req: Request, @Body() dto: CreateGuardianDto) {
    const user = req.user as { userId: string };
    return this.guardianService.addGuardian(user.userId, dto);
  }

  @ApiOperation({ summary: 'Get my guardians (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('USER')
  @Get()
  getMyGuardians(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.guardianService.getMyGuardians(user.userId, {
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }
}
