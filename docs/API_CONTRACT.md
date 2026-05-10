# API Contract

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Base URL

```
/api/v1
```

All endpoints are versioned under `/api/v1/`.

---

## Request context (auth + tenancy)

Protected routes use middleware that attaches:

- `req.user` — identity, roles, permissions, and tenant ids from JWT (`companyId`, `providerId`, `branchId`)
- `req.tenantScope` — when `resolveTenantScope` is applied: `global` | `company` | `provider` | `self` | `assignment`

Full rules, JWT claim list, and repository conventions: **[TENANCY_AND_AUTH.md](./TENANCY_AND_AUTH.md)**.

---

## Authentication Flow

### Login
```
POST /api/v1/auth/login
Body: { identifier, password }
Response: { accessToken, refreshToken, user }
```

### Refresh Token
```
POST /api/v1/auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }
```

### Logout
```
POST /api/v1/auth/logout
Headers: Authorization: Bearer <token>
Body: { refreshToken }
```

### Current User
```
GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
Response: { user, roles, permissions, tenantContext }
```

---

## Response Format Convention

All API responses follow a standard envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2026-04-11T00:00:00.000Z"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Records retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false,
    "timestamp": "2026-04-11T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ],
  "meta": {
    "timestamp": "2026-04-11T00:00:00.000Z",
    "errorCode": "VALIDATION_ERROR"
  }
}
```

---

## Pagination & Filtering Standards

### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `createdAt` | Sort field |
| `order` | string | `desc` | Sort direction: `asc` or `desc` |
| `search` | string | — | Full-text search term |
| `status` | string | — | Filter by status |
| `from` | date | — | Filter from date (ISO 8601) |
| `to` | date | — | Filter to date (ISO 8601) |

### Sorting
- Default sort: `createdAt:desc`
- Multiple sort: `sort=createdAt:desc,name:asc`

### Filtering
- Exact match: `?status=active`
- Multiple values: `?status=active,pending`
- Date range: `?from=2026-01-01&to=2026-12-31`

---

## Route Naming Conventions

| Convention | Example |
|---|---|
| Plural nouns for resources | `/api/v1/orders` |
| Nested resources for relationships | `/api/v1/companies/:companyId/branches` |
| Verb for actions | `/api/v1/orders/:id/cancel` |
| Lowercase kebab-case | `/api/v1/service-categories` |
| ID parameter naming | `:id` for primary, `:companyId` for parent |

---

## Role Scope Summary

| Role | Scope | Access Pattern |
|---|---|---|
| `super_admin` | Global | All data, all tenants |
| `operations_admin` | Global | Orders, assignments, providers |
| `support_admin` | Global | Tickets, orders (read), users (read) |
| `finance_admin` | Global | Invoices, payments, settlements |
| `company_admin` | Company-scoped | Own company data only |
| `employee` | Company-scoped | Own orders, own profile |
| `line_manager` | Company-scoped | Branch orders, approvals |
| `provider_admin` | Provider-scoped | Own provider org data |
| `provider_operator` | Provider-scoped | Assigned tasks within provider |
| `individual_customer` | Self-scoped | Own orders, own profile |
| `delivery_driver` | Assignment-scoped | Assigned deliveries only |

---

## Endpoint Categories (Phase 2)

### Auth Module
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with credentials |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate refresh token |
| GET | `/auth/me` | Get current user with roles |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-otp` | Verify OTP code |

### User Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users (admin) |
| GET | `/users/:id` | Get user details |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Soft delete user |
| PUT | `/users/:id/roles` | Assign roles |

### Company Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/companies` | List companies |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Get company |
| PUT | `/companies/:id` | Update company |
| GET | `/companies/:id/branches` | List branches |
| POST | `/companies/:id/branches` | Create branch |
| GET | `/companies/:id/users` | List company users |
| POST | `/companies/:id/users` | Add user to company |

### Provider Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/providers` | List providers |
| POST | `/providers` | Create provider |
| GET | `/providers/:id` | Get provider |
| PUT | `/providers/:id` | Update provider |
| GET | `/providers/:id/workers` | List workers |
| GET | `/providers/:id/vehicles` | List vehicles |
| GET | `/providers/:id/documents` | List documents |

### Master Data
| Method | Endpoint | Description |
|---|---|---|
| GET | `/service-categories` | List categories |
| GET | `/service-types` | List service types |
| GET | `/vehicle-types` | List vehicle types |
| GET | `/cities` | List cities |
| GET | `/areas` | List areas by city |
| GET | `/zones` | List zones |

### Order Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | List orders (scoped) |
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Get order details |
| PUT | `/orders/:id` | Update order |
| POST | `/orders/:id/submit` | Submit for processing |
| POST | `/orders/:id/cancel` | Cancel order |
| GET | `/orders/:id/history` | Get status history |
| GET | `/orders/:id/attachments` | List attachments |

### Approval Flow
| Method | Endpoint | Description |
|---|---|---|
| GET | `/approvals/pending` | List pending approvals |
| POST | `/approvals/:id/approve` | Approve request |
| POST | `/approvals/:id/reject` | Reject request |

### Offer Flow
| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders/:id/offers` | List offers for order |
| POST | `/orders/:id/offers` | Submit offer |
| POST | `/offers/:id/accept` | Accept offer |
| POST | `/offers/:id/reject` | Reject offer |
| POST | `/offers/:id/withdraw` | Withdraw offer |

### Assignment
| Method | Endpoint | Description |
|---|---|---|
| POST | `/assignments` | Create assignment |
| GET | `/assignments/:id` | Get assignment |
| POST | `/assignments/:id/accept` | Driver accepts |
| POST | `/assignments/:id/reject` | Driver rejects |

### Tracking
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tracking/events` | Report tracking event |
| GET | `/orders/:id/tracking` | Get tracking events |

### Finance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice |
| POST | `/payments` | Record payment |
| GET | `/settlements` | List settlements |

### Support
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tickets` | List tickets |
| POST | `/tickets` | Create ticket |
| GET | `/tickets/:id` | Get ticket |
| POST | `/tickets/:id/comments` | Add comment |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List user notifications |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

---

## HTTP Status Codes

| Code | Usage |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No content (delete) |
| 400 | Bad request / validation error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permission) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Internal server error |
