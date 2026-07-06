import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DeviceService } from './device.service';
import { User } from 'src/feature/user/entities/user.entity';

describe('DeviceService', () => {
  let service: DeviceService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        { provide: getRepositoryToken(Device), useValue: mockRepository },
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
