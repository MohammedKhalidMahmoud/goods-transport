# Database Schema Notes

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Domain Modeling Decisions

### Multi-Tenancy Strategy: Shared Database, Scoped Queries

We use a **single database** with **tenant-scoped queries** rather than schema-per-tenant or database-per-tenant.

**Reasoning:**
- Simpler infrastructure (one MySQL instance)
- Cross-tenant reporting is easy for admins
- Scoping enforced at repository layer with `companyId` / `providerId` filters
- Adequate for the expected scale (thousands of companies, not millions)

### User Model: Unified with Role-Based Context

A single `users` table holds all user types. Identity is universal; authorization is role-based.

- A user may hold multiple roles (e.g., a company_admin who is also a driver).
- Tenant context (companyId, providerId) is stored in junction tables (`company_users`, `provider_users`).
- The JWT token carries the user's active role and tenant context.

### Identity graph (Phase 1 relations)

- `users` ↔ `individual_customers` (1:1 via `user_id`) for B2C profiles.
- `users` ↔ `orders` as **requester** (`orders.requester_id` → `users.id`) for ownership and self-service scoping.
- Company and provider membership remain on `company_users` and `provider_users`; drivers may also link via `provider_drivers.user_id`.

---

## Key Entities

### Core Access Layer

| Entity | Purpose |
|---|---|
| `users` | Universal identity: email, phone, password hash, status |
| `profiles` | Extended user info: name, avatar, bio, language preference |
| `roles` | Role definitions with scope type (global, company, provider, self) |
| `permissions` | Granular permission definitions (module:action pattern) |
| `role_permissions` | Many-to-many: which permissions each role has |
| `user_roles` | Many-to-many: which roles each user holds |
| `refresh_tokens` | JWT refresh tokens with device info and expiry |
| `password_reset_tokens` | Time-limited password reset tokens |
| `otp_verifications` | OTP codes for phone/email verification |
| `notifications` | In-app notifications with read status |

### Master Data Layer

| Entity | Purpose |
|---|---|
| `service_categories` | Top-level: Moving, Transport, Tow, Cargo |
| `service_types` | Specific services within categories |
| `vehicle_types` | Truck, van, flatbed, etc. with capacity info |
| `cities` | City records |
| `areas` | Areas within cities |
| `zones` | Operational zones (grouping of areas) |
| `branches` | Provider branch locations |
| `pricing_settings` | Base pricing rules and modifiers |
| `app_settings` | Global platform configuration |

### Customer Layer

| Entity | Purpose |
|---|---|
| `individual_customers` | Extended profile for individual customers |
| `customer_addresses` | Saved addresses for repeat orders |
| `customer_reviews` | Reviews left by customers for providers |

### Provider Layer

| Entity | Purpose |
|---|---|
| `providers` | Provider organization record |
| `provider_users` | Users belonging to a provider |
| `provider_documents` | Uploaded compliance/license documents |
| `provider_service_areas` | Geographic areas the provider covers |
| `provider_availability` | Availability schedules |
| `provider_workers` | Individual workers (laborers) |
| `provider_drivers` | Drivers with license info |
| `provider_vehicles` | Fleet vehicles with specs |
| `provider_wallets` | Financial balance for providers |
| `provider_settlements` | Settlement records |

### Company Layer

| Entity | Purpose |
|---|---|
| `companies` | Company organization record |
| `company_branches` | Company office branches |
| `company_users` | Users belonging to a company (with branch + role) |
| `company_billing_profiles` | Billing/invoicing configuration |
| `approval_rules` | Rules defining when orders need approval |
| `approval_history` | Approval decision records |

### Operations Layer

| Entity | Purpose |
|---|---|
| `orders` | Core order record with all request details |
| `order_locations` | Pickup and dropoff location details |
| `order_items` | Individual items within an order |
| `order_attachments` | Photos, documents attached to orders |
| `order_status_history` | Full audit trail of status changes |
| `offers` | Provider offers on published orders |
| `assignments` | Driver/team assignment to accepted orders |
| `tracking_events` | Real-time location/status tracking points |
| `delivery_proofs` | Photos, signatures proving delivery |
| `cancellations` | Cancellation records with reason and fees |
| `audit_logs` | System-wide activity audit trail |

### Finance Layer

| Entity | Purpose |
|---|---|
| `invoices` | Invoice header records |
| `invoice_items` | Line items within invoices |
| `payments` | Payment transaction records |
| `commissions` | Platform commission calculations |
| `settlements` | Provider settlement batches |
| `earnings_reports` | Pre-aggregated earnings snapshots for dashboards/exports (filled by jobs in Phase 3) |

### Support Layer

| Entity | Purpose |
|---|---|
| `tickets` | Support ticket records |
| `ticket_comments` | Comments/replies on tickets |
| `issue_types` | Categorization of support issues |

---

## Tenant Scoping Notes

### Company Scoping
- `company_users.companyId` links users to companies
- All company-scoped queries filter by `companyId`
- `company_branches` are scoped to company
- Line managers additionally scope by `branchId`
- Orders from company users carry `companyId` on the order record

### Provider Scoping
- `provider_users.providerId` links users to providers
- All provider-scoped queries filter by `providerId`
- Offers created by provider users carry `providerId`
- Assignments carry `providerId` and `driverId`

### Individual Scoping
- Individual customers see only orders where `requesterId = userId`
- No organizational scoping needed

### Driver Scoping
- Drivers see only assignments where `driverId = userId`
- Tracking events filtered by assignment

---

## Status Modeling Notes

All status fields use Prisma enums for type safety.

Key enums:
- `OrderStatus` — 17 states with defined transitions
- `OfferStatus` — 5 states
- `ApprovalStatus` — 3 states
- `InvoiceStatus` — 6 states
- `TicketStatus` — 4 states
- `UserStatus` — active, inactive, suspended, pending_verification
- `DocumentStatus` — pending, approved, rejected, expired
- `AssignmentStatus` — pending, accepted, rejected, in_progress, completed, canceled

Status transitions are enforced in the service layer, not via database triggers.

---

## File Upload Relationships

Files are stored via an abstraction layer supporting local disk or cloud storage (S3-compatible).

Entities with file relationships:
- `order_attachments` — photos of items, documents
- `provider_documents` — licenses, certifications
- `delivery_proofs` — delivery confirmation photos, signatures
- `profiles.avatarUrl` — user profile photos
- `companies.logoUrl` — company logos
- `providers.logoUrl` — provider logos

File metadata stored: `filename`, `originalName`, `mimeType`, `size`, `path`, `uploadedBy`.

---

## Approval Flow Modeling Notes

### Approval Rules
- Defined per company: `approval_rules` table
- Rules based on: order value threshold, service type, branch
- Multiple approval levels supported (sequential)
- Rule evaluation happens at order submission time

### Approval History
- Each approval decision creates an `approval_history` record
- Links to: order, approver user, rule that triggered it
- Stores: decision (approved/rejected), notes, timestamp

---

## Offer Flow Modeling Notes

### Offer Lifecycle
- Providers submit offers on `published_for_offers` orders
- Each offer includes: price, estimated duration, notes, validity period
- Only one offer can be accepted per order
- When one offer is accepted, remaining pending offers auto-expire
- Expired offers are cleaned up by a scheduled job

---

## Finance Modeling Notes

### Invoice Generation
- Invoices auto-generated on order completion
- Can also be manually created by finance_admin
- Each invoice has line items linked to order items/services

### Commission Calculation
- Platform takes a commission percentage from each order
- Commission rate may vary by provider, service type, or volume
- Commission records link to: order, provider, invoice

### Settlement
- Settlements aggregate provider earnings minus commissions
- Settlement batches processed on schedule (weekly/monthly)
- Settlement record links to: provider, payment, period

### Earnings reports (analytics-ready)
- `earnings_reports` stores roll-ups by `subject_type` + optional `subject_id` (e.g. `platform`, `company`, `provider`, `driver`) over `period_start` / `period_end`
- `status`: `draft` → `generating` → `ready` | `failed`; optional `file_path` for exported files
- `meta` JSON for breakdowns (e.g. per service type) without schema churn

---

## Indexing Strategy

### Primary Indexes (auto by Prisma)
- All `id` fields (primary key)
- All `@unique` fields

### Performance Indexes
- `orders`: `(status)`, `(companyId, status)`, `(requesterId)`, `(createdAt)`
- `offers`: `(orderId, status)`, `(providerId, status)`
- `assignments`: `(orderId)`, `(driverId, status)`, `(providerId)`
- `tracking_events`: `(assignmentId, createdAt)`
- `invoices`: `(orderId)`, `(companyId, status)`, `(providerId)`
- `audit_logs`: `(userId, createdAt)`, `(entityType, entityId)`
- `notifications`: `(userId, isRead, createdAt)`
- `company_users`: `(companyId, userId)`, `(userId)`
- `provider_users`: `(providerId, userId)`, `(userId)`

### Soft Delete
- Entities with `deletedAt`: users, companies, providers, orders
- Queries default to `WHERE deletedAt IS NULL`
- Hard delete only for truly transient data (expired OTPs, old refresh tokens)

---

## Audit Fields Convention

Every entity includes:
- `id` — UUID primary key
- `createdAt` — auto-set on creation
- `updatedAt` — auto-updated on modification

Most entities also include:
- `createdBy` — userId of creator (nullable for system-created)
- `updatedBy` — userId of last modifier
- `deletedAt` — soft delete timestamp (nullable)
