import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
import { Device } from './entities/device.entity';
import { User } from 'src/feature/user/entities/user.entity';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepository.find();
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOneBy({ id });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    Object.assign(device, updateDeviceDto);
    return this.deviceRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.deviceRepository.delete({ id });
  }

  async claim(claimDto: ClaimDeviceDto, userId: string) {
    const device = await this.deviceRepository.findOne({
      where: { imei: claimDto.imei },
    });
    if (!device) {
      throw new NotFoundException('Device not found with this IMEI');
    }

    if (device.user?.id && device.user.id !== userId) {
      throw new BadRequestException(
        'Device is already claimed by another user',
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    device.user = user;
    const saved = await this.deviceRepository.save(device);

    return {
      message: 'Device claimed successfully',
      device: {
        id: saved.id,
        imei: saved.imei,
        label: saved.label,
      },
    };
  }

  async findMyDevices(userId: string) {
    const devices = await this.deviceRepository.find({
      where: { user: { id: userId } },
      order: { lastSeenAt: 'DESC' },
    });

    return {
      devices: devices.map((d) => ({
        id: d.id,
        imei: d.imei,
        label: d.label,
        isOnline: d.isOnline,
        lastSeenAt: d.lastSeenAt,
      })),
    };
  }
}
