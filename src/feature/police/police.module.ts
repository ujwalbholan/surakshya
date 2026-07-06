import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { Device } from 'src/feature/device/entities/device.entity';
import { LocationPing } from 'src/feature/device/entities/location-ping.entity';
import { SosEvent } from 'src/feature/device/entities/sos-event.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { PoliceController, AdminPoliceController } from './police.controller';
import { PoliceSetupController } from './police-setup.controller';
import { PoliceService } from './police.service';
import { RedisModule } from 'src/config/redis/redis.module';
import { NotificationModule } from 'src/feature/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Device,
      LocationPing,
      SosEvent,
      GuardianLink,
    ]),
    RedisModule,
    NotificationModule,
  ],
  controllers: [PoliceController, AdminPoliceController, PoliceSetupController],
  providers: [PoliceService],
})
export class PoliceModule {}
