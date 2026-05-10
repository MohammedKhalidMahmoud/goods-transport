# Postman Equivalent Notes

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Swagger as Primary API Testing Tool

This project uses **Swagger UI (OpenAPI 3.0)** as the primary API documentation and testing tool, replacing Postman.

### Access
```
Development: http://localhost:3000/api-docs
```

### Why Swagger over Postman
1. **Self-documenting** — API docs live with the code, always up-to-date
2. **No external tool** — No Postman collections to sync or share
3. **Try-it-out** — Swagger UI has built-in request execution
4. **Type safety** — Request/response schemas are defined in code
5. **Versioned** — API docs are versioned with the codebase

---

## Testing Conventions

### Authentication Testing

1. **Login Flow:**
   - Call `POST /api/v1/auth/login` with credentials
   - Copy the `accessToken` from the response
   - Click "Authorize" in Swagger UI
   - Paste: `Bearer <accessToken>`
   - All subsequent requests include the token

2. **Token Refresh:**
   - When you get 401, call `POST /api/v1/auth/refresh`
   - Use the new `accessToken`

3. **Test Users (from seed):**

   | Role | Email | Password |
   |---|---|---|
   | Super Admin | admin@goodstransfer.com | Admin@123 |
   | Operations Admin | ops@goodstransfer.com | Admin@123 |
   | Support Admin | support@goodstransfer.com | Admin@123 |
   | Finance Admin | finance@goodstransfer.com | Admin@123 |
   | Company Admin | company@test.com | Test@123 |
   | Employee | employee@test.com | Test@123 |
   | Line Manager | manager@test.com | Test@123 |
   | Provider Admin | provider@test.com | Test@123 |
   | Provider Operator | operator@test.com | Test@123 |
   | Individual Customer | customer@test.com | Test@123 |
   | Delivery Driver | driver@test.com | Test@123 |

### Role-Based Testing

To test RBAC:
1. Login as a specific role
2. Try accessing endpoints outside that role's permissions
3. Verify 403 Forbidden response
4. Verify tenant scoping (company user can't see other company's data)

JWTs for company/provider users include `companyId` / `providerId`; drivers linked in `provider_drivers` also receive `providerId`. See [TENANCY_AND_AUTH.md](./TENANCY_AND_AUTH.md).

---

## Endpoint Grouping in Swagger

Endpoints are grouped by tags:

| Tag | Description |
|---|---|
| Auth | Authentication and session management |
| Users | User CRUD and role assignment |
| Companies | Company management |
| Providers | Provider management |
| Orders | Order lifecycle management |
| Offers | Provider offer management |
| Approvals | Company approval workflow |
| Assignments | Driver/team assignments |
| Tracking | Real-time tracking events |
| Finance | Invoices, payments, settlements |
| Support | Tickets and issue management |
| Master Data | Categories, vehicles, locations |
| Notifications | In-app notifications |
| Analytics | Dashboard analytics and reports |
| Settings | System and tenant settings |

---

## Request/Response Testing Notes

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": { "timestamp": "..." }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ { "field": "name", "message": "Required" } ],
  "meta": { "errorCode": "VALIDATION_ERROR" }
}
```

### File Upload Testing
- Use `multipart/form-data` content type
- Swagger UI supports file upload via the "Try it out" interface
- Maximum file size: configured in app settings
- Allowed MIME types: configured per endpoint

---

## Environment Configuration

### Development
```
BASE_URL=http://localhost:3000/api/v1
SWAGGER_URL=http://localhost:3000/api-docs
```

### Testing Sequence

Recommended order for testing a new feature:

1. **Auth** — Login, get token
2. **Master Data** — Verify lookup data exists
3. **CRUD** — Create, read, update, list
4. **Business Logic** — Status transitions, approvals, offers
5. **Scoping** — Test with different role tokens
6. **Edge Cases** — Invalid data, unauthorized access, duplicates

---

## Alternative: REST Client (VS Code)

For developers who prefer in-editor testing, `.http` files can be placed in `backend/tests/http/` using the REST Client VS Code extension format:

```http
### Login as Super Admin
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "identifier": "admin@goodstransfer.com",
  "password": "Admin@123"
}

### Get Current User
GET http://localhost:3000/api/v1/auth/me
Authorization: Bearer {{accessToken}}
```

These files are supplementary — Swagger remains the primary tool.
