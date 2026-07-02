import { Test, TestingModule } from '@nestjs/testing';
import { PoliceController } from './police.controller';
import { PoliceService } from './police.service';

describe('PoliceController', () => {
  let controller: PoliceController;
  let service: jest.Mocked<PoliceService>;

  const mockPoliceService = {
    getDashboard: jest.fn(),
    getActiveSosEvents: jest.fn(),
    getSosEventDetails: jest.fn(),
    resolveSosEvent: jest.fn(),
    getDeviceLatestLocation: jest.fn(),
    getUserInfo: jest.fn(),
    getUserGuardians: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoliceController],
      providers: [{ provide: PoliceService, useValue: mockPoliceService }],
    }).compile();

    controller = module.get<PoliceController>(PoliceController);
    service = module.get(PoliceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dashboard', async () => {
    const expected = {
      activeSosEvents: 5,
      totalDevices: 100,
      totalUsers: 500,
    };
    service.getDashboard.mockResolvedValue(expected);

    const result = await controller.getDashboard();

    expect(result).toEqual(expected);
  });

  it('should get active SOS events', async () => {
    const expected = { data: [{ id: 'sos-1' }], total: 1 };
    service.getActiveSosEvents.mockResolvedValue(expected);

    const result = await controller.getActiveSosEvents();

    expect(result).toEqual(expected);
  });

  it('should get SOS event details', async () => {
    const expected = { id: 'sos-1', locationPings: [] };
    service.getSosEventDetails.mockResolvedValue(expected);

    const result = await controller.getSosEventDetails('sos-1');

    expect(result).toEqual(expected);
  });

  it('should resolve SOS event', async () => {
    const expected = { id: 'sos-1', status: 'resolved' };
    service.resolveSosEvent.mockResolvedValue(expected);

    const result = await controller.resolveSosEvent('sos-1');

    expect(result).toEqual(expected);
  });

  it('should get device latest location', async () => {
    const expected = { device: { id: 'dev-1' }, lastLocation: null };
    service.getDeviceLatestLocation.mockResolvedValue(expected);

    const result = await controller.getDeviceLatestLocation('dev-1');

    expect(result).toEqual(expected);
  });

  it('should get user info', async () => {
    const expected = { id: 'user-1', full_name: 'Test' };
    service.getUserInfo.mockResolvedValue(expected);

    const result = await controller.getUserInfo('user-1');

    expect(result).toEqual(expected);
  });

  it('should get user guardians', async () => {
    const expected = { guardians: [{ id: 'g-1' }] };
    service.getUserGuardians.mockResolvedValue(expected);

    const result = await controller.getUserGuardians('user-1');

    expect(result).toEqual(expected);
  });
});
