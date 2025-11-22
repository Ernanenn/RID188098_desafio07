## API REST de Usuários com NestJS + MySQL

Projeto desenvolvido para o desafio de construir uma API RESTful segura para gestão de usuários, com autenticação baseada em JWT e integração com banco MySQL utilizando TypeORM.

**Arquitetura moderna** seguindo princípios de Clean Code, com separação de responsabilidades, serviços dedicados, testes unitários e tipagem forte.

---

## Pré-requisitos

- Node.js 18+
- MySQL 8+ acessível em `localhost:3306`
- Conta `root` com senha `root` ou variáveis customizadas (veja abaixo)

Crie previamente o banco:

```sql
CREATE DATABASE IF NOT EXISTS nest_users;
```

---

## Instalação

```bash
npm install
```

Se desejar usar variáveis diferentes das padrão, crie um arquivo `.env` na raiz baseado no `.env.example`:

```bash
cp .env.example .env
```

Ou crie manualmente com as seguintes variáveis:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=nest_users
DB_SYNCHRONIZE=true
JWT_SECRET=super-secret
JWT_EXPIRES_IN=3600s
PORT=3000
```

---

## Scripts disponíveis

- `npm run start` – sobe o servidor em modo padrão
- `npm run start:dev` – modo watch (recomendado durante o desenvolvimento)
- `npm run start:prod` – executa a aplicação em modo produção
- `npm run build` – gera artefatos em `dist`
- `npm run test` – executa testes unitários
- `npm run test:watch` – executa testes em modo watch
- `npm run test:cov` – executa testes com cobertura
- `npm run test:e2e` – executa testes end-to-end
- `npm run lint` – verifica e corrige problemas de lint
- `npm run format` – formata o código com Prettier

---

## Fluxo da aplicação

1. **Cadastro público de usuário** – `POST /users` (dados validados e senha com bcrypt).
2. **Login** – `POST /auth/login` (recebe `username` + `password`, retorna `access_token` JWT).
3. **Rotas protegidas** – Utilize o token como `Bearer <token>` para acessar:
   - `GET /users` – Lista todos os usuários
   - `GET /users/:id` – Busca usuário por ID
   - `PUT /users/:id` – Atualiza usuário
   - `DELETE /users/:id` – Remove usuário

**Autenticação:**
- Todas as rotas de usuários são protegidas por padrão com `JwtAuthGuard`
- A rota de criação (`POST /users`) é pública usando o decorator `@Public()`
- O guard verifica automaticamente o token JWT no header `Authorization: Bearer <token>`

---

## Testando com cURL

```bash
# criação
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","username":"ada","email":"ada@example.com","password":"123456"}'

# login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ada","password":"123456"}' | jq -r '.access_token')

# consulta autenticada
curl http://localhost:3000/users -H "Authorization: Bearer $TOKEN"
```

---

## Estrutura do projeto

```
src/
├── app.module.ts              # Módulo raiz com configurações globais
├── main.ts                    # Bootstrap da aplicação com ValidationPipe
│
├── common/                    # Módulo comum (global)
│   ├── common.module.ts      # Módulo global para serviços compartilhados
│   ├── constants.ts          # Constantes e mensagens centralizadas
│   ├── services/
│   │   └── password.service.ts  # Serviço dedicado para hash/comparação de senhas
│   └── types/
│       └── index.ts          # Interfaces e tipos compartilhados
│
├── users/                     # Módulo de usuários
│   ├── entities/
│   │   └── user.entity.ts    # Entidade User (TypeORM)
│   ├── dto/
│   │   ├── create-user.dto.ts # DTO para criação com validações
│   │   └── update-user.dto.ts # DTO para atualização (PartialType)
│   ├── users.controller.ts   # Controller com rotas CRUD
│   ├── users.service.ts       # Lógica de negócio e acesso ao banco
│   ├── users.module.ts        # Módulo de usuários
│   └── users.service.spec.ts  # Testes unitários do serviço
│
└── auth/                      # Módulo de autenticação
    ├── dto/
    │   └── login.dto.ts       # DTO para login
    ├── guards/
    │   └── jwt-auth.guard.ts  # Guard JWT com suporte a @Public()
    ├── decorators/
    │   └── public.decorator.ts # Decorator para rotas públicas
    ├── jwt.strategy.ts        # Estratégia Passport JWT
    ├── auth.controller.ts     # Controller de autenticação
    ├── auth.service.ts        # Serviço de autenticação
    ├── auth.module.ts         # Módulo de autenticação
    └── auth.service.spec.ts    # Testes unitários do serviço
```

## Arquitetura e padrões

### Separação de responsabilidades
- **PasswordService**: Lógica de hash/comparação de senhas isolada
- **CommonModule**: Serviços e utilitários compartilhados (módulo global)
- **Constants**: Mensagens de erro e validação centralizadas
- **Types**: Interfaces e tipos compartilhados

### Validações
- DTOs com validações robustas usando `class-validator`
- Mensagens de erro personalizadas e consistentes
- `ValidationPipe` global configurado no `main.ts`

### Segurança
- Senhas hasheadas com bcrypt (10 salt rounds)
- JWT com expiração configurável
- Guards para proteção de rotas
- Decorator `@Public()` para rotas públicas

### Testes
- **16 testes unitários** cobrindo serviços críticos:
  - `PasswordService` (3 testes)
  - `UsersService` (8 testes)
  - `AuthService` (5 testes)
- Testes E2E configurados

## Exemplos de uso

### Criar usuário
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace",
    "username": "ada",
    "email": "ada@example.com",
    "password": "123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ada",
    "password": "123456"
  }'
```

Resposta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acessar rotas protegidas
```bash
TOKEN="seu_token_aqui"

# Listar todos os usuários
curl http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"

# Buscar usuário por ID
curl http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"

# Atualizar usuário
curl -X PUT http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace Updated"
  }'

# Deletar usuário
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Validações

### Criar usuário
- `name`: obrigatório, string
- `username`: obrigatório, string, único
- `email`: obrigatório, formato de email válido, único
- `password`: obrigatório, mínimo 6 caracteres

### Login
- `username`: obrigatório, string
- `password`: obrigatório, string

### Atualizar usuário
- Todos os campos são opcionais
- Validações aplicadas apenas aos campos fornecidos
- Senha é automaticamente hasheada se fornecida
