# RBAC Matrix

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Role Definitions

### Internal Roles (Global Scope)

| Role | Code | Description |
|---|---|---|
| Super Admin | `super_admin` | Full system access, can manage all tenants and configurations |
| Operations Admin | `operations_admin` | Manages orders, assignments, providers, daily operations |
| Support Admin | `support_admin` | Manages support tickets, can view orders and users |
| Finance Admin | `finance_admin` | Manages invoices, payments, settlements, commissions |

### Company Roles (Company-Scoped)

| Role | Code | Description |
|---|---|---|
| Company Admin | `company_admin` | Manages company settings, users, branches, billing |
| Employee | `employee` | Creates orders, views own order history |
| Line Manager | `line_manager` | Approves orders, manages branch-level operations |

### Provider Roles (Provider-Scoped)

| Role | Code | Description |
|---|---|---|
| Provider Admin | `provider_admin` | Manages provider org, workers, vehicles, documents |
| Provider Operator | `provider_operator` | Handles day-to-day provider operations, offers |

### Mobile Roles (Self/Assignment-Scoped)

| Role | Code | Description |
|---|---|---|
| Individual Customer | `individual_customer` | Creates orders, manages own profile |
| Delivery Driver | `delivery_driver` | Receives assignments, updates delivery status |

---

## Permission Structure

Permissions follow the pattern: `module:action`

### Actions
| Action | Description |
|---|---|
| `create` | Create new records |
| `read` | View records |
| `update` | Modify existing records |
| `delete` | Soft-delete records |
| `manage` | Full CRUD + special operations |
| `approve` | Approve/reject workflow items |
| `assign` | Assign resources |
| `export` | Export data |

---

## Module Access Matrix

### Legend
- ✅ Full access
- 📖 Read only
- 🏢 Own company/provider only
- 👤 Own data only
- ❌ No access
- 🔀 Conditional / partial

| Module | super_admin | ops_admin | support_admin | finance_admin | company_admin | employee | line_manager | provider_admin | provider_operator | individual_customer | delivery_driver |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Users | ✅ | 📖 | 📖 | ❌ | 🏢 | 👤 | 🏢📖 | 🏢 | 👤 | 👤 | 👤 |
| Companies | ✅ | 📖 | 📖 | 📖 | 🏢 | 🏢📖 | 🏢📖 | ❌ | ❌ | ❌ | ❌ |
| Providers | ✅ | ✅ | 📖 | 📖 | ❌ | ❌ | ❌ | 🏢 | 🏢📖 | ❌ | ❌ |
| Orders | ✅ | ✅ | 📖 | 📖 | 🏢 | 👤 | 🏢 | 🏢📖 | 🏢📖 | 👤 | 🔀 |
| Approvals | ✅ | 📖 | ❌ | ❌ | 🏢 | ❌ | 🏢 | ❌ | ❌ | ❌ | ❌ |
| Offers | ✅ | ✅ | 📖 | ❌ | 🏢📖 | 👤📖 | 🏢📖 | 🏢 | 🏢 | 👤📖 | ❌ |
| Assignments | ✅ | ✅ | 📖 | ❌ | 🏢📖 | ❌ | 🏢📖 | 🏢 | 🏢📖 | ❌ | 🔀 |
| Tracking | ✅ | ✅ | 📖 | ❌ | 🏢📖 | 👤📖 | 🏢📖 | 🏢📖 | 🏢📖 | 👤📖 | 🔀 |
| Invoices | ✅ | 📖 | ❌ | ✅ | 🏢📖 | 👤📖 | 🏢📖 | 🏢📖 | ❌ | 👤📖 | ❌ |
| Payments | ✅ | ❌ | ❌ | ✅ | 🏢📖 | ❌ | ❌ | 🏢📖 | ❌ | 👤 | ❌ |
| Settlements | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 🏢📖 | ❌ | ❌ | ❌ |
| Tickets | ✅ | 📖 | ✅ | ❌ | 🏢 | 👤 | 🏢 | 🏢 | 👤 | 👤 | 👤 |
| Notifications | ✅ | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 |
| Master Data | ✅ | 📖 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | 🏢 | ❌ | ❌ | 🏢 | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | 📖 | ✅ | 🏢 | ❌ | 🏢 | 🏢 | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | 📖 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Action-Level Permissions

### Auth Module
| Permission | Description | Roles |
|---|---|---|
| `auth:login` | Login to system | All roles |
| `auth:refresh` | Refresh token | All roles |
| `auth:logout` | Logout | All roles |

### User Management
| Permission | Description | Roles |
|---|---|---|
| `users:create` | Create users | super_admin, company_admin, provider_admin |
| `users:read` | View user list | super_admin, ops_admin, support_admin, company_admin, line_manager, provider_admin |
| `users:read_own` | View own profile | All roles |
| `users:update` | Update users | super_admin, company_admin, provider_admin |
| `users:update_own` | Update own profile | All roles |
| `users:delete` | Delete users | super_admin |
| `users:assign_roles` | Assign roles | super_admin, company_admin, provider_admin |

### Company Management
| Permission | Description | Roles |
|---|---|---|
| `companies:create` | Create companies | super_admin |
| `companies:read` | View all companies | super_admin, ops_admin, support_admin, finance_admin |
| `companies:read_own` | View own company | company_admin, employee, line_manager |
| `companies:update` | Update any company | super_admin |
| `companies:update_own` | Update own company | company_admin |
| `companies:delete` | Delete company | super_admin |
| `companies:manage_users` | Manage company users | super_admin, company_admin |
| `companies:manage_branches` | Manage branches | super_admin, company_admin |

### Provider Management
| Permission | Description | Roles |
|---|---|---|
| `providers:create` | Create providers | super_admin |
| `providers:read` | View all providers | super_admin, ops_admin, support_admin, finance_admin |
| `providers:read_own` | View own provider | provider_admin, provider_operator |
| `providers:update` | Update any provider | super_admin, ops_admin |
| `providers:update_own` | Update own provider | provider_admin |
| `providers:delete` | Delete provider | super_admin |
| `providers:manage_workers` | Manage workers | super_admin, provider_admin |
| `providers:manage_vehicles` | Manage vehicles | super_admin, provider_admin |
| `providers:manage_documents` | Manage documents | super_admin, provider_admin |

### Order Management
| Permission | Description | Roles |
|---|---|---|
| `orders:create` | Create orders | employee, line_manager, company_admin, individual_customer |
| `orders:read` | View all orders | super_admin, ops_admin |
| `orders:read_company` | View company orders | company_admin, line_manager |
| `orders:read_own` | View own orders | employee, individual_customer |
| `orders:read_provider` | View provider-relevant orders | provider_admin, provider_operator |
| `orders:update` | Update any order | super_admin, ops_admin |
| `orders:update_own` | Update own orders | employee, individual_customer |
| `orders:cancel` | Cancel orders | super_admin, ops_admin, company_admin, employee, individual_customer |
| `orders:submit` | Submit orders | employee, line_manager, company_admin, individual_customer |

### Approval Flow
| Permission | Description | Roles |
|---|---|---|
| `approvals:read` | View approvals | super_admin, company_admin, line_manager |
| `approvals:approve` | Approve requests | super_admin, company_admin, line_manager |
| `approvals:reject` | Reject requests | super_admin, company_admin, line_manager |

### Offer Flow
| Permission | Description | Roles |
|---|---|---|
| `offers:create` | Submit offers | provider_admin, provider_operator |
| `offers:read` | View all offers | super_admin, ops_admin |
| `offers:read_own` | View own offers | provider_admin, provider_operator |
| `offers:accept` | Accept offers | super_admin, ops_admin, company_admin, individual_customer |
| `offers:reject` | Reject offers | super_admin, ops_admin, company_admin, individual_customer |
| `offers:withdraw` | Withdraw offers | provider_admin, provider_operator |

### Assignment
| Permission | Description | Roles |
|---|---|---|
| `assignments:create` | Create assignments | super_admin, ops_admin, provider_admin |
| `assignments:read` | View all assignments | super_admin, ops_admin |
| `assignments:read_provider` | View provider assignments | provider_admin, provider_operator |
| `assignments:read_own` | View own assignments | delivery_driver |
| `assignments:accept` | Accept assignment | delivery_driver |
| `assignments:reject` | Reject assignment | delivery_driver |
| `assignments:update_status` | Update assignment status | delivery_driver |

### Finance
| Permission | Description | Roles |
|---|---|---|
| `invoices:create` | Create invoices | super_admin, finance_admin |
| `invoices:read` | View all invoices | super_admin, finance_admin |
| `invoices:read_company` | View company invoices | company_admin, line_manager |
| `invoices:read_own` | View own invoices | employee, individual_customer |
| `payments:create` | Record payments | super_admin, finance_admin |
| `payments:read` | View all payments | super_admin, finance_admin |
| `settlements:manage` | Manage settlements | super_admin, finance_admin |
| `settlements:read_own` | View own settlements | provider_admin |

### Support
| Permission | Description | Roles |
|---|---|---|
| `tickets:create` | Create tickets | All roles |
| `tickets:read` | View all tickets | super_admin, support_admin |
| `tickets:read_company` | View company tickets | company_admin, line_manager |
| `tickets:read_own` | View own tickets | All roles |
| `tickets:update` | Update any ticket | super_admin, support_admin |
| `tickets:resolve` | Resolve tickets | super_admin, support_admin |

### Master Data & Settings
| Permission | Description | Roles |
|---|---|---|
| `master_data:manage` | Manage master data | super_admin |
| `master_data:read` | Read master data | All authenticated roles |
| `settings:manage` | Manage app settings | super_admin |
| `settings:manage_company` | Manage company settings | company_admin |
| `settings:manage_provider` | Manage provider settings | provider_admin |

### Analytics & Audit
| Permission | Description | Roles |
|---|---|---|
| `analytics:read` | View global analytics | super_admin, ops_admin, finance_admin |
| `analytics:read_company` | View company analytics | company_admin |
| `analytics:read_provider` | View provider analytics | provider_admin |
| `audit_logs:read` | View audit logs | super_admin |

---

## Tenant Scope Rules

### Scoping Enforcement

| Scope Level | Roles | Enforcement |
|---|---|---|
| Global | super_admin, ops_admin, support_admin, finance_admin | No tenant filter applied |
| Company | company_admin, employee, line_manager | Filter by `companyId` from JWT context |
| Provider | provider_admin, provider_operator | Filter by `providerId` from JWT context |
| Self | individual_customer | Filter by `userId` from JWT context |
| Assignment | delivery_driver | Filter by assigned orders/deliveries |

### Implementation Rules

1. Tenant context is resolved from the JWT token during authentication.
2. Repository layer automatically applies tenant filters.
3. Company-scoped roles cannot query cross-company data.
4. Provider-scoped roles cannot query cross-provider data.
5. Internal roles can optionally scope to specific tenants via query parameters.
6. Tenant boundary violations return 403 Forbidden.

**Implementation details:** see [TENANCY_AND_AUTH.md](./TENANCY_AND_AUTH.md) (`req.user`, `req.tenantScope`, JWT claims).
