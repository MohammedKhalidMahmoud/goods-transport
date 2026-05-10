# Goods Transfer — Enterprise Logistics Platform

A production-grade, multi-tenant logistics and transport management platform supporting individual customers, companies, service providers, and delivery drivers.

## Architecture

```
goods-transfer/
├── backend/     # Node.js + Express + Prisma + MySQL
└── frontend/    # React + Vite unified dashboard
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js + Express.js |
| Database | MySQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| API Docs | Swagger / OpenAPI 3.0 |
| Real-time | Socket.IO |
| Frontend | React + Vite |
| Styling | CSS Modules / Theme system |
| State | Zustand |
| i18n | Ready for Arabic (RTL) |

## Platform Apps

| App | Type | Users |
|---|---|---|
| Individuals App | Mobile | Customers, Service Providers |
| Companies App | Mobile | Employees, Managers, Drivers |
| Admin Dashboard | Web | Internal admins |
| Company Dashboard | Web | Company admins, managers |
| Provider Dashboard | Web | Provider admins, operators |

## Services Supported

- Furniture Moving
- Item Transport
- Tow Truck
- General Cargo / Custom Transport

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # Configure database URL
npx prisma migrate dev  # Run migrations
npm run seed            # Seed roles, permissions, users
npm run dev             # Start dev server on :3000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # Start dev server on :5173
```

### API Documentation

After starting the backend:
```
http://localhost:3000/api-docs
```

## Project Documentation

All architecture documentation lives in `backend/docs/`:

- [Implementation Plan](backend/docs/IMPLEMENTATION_PLAN.md)
- [API Contract](backend/docs/API_CONTRACT.md)
- [RBAC Matrix](backend/docs/RBAC_MATRIX.md)
- [Order Status Matrix](backend/docs/ORDER_STATUS_MATRIX.md)
- [Screen Flow Matrix](backend/docs/SCREEN_FLOW_MATRIX.md)
- [DB Schema Notes](backend/docs/DB_SCHEMA_NOTES.md)
- [Postman Equivalent Notes](backend/docs/POSTMAN_EQUIVALENT_NOTES.md)
- [Tenancy & Auth](backend/docs/TENANCY_AND_AUTH.md)

## License

Proprietary — All rights reserved.
