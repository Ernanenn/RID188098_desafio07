import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../common/services/password.service';
import { LoginDto } from './dto/login.dto';
import { ERROR_MESSAGES } from '../common/constants';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let passwordService: PasswordService;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockPasswordService = {
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('deve validar usuário com credenciais corretas', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordService.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual(user);
    });

    it('deve lançar UnauthorizedException se usuário não existe', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('nonexistent', 'password123'),
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('deve lançar UnauthorizedException se senha está incorreta', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso e retornar access_token', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const accessToken = 'mockAccessToken';

      mockUsersService.findByUsername.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: accessToken });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 1,
      });
    });
  });
});
