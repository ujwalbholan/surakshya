/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { GuardianService } from './guardian.service';
import { Role } from 'src/feature/auth/dto/auth.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('GuardianService', () => {
  let service: GuardianService;
  let userRepo: jest.Mocked<Repository<User>>;
  let linkRepo: jest.Mocked<Repository<GuardianLink>>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const mockUser = (overrides: Partial<User> = {}): User => ({
    id: userId,
    full_name: 'Test User',
    email: 'user@test.com',
    phone: '9800000000',
    password_hash: 'hashed',
    role: Role.USER,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  const mockGuardianLink = (
    overrides: Partial<GuardianLink> = {},
  ): GuardianLink => ({
    id: 'link-id',
    child_user_id: userId,
    guardian_user_id: 'guardian-id',
    child: mockUser(),
    guardian: mockUser({
      id: 'guardian-id',
      full_name: 'Guardian',
      role: Role.GUARDIAN,
    }),
    created_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardianService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuardianLink),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GuardianService>(GuardianService);
    userRepo = module.get(getRepositoryToken(User));
    linkRepo = module.get(getRepositoryToken(GuardianLink));
  });

  describe('addGuardian', () => {
    const dto = {
      full_name: 'New Guardian',
      email: 'guardian@test.com',
      phone: '9800000001',
      password: 'password123',
    };

    it('should throw if child user is not found or not USER role', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );

      userRepo.findOneBy.mockResolvedValue(mockUser({ role: Role.ADMIN }));
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if email or phone already exists', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser());
      userRepo.findOne.mockResolvedValue(mockUser({ email: dto.email }));
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );

      userRepo.findOne.mockResolvedValue(mockUser({ phone: dto.phone }));
      await expect(service.addGuardian(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create guardian and link successfully', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser());
      userRepo.findOne.mockResolvedValue(null);
      const guardianUser = mockUser({
        id: 'guardian-id',
        full_name: dto.full_name,
        role: Role.GUARDIAN,
      });
      userRepo.create.mockReturnValue(guardianUser);
      userRepo.save.mockResolvedValue(guardianUser);
      linkRepo.create.mockReturnValue(mockGuardianLink());
      linkRepo.save.mockResolvedValue(mockGuardianLink());

      const result = await service.addGuardian(userId, dto);

      expect(result.message).toBe('Guardian added successfully');
      expect(userRepo.save).toHaveBeenCalled();
      expect(linkRepo.save).toHaveBeenCalled();
    });
  });

  describe('getMyGuardians', () => {
    it('should return guardians for a user', async () => {
      const link = mockGuardianLink();
      linkRepo.find.mockResolvedValue([link]);

      const result = await service.getMyGuardians(userId);

      expect(result.guardians).toHaveLength(1);
      expect(result.guardians[0].full_name).toBe('Guardian');
    });
  });

  describe('getMyWard', () => {
    it('should throw if no wards found', async () => {
      linkRepo.find.mockResolvedValue([]);
      await expect(service.getMyWard('guardian-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return wards for a guardian', async () => {
      const link = mockGuardianLink();
      linkRepo.find.mockResolvedValue([link]);

      const result = await service.getMyWard('guardian-id');

      expect(result.wards).toHaveLength(1);
      expect(result.wards[0].full_name).toBe('Test User');
    });
  });
});
