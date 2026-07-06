import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliceStation } from './police-station.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class PoliceStationService {
  constructor(
    @InjectRepository(PoliceStation)
    private readonly stationRepo: Repository<PoliceStation>,
  ) {}

  async create(dto: CreateStationDto) {
    const station = this.stationRepo.create(dto);
    return this.stationRepo.save(station);
  }

  async findAll() {
    return this.stationRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const station = await this.stationRepo.findOneBy({ id });
    if (!station) throw new NotFoundException('Police station not found');
    return station;
  }

  async update(id: string, dto: UpdateStationDto) {
    const station = await this.findOne(id);
    Object.assign(station, dto);
    return this.stationRepo.save(station);
  }
}
