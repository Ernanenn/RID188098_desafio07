import { IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants';

export class LoginDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.USERNAME_REQUIRED })
  @IsString()
  username: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
  @IsString()
  password: string;
}
