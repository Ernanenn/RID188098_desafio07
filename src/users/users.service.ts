import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PasswordService } from '../common/services/password.service';
import { ERROR_MESSAGES } from '../common/constants';
import { SafeUser } from '../common/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    await this.ensureUniqueFields(createUserDto.username, createUserDto.email);

    const hashedPassword = await this.passwordService.hash(
      createUserDto.password,
    );
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(user);
    return this.sanitize(savedUser);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
    }
    return this.sanitize(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
    }

    if (updateUserDto.username || updateUserDto.email) {
      const usernameToCheck = updateUserDto.username ?? user.username;
      const emailToCheck = updateUserDto.email ?? user.email;
      await this.ensureUniqueFields(usernameToCheck, emailToCheck, id);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.passwordService.hash(
        updateUserDto.password,
      );
    }

    const updatedUser = await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });
    return this.sanitize(updatedUser);
  }

  async remove(id: number): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
    }
    await this.usersRepository.remove(user);
    return this.sanitize(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  private sanitize(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user;
    return rest;
  }

  private async ensureUniqueFields(
    username: string,
    email: string,
    ignoreId?: number,
  ): Promise<void> {
    const [existingUsername, existingEmail] = await Promise.all([
      this.usersRepository.findOne({
        where: { username },
      }),
      this.usersRepository.findOne({
        where: { email },
      }),
    ]);

    if (existingUsername && existingUsername.id !== ignoreId) {
      throw new BadRequestException(ERROR_MESSAGES.USERNAME_ALREADY_EXISTS);
    }

    if (existingEmail && existingEmail.id !== ignoreId) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }
  }
}
