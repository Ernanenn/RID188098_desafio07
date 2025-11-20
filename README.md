## API REST de Usuários com NestJS + MySQL

Projeto desenvolvido para o desafio de construir uma API RESTful segura para gestão de usuários, com autenticação baseada em JWT e integração com banco MySQL utilizando TypeORM.

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

Se desejar usar variáveis diferentes das padrão, crie um arquivo `.env` na raiz com:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=nest_users
JWT_SECRET=super-secret
JWT_EXPIRES_IN=3600s
```

---

## Scripts disponíveis

- `npm run start` – sobe o servidor em modo padrão
- `npm run start:dev` – modo watch (recomendado durante o desenvolvimento)
- `npm run build` – gera artefatos em `dist`
- `npm run test` – executa testes unitários padrão do Nest

---

## Fluxo da aplicação

1. **Cadastro público de usuário** – `POST /users` (dados validados e senha com bcrypt).
2. **Login** – `POST /auth/login` (recebe `username` + `password`, retorna `access_token` JWT).
3. **Rotas protegidas** – Utilize o token como `Bearer <token>` para acessar:
   - `GET /users`
   - `GET /users/:id`
   - `PUT /users/:id`
   - `DELETE /users/:id`

Todas as rotas protegidas utilizam o guard `AuthGuard('jwt')` e a estratégia configurada em `JwtStrategy`.

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

## Estrutura principal

- `src/users` – entidade, DTOs, serviço e controller de usuários (CRUD + bcrypt)
- `src/auth` – módulo de autenticação com JWT, guard e controller de login
- `src/app.module.ts` – conexão MySQL via TypeORM com `autoLoadEntities` e `synchronize`
- `src/main.ts` – `ValidationPipe` global para garantir entrada consistente

---

## Próximos passos sugeridos

- Adicionar migrations ao invés de `synchronize: true` em produção
- Implementar refresh tokens e roles
- Criar testes e2e para o fluxo completo de autenticação e CRUD
