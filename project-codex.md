# PROJECT CODEX
### Madar Backend Standards
**Express + Prisma + TypeScript Architecture Reference**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Folder Structure](#2-folder-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Layer Responsibilities](#4-layer-responsibilities)
5. [Shared Utilities](#5-shared-utilities)
6. [Configs](#6-configs)
7. [Database](#7-database)
8. [API Documentation](#8-api-documentation)
9. [Coding Standards](#9-coding-standards)

---

## 1. Overview

This document is the canonical architecture and implementation standard for the Madar backend. All contributors and AI agents should follow these rules when adding or changing controllers, routes, services, repositories, middleware, and shared utilities.

The controller standard in this document is based on the implementation patterns already established in `backend/src/controllers/auth.controller.ts`. Those patterns are the default for all future controllers in this project.

| Property | Value |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Module system | ESM with `.js` import specifiers in TS source |
| Validation | Route-level `validate` middleware using Zod schemas or DTO classes |
| Error model | `AppError` + global `errorHandler` |
| Success responses | `success()` / `created()` / `paginated()` helpers |
| API base path | `/api/v1` |

---

## 2. Folder Structure

All backend application code lives in `backend/src/`.

```text
backend/
  src/
    app.ts                         # Express app wiring only
    server.ts                      # Starts HTTP server and scheduler

    configs/                       # Typed config modules
      env.ts
      cors.ts
      jwt.ts
      logger.ts
      swagger.ts

    controllers/                   # Thin HTTP handlers
      auth.controller.ts

    db/                            # Prisma client, schema, seed
      client.ts
      schema.prisma
      seed.ts

    dtos/                          # Request schemas / DTOs used by validate middleware
      auth/
        auth.dto.ts

    middlewares/                   # Reusable Express middleware
      asyncHandler.ts
      auth.middleware.ts
      validate.middleware.ts

    repositories/                  # Prisma data access only
      auth.repository.ts

    routes/                        # Route declarations + middleware composition
      auth.routes.ts

    services/                      # Business logic
      auth.service.ts

    types/                         # Shared TS types and Express augmentation
      express.d.ts

    utils/                         # Shared helpers
      app-error.ts
      error-handler.ts
      logger.ts
      pagination.ts
      register-middlewares.ts
      register-routes.ts
      response.ts
      scheduler.ts
      upload.ts
      user-helpers.ts
```

Every new concern should follow the same shape: route, controller, service, repository, request schema/DTOs, and Swagger docs where applicable.

---

## 3. Naming Conventions

### 3.1 Files and folders

Use lowercase file and folder names. Multi-word names use kebab-case.

| Layer | Pattern | Example |
|---|---|---|
| Route | `<concern>.routes.ts` | `auth.routes.ts` |
| Controller | `<concern>.controller.ts` | `auth.controller.ts` |
| Service | `<concern>.service.ts` | `auth.service.ts` |
| Repository | `<concern>.repository.ts` | `auth.repository.ts` |
| DTO / schema | `<concern>.dto.ts` | `auth.dto.ts` |
| Middleware | `<concern>.middleware.ts` | `auth.middleware.ts` |
| Utility | kebab-case | `app-error.ts` |

### 3.2 TypeScript identifiers

| Identifier | Convention | Example |
|---|---|---|
| Classes | PascalCase | `AppError` |
| Interfaces / Types | PascalCase | `Request`, `JwtPayload` |
| Functions / methods | camelCase | `registerRoutes()` |
| Variables / params | camelCase | `userId`, `refreshToken` |
| Constants | UPPER_SNAKE_CASE when true constants | `MAX_FILE_SIZE` |

Additional conventions:

- Default imports should be named after the concern, for example `authService` or `authController`.
- Router instances must be named `{feature}Router`, for example `authRouter`.
- In TS source, local ESM imports should use `.js` specifiers to match the project pattern.
- Route schema namespace imports must be named `{feature}Schemas`, for example `authSchemas`.
- Route schema members must be named `{action}Schema`, for example `loginSchema` or `forgotPasswordSchema`.

---

## 4. Layer Responsibilities

Each layer has one primary responsibility. Do not skip layers.

- Routes call controllers.
- Controllers call services.
- Services call repositories.
- Repositories call Prisma.

### 4.1 app.ts and server.ts

`app.ts` wires the Express application. `server.ts` starts the server and boot-time processes.

`app.ts` should stay thin:

- register global middleware
- register routes
- register the global error handler

`server.ts` should own:

- `app.listen(...)`
- startup logging
- scheduler startup

### 4.2 Routes

Routes are responsible for middleware composition. This includes:

- request validation
- authentication
- authorization
- upload middleware
- controller selection

The pattern established by `backend/src/routes/auth.routes.ts` is the standard. Future route files should match this structure and style exactly:

```typescript
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authSchemas from '../dtos/auth/auth.dto.js';

const authRouter = Router();

authRouter.post('/register', validate(authSchemas.registerSchema), authController.register);
authRouter.post('/login', validate(authSchemas.loginSchema), authController.login);
authRouter.post('/refresh', validate(authSchemas.refreshSchema), authController.refresh);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.post('/forgot-password', validate(authSchemas.forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(authSchemas.resetPasswordSchema), authController.resetPassword);

export default authRouter;
```

Route rules:

- Put `validate(...)` in the route layer, not inside controllers.
- Prefer Zod schemas for new request payloads.
- DTO classes are acceptable when `validate.middleware.ts` needs them.
- Put `authenticate`, `authorize`, `authorizePlatformPermission`, and `authorizeCompanyPermission` in the route layer before the controller.
- Controllers should receive already-validated `req.body`, `req.params`, and `req.query` whenever possible.
- Controllers may still perform simple fail-fast presence checks with `AppError` when the handler owns that precondition.

#### 4.2.1 Route file structure

Every route file should follow this exact high-level order:

1. `import { Router } from 'express';`
2. controller default import
3. `validate` default import
4. named middleware imports such as `authenticate`
5. schema namespace import with `* as`
6. `const {feature}Router = Router();`
7. one route definition per line
8. one `export default {feature}Router;` at the bottom

Do not add extra exports from route files.

#### 4.2.2 Import order and import style

Use the exact route import style from `auth.routes.ts`:

- Import `Router` as a named import from `express`.
- Import the controller as a default import named `{feature}Controller`.
- Import `validate` as the default import from `validate.middleware.js`.
- Import auth and authorization middleware as named imports from their middleware file.
- Import schemas with a namespace import: `import * as {feature}Schemas from '../dtos/{feature}/{feature}.dto.js';`
- Keep local import specifiers on `.js`, not `.ts`.

For a standard route file, the import block should look like this shape:

```typescript
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authSchemas from '../dtos/auth/auth.dto.js';
```

#### 4.2.3 Router instantiation and export

Route files must instantiate and export routers like this:

- instantiate with `const {feature}Router = Router();`
- use that same identifier for every route registration
- export exactly one default export at the bottom: `export default {feature}Router;`

Do not use generic names like `router` in newly generated route files.

#### 4.2.4 Route definition style

Each route definition must stay on a single line and follow this exact composition style:

`{feature}Router.{method}('{path}', middleware1, middleware2, controller.methodName);`

Formatting rules:

- one route per line
- method call first, then path, then middleware chain, then controller handler
- no trailing comments on route lines
- use `authController.methodName` style, not destructured controller methods
- keep the controller as the final argument

Examples:

```typescript
authRouter.post('/register', validate(authSchemas.registerSchema), authController.register);
authRouter.post('/logout', authenticate, authController.logout);
```

#### 4.2.5 Middleware chaining order

Middleware order in route files must mirror `auth.routes.ts`:

- `validate(...)` always appears before the controller.
- `authenticate` always appears before the controller.
- when a route is validated but not protected, use `validate(...)` followed by the controller.
- when a route is protected in the auth-route style, use `authenticate` followed by the controller and do not add `validate(...)`.
- if multiple middleware functions are needed, keep them in request-processing order and still place the controller last.

#### 4.2.6 Schema naming and controller binding

Route files must bind schemas and controllers like this:

- import schemas as `{feature}Schemas`
- reference schemas as `{feature}Schemas.{action}Schema`
- reference handlers as `{feature}Controller.{methodName}`

Examples:

- `authSchemas.registerSchema`
- `authSchemas.forgotPasswordSchema`
- `authController.resetPassword`

### 4.3 Controllers

Controllers follow the pattern established in `backend/src/controllers/auth.controller.ts`. This is the default controller standard for the project.

Controller responsibilities:

- read request input from `req.body` or authenticated context from `req.user`
- perform lightweight presence validation immediately after extraction
- call the service with extracted values
- return a standardized success response
- throw operational errors with `AppError`

Controller non-responsibilities:

- no business logic
- no Prisma queries
- no hand-written error JSON
- no `res.json()` or `res.send()` directly
- no inline validation frameworks
- no `try/catch`
- no `next` parameter in handler signatures
- no named exports for individual handlers

Standard controller file pattern:

```typescript
import type { Response } from 'express';

import authService from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import AppError from '../utils/app-error.js';
import { success } from '../utils/response.js';

import type { Request } from '../types/express.js';

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw AppError.badRequest('Email and password are required');
  }

  const result = await authService.login(email, password);
  return success(res, result);
});

const authController = {
  login,
});

export default authController;
```

#### 4.3.1 Imports

Controller imports must follow this exact order and grouping:

1. framework types first as type-only imports
2. service as a default import
3. middlewares as named imports
4. utils imports
5. custom project types as a final type-only import

Each import group must be separated by a blank line.

Rules:

- Import `Response` from `express` as a type-only import first.
- Import the concern service as a default import, for example `authService`.
- Import middleware helpers such as `asyncHandler` before utils.
- Import `AppError` and `success` from `utils/`.
- Import the custom `Request` type last as `import type { Request } from '../types/express.js';`
- Never import `Request` from `express` directly in controllers.

Exact shape:

```typescript
import type { Response } from 'express';

import authService from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import AppError from '../utils/app-error.js';
import { success } from '../utils/response.js';

import type { Request } from '../types/express.js';
```

#### 4.3.2 Function declaration style

Every controller handler must use this exact declaration pattern:

`const name = asyncHandler(async (req: Request, res: Response) => { ... });`

Rules:

- always use `const`
- always wrap the handler with `asyncHandler(...)`
- always type `req` as `Request` from `../types/express.js`
- always type `res` as `Response` from `express`
- never use the `function` keyword
- never use `export` on individual handlers
- never include `next` in the signature

#### 4.3.3 Input extraction

Input validation should happen before the controller through `validate.middleware.ts`.

Inside the controller, input extraction must happen at the top of the handler before any logic.

Rules:

- for request-body handlers, destructure from `req.body` first
- use `const { a, b } = req.body`, not `req.body.a` inline
- for authenticated handlers, extract from `req.user`
- perform extraction before validation or service calls
- do not mix extraction into service-call arguments

Examples:

```typescript
const { email, password } = req.body;
const { token, password } = req.body;
const userId = req.user?.id;
```

#### 4.3.4 Validation

Immediately after extraction, validate required values with one `if` block and throw an `AppError`.

Rules:

- use a single `if` block after extraction
- throw `AppError.badRequest('message')` for missing request data
- throw `AppError.unauthorized()` or another appropriate `AppError` for missing authenticated context
- never use `else` blocks
- never push validation into the service-call arguments

Examples:

```typescript
if (!email || !password) {
  throw AppError.badRequest('Email and password are required');
}

if (!userId) {
  throw AppError.unauthorized();
}
```

#### 4.3.5 Service calls

Service calls must happen after extraction and validation.

Rules:

- always `await` the service call
- assign to `result` only when the returned value is used in the response
- if the return value is not used, just `await` without assignment
- pass individual extracted variables to the service
- never pass `req.body` directly unless all fields are intentionally forwarded as a whole input object

Patterns:

```typescript
const result = await authService.login(email, password);
await authService.logout(userId);
const result = await authService.register(req.body);
```

#### 4.3.6 Response style

Controllers must always respond with `success(...)` from `utils/response.js`.

Rules:

- use `success(res, data)` for standard successful responses
- use `success(res, result, null, 201)` for creation responses
- for operations with no return data, return a fixed message object such as `success(res, { message: '...' })`
- never use `res.json()` or `res.send()` directly in controllers
- never return raw service output when the response message should remain fixed and safe regardless of service internals

Examples:

```typescript
return success(res, result);
return success(res, result, null, 201);
return success(res, { message: 'Logged out successfully' });
```

#### 4.3.7 Controller object and exports

At the bottom of the file, collect handlers into a single plain object and export it as the only export in the file.

Rules:

- create `const {feature}Controller = { ... };`
- include all handlers in that object
- keep object formatting consistent
- use `export default {feature}Controller;`
- never use named exports for individual handlers

Pattern:

```typescript
const authController = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};

export default authController;
```

#### 4.3.8 Error handling standard

All async controller handlers should be wrapped with `asyncHandler(...)`.

Rules:

- never write `try/catch` in controllers
- throw errors with `AppError` static methods such as `AppError.badRequest(...)`, `AppError.unauthorized(...)`, `AppError.forbidden(...)`, `AppError.notFound(...)`, or `AppError.conflict(...)`
- let `asyncHandler` forward thrown errors to the global error middleware
- never call `next(err)` manually from controllers

#### 4.3.9 Middleware usage standard

Controllers should assume middleware has already done its job.

Rules:

- read `req.user` only on routes protected by `authenticate`
- request body/query/params validation belongs in `validate.middleware.ts`
- controllers may still enforce lightweight presence checks after extraction
- keep controller logic thin even when middleware has already validated the request

### 4.4 Services

Services contain business logic and orchestration.

Service rules:

- never import Express request or response objects
- apply business rules and workflow logic here
- coordinate one or more repositories
- throw `AppError` for business-domain failures
- return plain data for controllers to serialize

Example:

```typescript
import AppError from '../utils/app-error.js';
import authRepository from '../repositories/auth.repository.js';

const login = async (email: string, password: string) => {
  const user = await authRepository.getUserByEmail(email);

  if (!user) {
    throw AppError.unauthorized('Invalid credentials');
  }

  return { user };
};
```

### 4.5 Repositories

Repositories are the only layer that should call Prisma directly.

Repository rules:

- no business rules
- no permission checks
- no Express imports
- no response shaping for HTTP
- keep query construction here
- return data to services

Common repository responsibilities:

- `findUnique`, `findFirst`, `findMany`
- `create`, `update`, `delete`
- `count`, `aggregate`, `upsert`
- `where`, `select`, `include`, `orderBy`, pagination options
- transaction-aware variants where needed

---

## 5. Shared Utilities

### 5.1 register-middlewares.ts

Registers global app middleware in the correct order.

Current responsibilities include:

- `helmet`
- `cors`
- rate limiting
- JSON and URL-encoded parsers
- static uploads serving
- request logging

### 5.2 register-routes.ts

Mounts the API and docs routes.

Current responsibilities include:

- Swagger docs at `/api-docs`
- API routes mounted under `/api/v1`
- final `404` JSON response for unmatched routes

### 5.3 asyncHandler.ts

The standard async wrapper for controllers.

```typescript
import type { RequestHandler, Response, NextFunction } from 'express';
import type { Request } from '../types/express.js';

export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

Use this for all async controller handlers unless there is a strong reason not to.

### 5.4 validate.middleware.ts

The standard request validation middleware.

It can validate:

- Zod schemas with `safeParse`
- DTO classes through `class-transformer` and `class-validator`

Behavior:

- validates `body`, `params`, or `query`
- throws `AppError.badRequest(...)` on invalid input
- replaces the request source with sanitized data before the controller runs

### 5.5 auth.middleware.ts

Authentication and authorization belong here.

Current middleware responsibilities include:

- extracting the bearer token
- verifying JWTs
- loading the authenticated user
- attaching `req.user`
- enforcing role-based access
- enforcing platform/company permission checks

Controllers should not duplicate these concerns.

### 5.6 response.ts

Defines the project-wide response envelope helpers.

Primary helpers:

- `success(response, data, meta?, statusCode?)`
- `created(response, data)`
- `paginated(response, data, page, limit, total)`
- `error(response, statusCode, code, message, details?)`

The success envelope standard is:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

The error envelope standard is:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request data",
    "details": []
  }
}
```

### 5.7 app-error.ts

`AppError` is the standard operational error type for this project.

Use its static helpers:

- `AppError.badRequest(...)`
- `AppError.unauthorized(...)`
- `AppError.forbidden(...)`
- `AppError.notFound(...)`
- `AppError.conflict(...)`
- `AppError.internal(...)`

### 5.8 error-handler.ts

The global error handler must be registered last in `app.ts`.

Behavior:

- if the error is an `AppError`, return its `statusCode`, `code`, `message`, and `details`
- otherwise log the error and return a standard `INTERNAL_ERROR` payload
- controllers should rely on this instead of formatting error JSON themselves

### 5.9 logger.ts

Exports the shared logger instance used across the app.

---

## 6. Configs

Each file in `backend/src/configs/` owns one infrastructure concern.

### 6.1 env.ts

All environment access must go through `configs/env.ts`. Direct `process.env` access elsewhere is not allowed.

Current config groups include:

- `env.port`
- `env.nodeEnv`
- `env.databaseUrl`
- `env.jwt`
- `env.upload`
- `env.business`
- `env.cors`
- `env.rateLimit`

### 6.2 Other config modules

- `cors.ts` defines CORS options
- `jwt.ts` defines JWT config derived from env
- `logger.ts` defines logger config
- `swagger.ts` loads and exposes the Swagger spec

---

## 7. Database

Everything database-related belongs in `backend/src/db/`.

### 7.1 Prisma client

Instantiate Prisma once in `db/client.ts`. Do not create new `PrismaClient` instances elsewhere.

### 7.2 schema.prisma

The Prisma schema defines all models and relations. Schema changes must be accompanied by the appropriate Prisma workflow.

### 7.3 seed.ts

Development and bootstrap data belong in `db/seed.ts`.

---

## 8. API Documentation

Swagger/OpenAPI definitions should stay aligned with routes, request schemas, and response envelopes.

Documentation rules:

- document request validation shape from the route layer
- document standardized success envelopes
- document standardized error envelopes
- keep auth requirements in the docs for protected endpoints

---

## 9. Coding Standards

### 9.1 General rules

- Use ESM imports and exports everywhere.
- Use `.js` specifiers for local imports in TS source files.
- Never access `process.env` directly outside `configs/env.ts`.
- Never instantiate `PrismaClient` outside `db/client.ts`.
- Never import Express `Request` or `Response` into services or repositories.
- Never skip layers.
- All async controller handlers should use `asyncHandler(...)`.
- Validation belongs in route middleware, not in controllers.
- Authentication and authorization belong in middleware, not in controllers.
- Successful controller responses should use the shared response helpers.
- Operational errors should use `AppError`.
- Error payload formatting belongs to `error-handler.ts`.

### 9.2 Import order

Use this import order where practical:

1. Node built-in modules
2. Third-party packages
3. Internal value imports
4. Type-only imports

Controller files are the explicit exception: follow the dedicated controller import structure in section `4.3.1 Imports`, which mirrors `auth.controller.ts`.

Example:

```typescript
import path from 'node:path';

import express from 'express';

import { logger } from '../utils/logger.js';

import type { Response } from 'express';
```

### 9.3 Adding a new concern

When adding a new concern such as `users`, create the relevant files and wire them into the standard flow:

- `routes/users.routes.ts`
- `controllers/users.controller.ts`
- `services/users.service.ts`
- `repositories/users.repository.ts`
- `dtos/users/users.dto.ts`
- Swagger docs if the concern is externally exposed

Then:

1. mount the route in `utils/register-routes.ts`
2. add request validation schemas or DTOs
3. use middleware for auth, authorization, and uploads
4. keep the controller aligned with the auth-controller standard in this document

---

## Controller Checklist

Before merging a new controller, verify all of the following:

- the route applies `validate(...)` for request data where needed
- the route applies `authenticate` / authorization middleware where needed
- the controller handler is wrapped in `asyncHandler(...)`
- the controller only performs thin orchestration
- the controller throws `AppError` for controller-owned precondition failures
- the controller returns `success(...)`, `created(...)`, or `paginated(...)`
- business rules live in the service
- Prisma access lives in the repository

If a new controller differs from these rules, document the reason in code review.
