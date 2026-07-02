import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
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
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Guardian (Ward)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardian')
export class GuardianWardController {
  constructor(private readonly guardianService: GuardianService) {}

  @ApiOperation({ summary: 'Get my ward info (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('GUARDIAN')
  @Get('me')
  getMyWard(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.guardianService.getMyWard(user.userId, {
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }
}
