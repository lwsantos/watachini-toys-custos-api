# Backend - Sistema de Controle de Custos para Impressão 3D

API RESTful desenvolvida em Node.js com TypeScript, Express e TypeORM para gerenciamento de custos de impressão 3D.

## Tecnologias

- Node.js 18+
- TypeScript 5.6
- Express 4.21
- TypeORM 0.3
- PostgreSQL
- Jest (testes)

## Estrutura do Projeto

```
backend/
├── src/
│   ├── domain/           # Entidades e interfaces de domínio
│   ├── application/      # Use cases e DTOs
│   ├── infrastructure/   # Repositórios TypeORM e configurações
│   └── presentation/     # Controllers e middlewares
├── package.json
└── tsconfig.json
```

## Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

## Executando Localmente

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=printing_cost_control

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Criar o banco de dados

```bash
# Conecte ao PostgreSQL e crie o banco
psql -U postgres
CREATE DATABASE printing_cost_control;
\q
```

### 4. Executar migrations

```bash
npm run migration:run
```

### 5. Iniciar o servidor

```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Ou modo produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`.

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia servidor em produção |
| `npm test` | Executa testes |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:coverage` | Executa testes com cobertura |
| `npm run migration:run` | Executa migrations pendentes |
| `npm run migration:revert` | Reverte última migration |

## Endpoints da API

### Filamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/filaments/purchases` | Registrar compra de filamento |
| GET | `/api/filaments` | Listar filamentos (com filtros) |
| GET | `/api/filaments/available` | Listar filamentos disponíveis |
| PATCH | `/api/filaments/:id/status` | Atualizar status do filamento |

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/products` | Criar produto |
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/:id` | Obter produto com custos |
| PUT | `/api/products/:id` | Atualizar produto |
| DELETE | `/api/products/:id` | Excluir produto |
| POST | `/api/products/:id/calculate` | Calcular preço com margem |

### Configuração

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/configuration` | Obter configuração de custos |
| PUT | `/api/configuration` | Atualizar configuração |

## Testes

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage
```

## Licença

ISC
