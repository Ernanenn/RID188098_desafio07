import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    await this.ensureUniqueFields(createUserDto.username, createUserDto.email);

    const password = await this.hashPassword(createUserDto.password);
    const user = this.usersRepository.create({ ...createUserDto, password });
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
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }
    return this.sanitize(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    await this.ensureUniqueFields(
      updateUserDto.username ?? user.username,
      updateUserDto.email ?? user.email,
      id,
    );

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
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
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }
    await this.usersRepository.remove(user);
    return this.sanitize(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  private sanitize(user: User): SafeUser {
    const { password: _password, ...rest } = user;
    return rest;
  }

  private async hashPassword(rawPassword: string): Promise<string> {
    return bcrypt.hash(rawPassword, this.saltRounds);
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
      throw new BadRequestException('Username já está em uso');
    }

    if (existingEmail && existingEmail.id !== ignoreId) {
      throw new BadRequestException('Email já está em uso');
    }
  }
}

