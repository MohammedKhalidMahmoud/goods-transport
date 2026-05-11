const PERMISSIONS = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_REFRESH: 'auth:refresh',
  AUTH_LOGOUT: 'auth:logout',

  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_READ_OWN: 'users:read_own',
  USERS_UPDATE: 'users:update',
  USERS_UPDATE_OWN: 'users:update_own',
  USERS_DELETE: 'users:delete',
  USERS_ASSIGN_ROLES: 'users:assign_roles',

  // Providers
  PROVIDERS_CREATE: 'providers:create',
  PROVIDERS_READ: 'providers:read',
  PROVIDERS_READ_OWN: 'providers:read_own',
  PROVIDERS_UPDATE: 'providers:update',
  PROVIDERS_UPDATE_OWN: 'providers:update_own',
  PROVIDERS_DELETE: 'providers:delete',
  PROVIDERS_MANAGE_WORKERS: 'providers:manage_workers',
  PROVIDERS_MANAGE_DOCUMENTS: 'providers:manage_documents',

  // Orders
  ORDERS_CREATE: 'orders:create',
  ORDERS_READ: 'orders:read',
  ORDERS_READ_OWN: 'orders:read_own',
  ORDERS_READ_PROVIDER: 'orders:read_provider',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_UPDATE_OWN: 'orders:update_own',
  ORDERS_CANCEL: 'orders:cancel',
  ORDERS_SUBMIT: 'orders:submit',

  // Offers
  OFFERS_CREATE: 'offers:create',
  OFFERS_READ: 'offers:read',
  OFFERS_READ_OWN: 'offers:read_own',
  OFFERS_ACCEPT: 'offers:accept',
  OFFERS_REJECT: 'offers:reject',
  OFFERS_WITHDRAW: 'offers:withdraw',

  // Assignments
  ASSIGNMENTS_CREATE: 'assignments:create',
  ASSIGNMENTS_READ: 'assignments:read',
  ASSIGNMENTS_READ_PROVIDER: 'assignments:read_provider',
  ASSIGNMENTS_READ_OWN: 'assignments:read_own',
  ASSIGNMENTS_ACCEPT: 'assignments:accept',
  ASSIGNMENTS_REJECT: 'assignments:reject',
  ASSIGNMENTS_UPDATE_STATUS: 'assignments:update_status',

  // Finance
  INVOICES_CREATE: 'invoices:create',
  INVOICES_READ: 'invoices:read',
  INVOICES_READ_OWN: 'invoices:read_own',
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_READ: 'payments:read',
  SETTLEMENTS_MANAGE: 'settlements:manage',
  SETTLEMENTS_READ_OWN: 'settlements:read_own',

  // Tickets
  TICKETS_CREATE: 'tickets:create',
  TICKETS_READ: 'tickets:read',
  TICKETS_READ_OWN: 'tickets:read_own',
  TICKETS_UPDATE: 'tickets:update',
  TICKETS_RESOLVE: 'tickets:resolve',

  // Master Data
  MASTER_DATA_MANAGE: 'master_data:manage',
  MASTER_DATA_READ: 'master_data:read',

  // Settings
  SETTINGS_MANAGE: 'settings:manage',
  SETTINGS_MANAGE_PROVIDER: 'settings:manage_provider',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_READ_PROVIDER: 'analytics:read_provider',

  // Audit
  AUDIT_LOGS_READ: 'audit_logs:read',

  // Notifications
  NOTIFICATIONS_READ_OWN: 'notifications:read_own',
};

module.exports = { PERMISSIONS };
