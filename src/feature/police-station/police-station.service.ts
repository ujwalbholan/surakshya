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

  async findNearest(lat: number, lng: number): Promise<PoliceStation | null> {
    const stations = await this.stationRepo.find({
      where: { is_active: true },
    });

    if (stations.length === 0) return null;

    let nearest = stations[0];
    let minDist = Infinity;

    for (const s of stations) {
      if (s.latitude == null || s.longitude == null) continue;
      const d = this.haversine(lat, lng, s.latitude, s.longitude);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }

    return nearest;
  }

  private haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
