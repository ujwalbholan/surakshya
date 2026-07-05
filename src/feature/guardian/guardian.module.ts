import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianRequest } from './entities/guardian-request.entity';
import { GuardianService } from './guardian.service';
import { GuardianController } from './guardian.controller';
import { GuardianWardController } from './guardian-ward.controller';
import { GuardianSetupController } from './guardian-setup.controller';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { SmsService } from '../notification/sms/sms.service';
import { RedisService } from 'src/config/redis/redis.service';
import { EmailService } from '../notification/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, GuardianLink, GuardianRequest])],
  controllers: [
    GuardianController,
    GuardianWardController,
    GuardianSetupController,
  ],
  providers: [
    GuardianService,
    RolesGuard,
    SmsService,
    RedisService,
    EmailService,
  ],
  exports: [GuardianService],
})
export class GuardianModule {}
