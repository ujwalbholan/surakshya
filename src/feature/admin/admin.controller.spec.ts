/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  const mockAdminService = {
    getStats: jest.fn(),
    getUsers: jest.fn(),
    getUserDetails: jest.fn(),
    updateUserStatus: jest.fn(),
    updateUserRole: jest.fn(),
    getDevices: jest.fn(),
    getSosEvents: jest.fn(),
    getSosEventDetails: jest.fn(),
    resolveSosEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get stats', async () => {
    const expected = { totalUsers: 100 };
    service.getStats.mockResolvedValue(expected);

    const result = await controller.getStats();

    expect(result).toEqual(expected);
  });

  it('should get paginated users', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    service.getUsers.mockResolvedValue(expected);

    const result = await controller.getUsers(
      undefined,
      undefined,
      undefined,
      1,
      20,
    );

    expect(result).toEqual(expected);
    expect(service.getUsers).toHaveBeenCalledWith({
      role: undefined,
      is_active: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('should get user details', async () => {
    const expected = { id: 'user-1', guardianLinks: [] };
    service.getUserDetails.mockResolvedValue(expected);

    const result = await controller.getUserDetails('user-1');

    expect(result).toEqual(expected);
  });

  it('should update user status', async () => {
    const dto = { is_active: false };
    const expected = { id: 'user-1', is_active: false };
    service.updateUserStatus.mockResolvedValue(expected);

    const result = await controller.updateUserStatus('user-1', dto);

    expect(result).toEqual(expected);
  });

  it('should update user role', async () => {
    const dto = { role: 'ADMIN' as any };
    const expected = { id: 'user-1', role: 'ADMIN' };
    service.updateUserRole.mockResolvedValue(expected);

    const result = await controller.updateUserRole('user-1', dto);

    expect(result).toEqual(expected);
  });

  it('should get devices', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    service.getDevices.mockResolvedValue(expected);

    const result = await controller.getDevices(1, 20);

    expect(result).toEqual(expected);
  });

  it('should get SOS events', async () => {
    const expected = { data: [], total: 0 };
    service.getSosEvents.mockResolvedValue(expected);

    const result = await controller.getSosEvents(undefined, 1, 20);

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
});
