# Screen Flow Matrix

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Dashboard Flows by Role

### 1. Super Admin / Operations Admin Flow

```
Login → Admin Dashboard Home
  ├── Overview (KPIs, charts, recent activity)
  ├── User Management
  │   ├── User List → User Detail → Edit / Assign Roles
  │   └── Create User
  ├── Company Management
  │   ├── Company List → Company Detail
  │   │   ├── Branches
  │   │   ├── Users
  │   │   └── Billing
  │   └── Create Company
  ├── Provider Management
  │   ├── Provider List → Provider Detail
  │   │   ├── Workers
  │   │   ├── Vehicles
  │   │   ├── Documents
  │   │   └── Service Areas
  │   └── Create Provider
  ├── Order Management
  │   ├── Order List (filterable) → Order Detail
  │   │   ├── Status History
  │   │   ├── Offers
  │   │   ├── Assignment
  │   │   ├── Tracking
  │   │   └── Attachments
  │   └── Manual Order Creation
  ├── Master Data
  │   ├── Service Categories
  │   ├── Vehicle Types
  │   ├── Cities / Areas / Zones
  │   └── Pricing Settings
  ├── Finance
  │   ├── Invoices
  │   ├── Payments
  │   ├── Settlements
  │   └── Commissions
  ├── Support
  │   ├── Ticket List → Ticket Detail
  │   └── Issue Types
  ├── Analytics & Reports
  │   ├── Order Analytics
  │   ├── Revenue Analytics
  │   └── Provider Performance
  ├── Audit Logs
  ├── Settings
  │   └── App Settings
  └── Profile / Logout
```

**API Groups Used:** Auth, Users, Companies, Providers, Orders, Offers, Assignments, Tracking, Finance, Tickets, Master Data, Analytics, Audit, Settings

---

### 2. Support Admin Flow

```
Login → Support Dashboard Home
  ├── Ticket Queue
  │   ├── Open Tickets
  │   ├── In Progress
  │   └── Resolved
  ├── Ticket Detail
  │   ├── Comments
  │   ├── Related Order
  │   └── Status Update
  ├── Order Lookup (read-only)
  │   └── Order Detail
  ├── User Lookup (read-only)
  └── Profile / Logout
```

**API Groups Used:** Auth, Tickets, Orders (read), Users (read)

---

### 3. Finance Admin Flow

```
Login → Finance Dashboard Home
  ├── Overview (Revenue, Outstanding, Settlements)
  ├── Invoices
  │   ├── Invoice List → Invoice Detail
  │   └── Create Invoice
  ├── Payments
  │   ├── Payment List
  │   └── Record Payment
  ├── Settlements
  │   ├── Settlement List → Settlement Detail
  │   └── Process Settlement
  ├── Commissions
  │   └── Commission Report
  ├── Reports
  │   ├── Revenue Report
  │   └── Export
  └── Profile / Logout
```

**API Groups Used:** Auth, Invoices, Payments, Settlements, Commissions, Analytics

---

### 4. Company Admin Flow

```
Login → Company Dashboard Home
  ├── Overview (Company KPIs, recent orders)
  ├── Orders
  │   ├── Order List → Order Detail
  │   ├── Create Order
  │   └── Pending Approvals
  ├── Branches
  │   ├── Branch List → Branch Detail
  │   └── Create Branch
  ├── Users
  │   ├── User List → User Detail
  │   └── Invite User
  ├── Approvals
  │   ├── Pending Approvals → Approve / Reject
  │   └── Approval History
  ├── Billing
  │   ├── Invoices
  │   └── Payment History
  ├── Settings
  │   ├── Company Profile
  │   ├── Approval Rules
  │   └── Billing Profile
  └── Profile / Logout
```

**API Groups Used:** Auth, Orders, Approvals, Companies (own), Users (own company), Invoices (own), Settings

---

### 5. Employee Flow (Company)

```
Login → Employee Dashboard Home
  ├── My Orders
  │   ├── Order List → Order Detail
  │   └── Create Order
  ├── Notifications
  ├── Profile
  └── Logout
```

**API Groups Used:** Auth, Orders (own), Notifications

---

### 6. Line Manager Flow (Company)

```
Login → Manager Dashboard Home
  ├── Branch Orders
  │   └── Order List → Order Detail
  ├── Pending Approvals
  │   └── Approve / Reject
  ├── Approval History
  ├── Branch Users (read-only)
  ├── Notifications
  └── Profile / Logout
```

**API Groups Used:** Auth, Orders (branch), Approvals, Users (branch read), Notifications

---

### 7. Provider Admin Flow

```
Login → Provider Dashboard Home
  ├── Overview (Active orders, earnings, workers)
  ├── Available Orders
  │   ├── Order List (published) → Order Detail
  │   └── Submit Offer
  ├── My Offers
  │   ├── Offer List → Offer Detail
  │   └── Withdraw Offer
  ├── Assignments
  │   ├── Active Assignments
  │   └── Assignment Detail → Assign Driver
  ├── Workers
  │   ├── Worker List → Worker Detail
  │   └── Add Worker
  ├── Vehicles
  │   ├── Vehicle List → Vehicle Detail
  │   └── Add Vehicle
  ├── Documents
  │   └── Upload / Manage Documents
  ├── Earnings
  │   ├── Earnings Summary
  │   └── Settlement History
  ├── Settings
  │   ├── Provider Profile
  │   └── Service Areas
  └── Profile / Logout
```

**API Groups Used:** Auth, Orders (published + assigned), Offers, Assignments, Workers, Vehicles, Documents, Earnings, Settings

---

### 8. Provider Operator Flow

```
Login → Operator Dashboard Home
  ├── Available Orders → Submit Offer
  ├── Active Offers
  ├── Active Assignments
  ├── Notifications
  └── Profile / Logout
```

**API Groups Used:** Auth, Orders (published), Offers (own provider), Assignments (own provider), Notifications

---

## Mobile App Flows

### 9. Individual Customer (Mobile App)

```
Splash → Onboarding → Login / Register
  ├── Home
  │   ├── Service Categories
  │   └── Create Order Wizard
  │       ├── Select Service
  │       ├── Pickup Location
  │       ├── Dropoff Location
  │       ├── Details (floor, workers, fragile, etc.)
  │       ├── Schedule
  │       ├── Review & Submit
  │       └── Confirmation
  ├── My Orders
  │   ├── Active Orders → Order Detail
  │   │   ├── Track Order (live)
  │   │   ├── View Offers → Accept Offer
  │   │   └── Cancel Order
  │   └── Order History
  ├── Notifications
  ├── Profile
  │   ├── My Addresses
  │   ├── Payment Methods
  │   └── Settings
  └── Support
      └── Create Ticket
```

**API Groups Used:** Auth, Orders, Offers, Tracking, Notifications, Addresses, Profile, Tickets

---

### 10. Delivery Driver (Mobile App)

```
Splash → Login
  ├── Home
  │   ├── Current Assignment
  │   └── Assignment Queue
  ├── Assignment Detail
  │   ├── Accept / Reject
  │   ├── Navigate to Pickup
  │   ├── Confirm Arrival
  │   ├── Confirm Pickup
  │   ├── Navigate to Dropoff
  │   ├── Confirm Delivery
  │   └── Upload Proof (photos, signature)
  ├── History
  │   └── Completed Deliveries
  ├── Earnings
  │   └── Earnings Summary
  ├── Notifications
  └── Profile / Logout
```

**API Groups Used:** Auth, Assignments, Tracking, Delivery Proof, Earnings, Notifications, Profile

---

## API Dependency Map

| Flow | Auth | Users | Companies | Providers | Orders | Offers | Approvals | Assignments | Tracking | Finance | Tickets | Master Data | Analytics | Notifications |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Admin Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Support Dashboard | ✅ | 📖 | — | — | 📖 | — | — | — | — | — | ✅ | — | — | ✅ |
| Finance Dashboard | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — | ✅ | ✅ |
| Company Dashboard | ✅ | ✅ | ✅ | — | ✅ | 📖 | ✅ | 📖 | 📖 | 📖 | ✅ | — | ✅ | ✅ |
| Provider Dashboard | ✅ | — | — | ✅ | 📖 | ✅ | — | ✅ | 📖 | 📖 | ✅ | — | ✅ | ✅ |
| Customer App | ✅ | ✅ | — | — | ✅ | ✅ | — | — | ✅ | 📖 | ✅ | ✅ | — | ✅ |
| Driver App | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ | 📖 | — | — | — | ✅ |
