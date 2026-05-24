/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/config/redis/redis.service';
import { EmailService } from 'src/feature/notification/email.service';
import { UserService } from 'src/feature/user/user.service';
import { TokenService } from 'src/utils/token/token.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: jest.Mocked<TokenService>;
  let userService: jest.Mocked<UserService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TokenService,
          useValue: {
            revokedRefreshToken: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            findOneByEmail: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtpEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService);
    userService = module.get(UserService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should revoke the current refresh token on logout', async () => {
    tokenService.revokedRefreshToken.mockResolvedValue(1);

    const result = await service.logout('user-id', 'session-id');

    expect(tokenService.revokedRefreshToken).toHaveBeenCalledWith(
      'user-id',
      'session-id',
    );
    expect(result).toEqual({
      message: 'Logout successful',
    });
  });

  it('should reset password with the plain new password once reset token is valid', async () => {
    const dto = {
      email: 'ujwalbholan@gmail.com',
      newPassword: 'test@12345',
      comparePassword: 'test@12345',
      resetToken: 'reset-token',
    };

    redisService.get.mockResolvedValue(dto.email);
    userService.findOneByEmail.mockResolvedValue({ id: 'user-id' } as never);
    userService.updatePassword.mockResolvedValue(undefined);
    redisService.del.mockResolvedValue(1);

    const result = await service.resetPassword(dto);

    expect(redisService.get).toHaveBeenCalledWith('password:reset:reset-token');
    expect(userService.updatePassword).toHaveBeenCalledWith(
      dto.email,
      dto.newPassword,
    );
    expect(redisService.del).toHaveBeenCalledWith(
      'password:reset:reset-token',
    );
    expect(result).toEqual({
      message: 'Password reset successfully',
    });
  });
});
