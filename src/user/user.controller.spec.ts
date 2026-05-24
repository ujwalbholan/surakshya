/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteResult } from 'typeorm';
import { Role } from 'src/auth/dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-id',
    full_name: 'Ujwal',
    email: 'ujwal@gmail.com',
    phone: '9800000000',
    password_hash: 'hashed-password',
    role: Role.USER,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create user', async () => {
    const dto: CreateUserDto = {
      full_name: 'Ujwal',
      email: 'ujwal@gmail.com',
      phone: '9800000000',
      password: 'password',
      role: Role.USER,
    };
    const resultData = makeUser();

    service.create.mockResolvedValue(resultData);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(resultData);
  });

  it('should return all users', async () => {
    const users = [
      makeUser(),
      makeUser({ id: 'second-user-id', email: 'ram@gmail.com' }),
    ];

    service.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

  it('should return one user by id', async () => {
    const user = makeUser();

    service.findOne.mockResolvedValue(user);

    const result = await controller.findOne('user-id');

    expect(service.findOne).toHaveBeenCalledWith('user-id');
    expect(result).toEqual(user);
  });

  it('should update user by id', async () => {
    const dto = {
      full_name: 'Updated Name',
      email: 'updated@gmail.com',
    };
    const updatedUser = makeUser(dto);

    service.update.mockResolvedValue(updatedUser);

    const result = await controller.update('user-id', dto);

    expect(service.update).toHaveBeenCalledWith('user-id', dto);
    expect(result).toEqual(updatedUser);
  });

  it('should delete user by id', async () => {
    const deleteResult = {
      affected: 1,
    } as DeleteResult;

    service.remove.mockResolvedValue(deleteResult);

    const result = await controller.remove('user-id');

    expect(service.remove).toHaveBeenCalledWith('user-id');
    expect(result).toEqual(deleteResult);
  });
});
