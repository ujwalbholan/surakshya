import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianWardController } from './guardian-ward.controller';
import { RolesGuard } from 'src/utils/guard/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, GuardianLink])],
  controllers: [GuardianController, GuardianWardController],
  providers: [GuardianService, RolesGuard],
  exports: [GuardianService],
})
export class GuardianModule {}
