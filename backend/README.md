# Goods Transfer — Backend

Express.js REST API with Prisma ORM, JWT authentication, RBAC, and multi-tenant scoping.

## Architecture

```
backend/
├── prisma/              # Schema, migrations, seed
├── src/
│   ├── config/          # App configuration, env validation
│   ├── constants/       # Enums, status codes, messages
│   ├── lib/             # Prisma client, logger, mailer
│   ├── middlewares/      # Auth, RBAC, validation, error handling
│   ├── modules/         # Feature modules (auth, users, etc.)
│   │   └── auth/
│   │       ├── auth.controller.js
│   │       ├── auth.service.js
│   │       ├── auth.repository.js
│   │       ├── auth.routes.js
│   │       ├── auth.validation.js
│   │       └── auth.swagger.js
│   ├── routes/          # Route aggregation
│   ├── services/        # Shared services (email, file upload)
│   ├── socket/          # Socket.IO setup and handlers
│   ├── types/           # JSDoc type definitions
│   ├── utils/           # Helpers, response wrapper, pagination
│   └── app.js           # Express app setup
├── docs/                # Architecture documentation
├── tests/               # Test files
├── .env.example
└── package.json
```

## Module Pattern

Each module follows a consistent layered structure:

1. **Controller** — HTTP request handling, input extraction, response formatting
2. **Service** — Business logic, validation, orchestration
3. **Repository** — Database access via Prisma, tenant-scoped queries
4. **Routes** — Express router with middleware chain
5. **Validation** — Joi schemas for request validation
6. **Swagger** — OpenAPI documentation for the module

## Commands

```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run seed         # Run database seed
npm run lint         # Run ESLint
```

## Prisma Commands

```bash
npx prisma migrate dev       # Create and apply migration
npx prisma migrate deploy    # Apply pending migrations (production)
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # Open Prisma Studio GUI
npx prisma db seed           # Run seed script
```

## Demo logins

Run `npm run seed` first. **EN** — sample accounts. **AR** — نفس الحسابات للتجربة.

### Internal admins — `Admin@123`

| Account | Email |
|--------|--------|
| Super Admin | `admin@goodstransfer.com` |
| Operations | `ops@goodstransfer.com` |
| Support | `support@goodstransfer.com` |
| Finance | `finance@goodstransfer.com` |

### Company, provider & other test users — `Test@123`

| Role | Email |
|------|--------|
| Company admin | `company@test.com` |
| Employee | `employee@test.com` |
| Line manager | `manager@test.com` |
| Provider admin | `provider@test.com` |
| Provider operator | `operator@test.com` |
| Individual customer | `customer@test.com` |
| Delivery driver | `driver@test.com` |

### Troubleshooting

If **`@test.com`** logins return **Invalid credentials** but internal admins work, those users may have been created earlier with another password. Run **`npm run seed`** again — the seed **updates** demo passwords on every run.

## Environment Variables

See `.env.example` for all required variables.

## API Documentation

Swagger UI available at `http://localhost:3000/api-docs` when the server is running.

OpenAPI JSON (for mobile/SDK tooling) is available at `http://localhost:3000/api-docs.json`.

## Migrations

```bash
npx prisma migrate deploy   # production / CI
npx prisma migrate dev      # local: create new migration from schema changes
```

Initial schema is captured under `prisma/migrations/`. See `docs/TENANCY_AND_AUTH.md` for auth and tenant rules.