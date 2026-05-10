# Tenancy & Authentication Foundation

This document is the **single reference** for how JWT claims, `req.user`, `req.tenantScope`, and RBAC interact in Phase 1. Business modules in Phase 2 must follow these rules.

---

## JWT access token claims

Issued on **login** and **refresh**. Verified by `authenticate` middleware.

| Claim | Description |
|-------|-------------|
| `userId` | Primary user id |
| `email` | User email |
| `roles` | All role codes assigned to the user (union of permissions in token is not stored; permissions are reloaded from DB on each request) |
| `companyId` | Active company tenant (from `company_users`), if applicable |
| `providerId` | Active provider tenant (from `provider_users`, or from `provider_drivers` for linked drivers), if applicable |
| `branchId` | Optional branch within company |

**Note:** Phase 1 does not implement “switch active role/tenant” UI. If a user gains multiple org memberships later, issue a new token when they switch context.

---

## `req.user` (after `authenticate`)

Populated from the **database** (roles + permissions) plus **JWT** for tenant ids:

- `id`, `email`, `phone`, `status`
- `roles` — from `user_roles` + `roles.code`
- `permissions` — union of all permissions for those roles
- `companyId`, `providerId`, `branchId` — from JWT (must stay in sync with login/refresh logic)

Permissions are recomputed on every request so seed or admin changes to RBAC take effect without re-login.

---

## `req.tenantScope` (after `resolveTenantScope`)

Built by `buildTenantScopeFromUser(req.user)` in `src/utils/tenantScope.js`:

| `type` | Meaning | `id` / ids |
|--------|---------|------------|
| `global` | Internal admin roles | `id` null; no automatic filters |
| `company` | Company dashboard users | `id` = `companyId`; optional `branchId` |
| `provider` | Provider org users | `id` = `providerId` |
| `self` | Individual customer | `id` = user id (for `requesterId`-style filters) |
| `assignment` | Delivery driver | `id` = user id; optional `providerId` if linked via `provider_drivers` |

**Validation:** If the user has a company role (`company_admin`, `employee`, `line_manager`) but JWT has no `companyId`, requests fail with 403. Same for provider roles without `providerId`.

---

## RBAC middleware

- `authorizeRoles(...roles)` — at least one role required.
- `authorizePermissions(...perms)` — at least one permission required (OR).

Use **permissions** for fine-grained API rules; use **roles** only where appropriate (e.g. route families).

---

## Repository scoping (Phase 2 convention)

1. Accept `tenantScope` (or full `user`) in the service layer.
2. Merge filters using `src/utils/tenantQuery.js` helpers, e.g. `companyTenantWhere`, `providerTenantWhere`, `requesterSelfWhere`.
3. For drivers (`assignment`), restrict lists to assignments where `driver` links to `req.user.id` (implemented when Assignment APIs exist).
4. Never trust `companyId` / `providerId` from query/body for scoped users — compare to `tenantScope` and reject mismatches (`enforceTenantParam` for path params).

---

## Related documents

- `RBAC_MATRIX.md` — roles and permissions
- `API_CONTRACT.md` — response envelope and versioning
- `DB_SCHEMA_NOTES.md` — schema and tenant columns on entities
