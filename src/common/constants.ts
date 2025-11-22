export const PASSWORD_SALT_ROUNDS = 10;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: (id: number) => `Usuário ${id} não encontrado`,
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  USERNAME_ALREADY_EXISTS: 'Username já está em uso',
  EMAIL_ALREADY_EXISTS: 'Email já está em uso',
} as const;

export const VALIDATION_MESSAGES = {
  USERNAME_REQUIRED: 'Username é obrigatório',
  PASSWORD_REQUIRED: 'Senha é obrigatória',
  PASSWORD_MIN_LENGTH: 'Senha deve ter no mínimo 6 caracteres',
  EMAIL_REQUIRED: 'Email é obrigatório',
  EMAIL_INVALID: 'Email deve ser um endereço válido',
  NAME_REQUIRED: 'Nome é obrigatório',
} as const;
