# Implementation Plan

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Architecture Strategy

This platform follows a **layered monorepo** architecture:

```
/backend   — Node.js + Express + Prisma + MySQL
/frontend  — React + Vite unified dashboard
```

Backend layers (per module):
1. **Controller** — HTTP handling, request parsing, response formatting
2. **Service** — Business logic, orchestration, validation
3. **Repository / Data Access** — Prisma queries, tenant-scoped data access
4. **Middleware** — Auth, RBAC, tenant resolution, validation, rate limiting

Cross-cutting concerns:
- Centralized error handling
- Structured logging
- Response envelope standardization
- Swagger auto-documentation
- Socket.IO event layer
- File upload abstraction
- Job/queue readiness

---

## Delivery Rules

1. Each phase must be fully functional before moving to the next.
2. No placeholder CRUD — every file must contain real, working logic.
3. Prisma schema changes go through migrations; never edit production DB directly.
4. All endpoints must be Swagger-documented before merging.
5. RBAC permissions must be seeded before testing any protected route.
6. Tenant scoping must be enforced at the repository layer, not the controller.
7. All status transitions must follow the ORDER_STATUS_MATRIX.
8. Every API response follows the standard envelope: `{ success, data, message, meta }`.
9. Tests are written alongside module implementation, not deferred.
10. Frontend modules are built after their backend APIs are stable.

---

## Phased Execution Plan

### Phase 1 — Foundation (Current Phase)

**Goal:** Build the correct architecture so that all future modules can be implemented cleanly.

| Deliverable | Description |
|---|---|
| Monorepo structure | `/backend` and `/frontend` with proper configs |
| Documentation | All 7 doc files + 3 READMEs |
| Prisma schema | Full production-grade schema with all entities |
| Auth foundation | Login, refresh, logout, current user, middleware |
| RBAC foundation | Roles, permissions, middleware, tenant scoping |
| Swagger foundation | OpenAPI setup with auth, schemas, tags |
| Seed foundation | All roles, permissions, admin users, master data |
| Frontend shell | Vite + React + routing + theme + layout skeleton |

### Phase 2 — Core Modules

**Goal:** Implement the primary business modules that power the platform.

| Module | Backend | Frontend |
|---|---|---|
| User Management | CRUD, profile, role assignment | Admin user list, edit, role UI |
| Company Management | Company CRUD, branches, users, billing | Company dashboard pages |
| Provider Management | Provider CRUD, documents, areas, workers | Provider dashboard pages |
| Master Data | Categories, vehicle types, cities, zones | Admin config pages |
| Order Creation | Order CRUD, validation, attachments | Order form (individual + company) |
| Approval Flow | Rules engine, approval chain, history | Approval UI for line managers |
| Offer Flow | Offer CRUD, accept/reject, expiry | Offer management for providers |
| Assignment | Auto/manual assignment, driver allocation | Assignment board |
| Notifications | Push/email/in-app notification engine | Notification center |

### Phase 3 — Operations & Finance

**Goal:** Implement tracking, finance, support, and analytics.

| Module | Backend | Frontend |
|---|---|---|
| Real-time Tracking | Socket.IO tracking, GPS events | Live tracking map |
| Delivery Proof | Photo upload, signature, confirmation | Driver delivery flow |
| Invoicing | Invoice generation, items, PDF export | Invoice management |
| Payments | Payment processing, wallet, settlements | Payment pages |
| Commissions | Commission calculation, provider splits | Finance dashboard |
| Support Tickets | Ticket CRUD, comments, SLA tracking | Support center |
| Analytics | Aggregation queries, dashboard data | Charts, KPIs, reports |
| Audit Logs | System-wide activity logging | Audit log viewer |

### Phase 4 — Mobile API & Polish

**Goal:** Mobile-optimized endpoints, push notifications, performance tuning.

| Module | Description |
|---|---|
| Mobile Auth | OTP login, device management |
| Mobile Order Flow | Optimized endpoints for mobile apps |
| Driver App API | Assignment, navigation, proof, status updates |
| Push Notifications | FCM/APNs integration |
| Performance | Query optimization, caching, CDN |
| Security Hardening | Penetration testing fixes, rate limiting tuning |
| Deployment | CI/CD, Docker, staging/production environments |

---

## Module Sequencing (Phase 2 Order)

1. Master Data (no dependencies)
2. User Management (depends on auth)
3. Company Management (depends on users)
4. Provider Management (depends on users)
5. Order Creation (depends on companies, providers, master data)
6. Approval Flow (depends on orders, companies)
7. Offer Flow (depends on orders, providers)
8. Assignment (depends on offers, providers)
9. Notifications (integrates with all above)

---

## Success Criteria for Phase 1

- [x] `npm run dev` starts backend with working auth endpoints
- [x] `npm run dev` starts frontend with working dashboard shell
- [x] Prisma schema compiles; initial migration SQL under `prisma/migrations/` (apply with `npx prisma migrate deploy`)
- [x] Swagger UI accessible at `/api-docs`
- [x] Seed script creates all roles, permissions, and test users
- [x] Auth flow works: login → get token → access protected route
- [x] RBAC middleware (`authorizeRoles`, `authorizePermissions`) ready for route chains
- [x] Tenant foundation: JWT claims + `resolveTenantScope` + `TENANCY_AND_AUTH.md` + `tenantQuery` helpers

**Reference:** [TENANCY_AND_AUTH.md](./TENANCY_AND_AUTH.md)
