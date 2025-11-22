import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PasswordService } from '../common/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ERROR_MESSAGES } from '../common/constants';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let passwordService: PasswordService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockPasswordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um usuário com sucesso', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        ...createUserDto,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordService.hash).toHaveBeenCalledWith(createUserDto.password);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.save).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
      expect(result.id).toBe(1);
    });

    it('deve lançar erro se username já existe', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockImplementation(
        (options: { where: { username?: string; email?: string } }) => {
          if (options.where.username === 'testuser') {
            return Promise.resolve({ id: 1, username: 'testuser' });
          }
          return Promise.resolve(null);
        },
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        ERROR_MESSAGES.USERNAME_ALREADY_EXISTS,
      );
    });

    it('deve lançar erro se email já existe', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockImplementation(
        (options: { where: { username?: string; email?: string } }) => {
          if (options.where.email === 'test@example.com') {
            return Promise.resolve({ id: 1, email: 'test@example.com' });
          }
          return Promise.resolve(null);
        },
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário por id', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.id).toBe(1);
      expect(result.password).toBeUndefined();
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        ERROR_MESSAGES.USER_NOT_FOUND(999),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const existingUser = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldHashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = { ...existingUser, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
      expect(result.password).toBeUndefined();
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover um usuário com sucesso', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.remove.mockResolvedValue(user);

      const result = await service.remove(1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.remove).toHaveBeenCalledWith(user);
      expect(result.password).toBeUndefined();
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
