import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliceStation } from './police-station.entity';
import { PoliceStationService } from './police-station.service';
import { PoliceStationController } from './police-station.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PoliceStation])],
  controllers: [PoliceStationController],
  providers: [PoliceStationService],
  exports: [PoliceStationService],
})
export class PoliceStationModule {}
