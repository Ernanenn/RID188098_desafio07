import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  username: string;
  sub: number;
}

export interface LoginResponse {
  access_token: string;
}

export type SafeUser = Omit<User, 'password'>;
