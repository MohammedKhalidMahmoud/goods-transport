/**
 * Dashboard demo seed — re-run safe (`npx prisma db seed`).
 * AR: بيانات تجريبية شاملة لكل لوحات التحكم (شركة، مزود، أدمن، عميل، سائق).
 * EN: Full demo data for company / provider / admin / customer / driver UIs.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function syncOrderLocations(orderId, rows) {
  await prisma.orderLocation.deleteMany({ where: { orderId } });
  for (const row of rows) {
    await prisma.orderLocation.create({ data: { orderId, ...row } });
  }
}

async function syncOrderItems(orderId, rows) {
  await prisma.orderItem.deleteMany({ where: { orderId } });
  if (!rows.length) return;
  await prisma.orderItem.createMany({ data: rows.map((r) => ({ orderId, ...r })) });
}

async function syncOrderStatusHistory(orderId, rows) {
  await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
  for (const row of rows) {
    await prisma.orderStatusHistory.create({ data: { orderId, ...row } });
  }
}

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================
  // ROLES
  // ============================================================

  console.log('Creating roles...');
  const rolesData = [
    { code: 'super_admin', name: 'Super Admin', scopeType: 'global', isSystem: true },
    { code: 'operations_admin', name: 'Operations Admin', scopeType: 'global', isSystem: true },
    { code: 'support_admin', name: 'Support Admin', scopeType: 'global', isSystem: true },
    { code: 'finance_admin', name: 'Finance Admin', scopeType: 'global', isSystem: true },
    { code: 'company_admin', name: 'Company Admin', scopeType: 'company', isSystem: true },
    { code: 'employee', name: 'Employee', scopeType: 'company', isSystem: true },
    { code: 'line_manager', name: 'Line Manager', scopeType: 'company', isSystem: true },
    { code: 'provider_admin', name: 'Provider Admin', scopeType: 'provider', isSystem: true },
    { code: 'provider_operator', name: 'Provider Operator', scopeType: 'provider', isSystem: true },
    { code: 'individual_customer', name: 'Individual Customer', scopeType: 'self', isSystem: true },
    { code: 'delivery_driver', name: 'Delivery Driver', scopeType: 'assignment', isSystem: true },
  ];

  const roles = {};
  for (const role of rolesData) {
    const created = await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
    roles[role.code] = created;
  }
  console.log(`  ✓ ${Object.keys(roles).length} roles created\n`);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  console.log('Creating permissions...');
  const permissionsData = [
    // Auth
    { code: 'auth:login', name: 'Login', module: 'auth', action: 'login' },
    { code: 'auth:refresh', name: 'Refresh Token', module: 'auth', action: 'refresh' },
    { code: 'auth:logout', name: 'Logout', module: 'auth', action: 'logout' },

    // Users
    { code: 'users:create', name: 'Create Users', module: 'users', action: 'create' },
    { code: 'users:read', name: 'Read All Users', module: 'users', action: 'read' },
    { code: 'users:read_own', name: 'Read Own Profile', module: 'users', action: 'read_own' },
    { code: 'users:update', name: 'Update Users', module: 'users', action: 'update' },
    { code: 'users:update_own', name: 'Update Own Profile', module: 'users', action: 'update_own' },
    { code: 'users:delete', name: 'Delete Users', module: 'users', action: 'delete' },
    { code: 'users:assign_roles', name: 'Assign Roles', module: 'users', action: 'assign_roles' },

    // Companies
    { code: 'companies:create', name: 'Create Companies', module: 'companies', action: 'create' },
    { code: 'companies:read', name: 'Read All Companies', module: 'companies', action: 'read' },
    { code: 'companies:read_own', name: 'Read Own Company', module: 'companies', action: 'read_own' },
    { code: 'companies:update', name: 'Update Companies', module: 'companies', action: 'update' },
    { code: 'companies:update_own', name: 'Update Own Company', module: 'companies', action: 'update_own' },
    { code: 'companies:delete', name: 'Delete Companies', module: 'companies', action: 'delete' },
    { code: 'companies:manage_users', name: 'Manage Company Users', module: 'companies', action: 'manage_users' },
    { code: 'companies:manage_branches', name: 'Manage Branches', module: 'companies', action: 'manage_branches' },

    // Providers
    { code: 'providers:create', name: 'Create Providers', module: 'providers', action: 'create' },
    { code: 'providers:read', name: 'Read All Providers', module: 'providers', action: 'read' },
    { code: 'providers:read_own', name: 'Read Own Provider', module: 'providers', action: 'read_own' },
    { code: 'providers:update', name: 'Update Providers', module: 'providers', action: 'update' },
    { code: 'providers:update_own', name: 'Update Own Provider', module: 'providers', action: 'update_own' },
    { code: 'providers:delete', name: 'Delete Providers', module: 'providers', action: 'delete' },
    { code: 'providers:manage_workers', name: 'Manage Workers', module: 'providers', action: 'manage_workers' },
    { code: 'providers:manage_vehicles', name: 'Manage Vehicles', module: 'providers', action: 'manage_vehicles' },
    { code: 'providers:manage_documents', name: 'Manage Documents', module: 'providers', action: 'manage_documents' },

    // Orders
    { code: 'orders:create', name: 'Create Orders', module: 'orders', action: 'create' },
    { code: 'orders:read', name: 'Read All Orders', module: 'orders', action: 'read' },
    { code: 'orders:read_company', name: 'Read Company Orders', module: 'orders', action: 'read_company' },
    { code: 'orders:read_own', name: 'Read Own Orders', module: 'orders', action: 'read_own' },
    { code: 'orders:read_provider', name: 'Read Provider Orders', module: 'orders', action: 'read_provider' },
    { code: 'orders:update', name: 'Update Orders', module: 'orders', action: 'update' },
    { code: 'orders:update_own', name: 'Update Own Orders', module: 'orders', action: 'update_own' },
    { code: 'orders:cancel', name: 'Cancel Orders', module: 'orders', action: 'cancel' },
    { code: 'orders:submit', name: 'Submit Orders', module: 'orders', action: 'submit' },

    // Approvals
    { code: 'approvals:read', name: 'Read Approvals', module: 'approvals', action: 'read' },
    { code: 'approvals:approve', name: 'Approve Requests', module: 'approvals', action: 'approve' },
    { code: 'approvals:reject', name: 'Reject Requests', module: 'approvals', action: 'reject' },

    // Offers
    { code: 'offers:create', name: 'Create Offers', module: 'offers', action: 'create' },
    { code: 'offers:read', name: 'Read All Offers', module: 'offers', action: 'read' },
    { code: 'offers:read_own', name: 'Read Own Offers', module: 'offers', action: 'read_own' },
    { code: 'offers:accept', name: 'Accept Offers', module: 'offers', action: 'accept' },
    { code: 'offers:reject', name: 'Reject Offers', module: 'offers', action: 'reject' },
    { code: 'offers:withdraw', name: 'Withdraw Offers', module: 'offers', action: 'withdraw' },

    // Assignments
    { code: 'assignments:create', name: 'Create Assignments', module: 'assignments', action: 'create' },
    { code: 'assignments:read', name: 'Read All Assignments', module: 'assignments', action: 'read' },
    { code: 'assignments:read_provider', name: 'Read Provider Assignments', module: 'assignments', action: 'read_provider' },
    { code: 'assignments:read_own', name: 'Read Own Assignments', module: 'assignments', action: 'read_own' },
    { code: 'assignments:accept', name: 'Accept Assignment', module: 'assignments', action: 'accept' },
    { code: 'assignments:reject', name: 'Reject Assignment', module: 'assignments', action: 'reject' },
    { code: 'assignments:update_status', name: 'Update Assignment Status', module: 'assignments', action: 'update_status' },

    // Finance
    { code: 'invoices:create', name: 'Create Invoices', module: 'invoices', action: 'create' },
    { code: 'invoices:read', name: 'Read All Invoices', module: 'invoices', action: 'read' },
    { code: 'invoices:read_company', name: 'Read Company Invoices', module: 'invoices', action: 'read_company' },
    { code: 'invoices:read_own', name: 'Read Own Invoices', module: 'invoices', action: 'read_own' },
    { code: 'payments:create', name: 'Create Payments', module: 'payments', action: 'create' },
    { code: 'payments:read', name: 'Read All Payments', module: 'payments', action: 'read' },
    { code: 'settlements:manage', name: 'Manage Settlements', module: 'settlements', action: 'manage' },
    { code: 'settlements:read_own', name: 'Read Own Settlements', module: 'settlements', action: 'read_own' },

    // Tickets
    { code: 'tickets:create', name: 'Create Tickets', module: 'tickets', action: 'create' },
    { code: 'tickets:read', name: 'Read All Tickets', module: 'tickets', action: 'read' },
    { code: 'tickets:read_company', name: 'Read Company Tickets', module: 'tickets', action: 'read_company' },
    { code: 'tickets:read_own', name: 'Read Own Tickets', module: 'tickets', action: 'read_own' },
    { code: 'tickets:update', name: 'Update Tickets', module: 'tickets', action: 'update' },
    { code: 'tickets:resolve', name: 'Resolve Tickets', module: 'tickets', action: 'resolve' },

    // Master Data & Settings
    { code: 'master_data:manage', name: 'Manage Master Data', module: 'master_data', action: 'manage' },
    { code: 'master_data:read', name: 'Read Master Data', module: 'master_data', action: 'read' },
    { code: 'settings:manage', name: 'Manage Settings', module: 'settings', action: 'manage' },
    { code: 'settings:manage_company', name: 'Manage Company Settings', module: 'settings', action: 'manage_company' },
    { code: 'settings:manage_provider', name: 'Manage Provider Settings', module: 'settings', action: 'manage_provider' },

    // Analytics & Audit
    { code: 'analytics:read', name: 'Read Analytics', module: 'analytics', action: 'read' },
    { code: 'analytics:read_company', name: 'Read Company Analytics', module: 'analytics', action: 'read_company' },
    { code: 'analytics:read_provider', name: 'Read Provider Analytics', module: 'analytics', action: 'read_provider' },
    { code: 'audit_logs:read', name: 'Read Audit Logs', module: 'audit_logs', action: 'read' },

    // Notifications
    { code: 'notifications:read_own', name: 'Read Own Notifications', module: 'notifications', action: 'read_own' },
  ];

  const permissions = {};
  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    permissions[perm.code] = created;
  }
  console.log(`  ✓ ${Object.keys(permissions).length} permissions created\n`);

  // ============================================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ============================================================

  console.log('Assigning permissions to roles...');

  const allPermCodes = Object.keys(permissions);
  const commonPerms = ['auth:login', 'auth:refresh', 'auth:logout', 'users:read_own', 'users:update_own', 'notifications:read_own', 'tickets:create', 'tickets:read_own', 'master_data:read'];

  const rolePermMap = {
    super_admin: allPermCodes,

    operations_admin: [
      ...commonPerms,
      'users:read', 'companies:read', 'providers:read', 'providers:update',
      'providers:manage_workers', 'providers:manage_vehicles', 'providers:manage_documents',
      'orders:read', 'orders:update', 'orders:cancel',
      'offers:read', 'offers:accept', 'offers:reject',
      'assignments:create', 'assignments:read',
      'invoices:read', 'analytics:read',
      'tickets:read',
    ],

    support_admin: [
      ...commonPerms,
      'users:read', 'companies:read', 'providers:read',
      'orders:read',
      'tickets:read', 'tickets:update', 'tickets:resolve',
    ],

    finance_admin: [
      ...commonPerms,
      'companies:read', 'providers:read',
      'orders:read',
      'invoices:create', 'invoices:read',
      'payments:create', 'payments:read',
      'settlements:manage',
      'analytics:read',
    ],

    company_admin: [
      ...commonPerms,
      'companies:read_own', 'companies:update_own', 'companies:manage_users', 'companies:manage_branches',
      'users:create', 'users:read', 'users:update', 'users:assign_roles',
      'orders:create', 'orders:read_company', 'orders:update_own', 'orders:cancel', 'orders:submit',
      'approvals:read', 'approvals:approve', 'approvals:reject',
      'offers:read_own', 'offers:accept', 'offers:reject',
      'invoices:read_company',
      'settings:manage_company',
      'analytics:read_company',
      'tickets:read_company',
    ],

    employee: [
      ...commonPerms,
      'companies:read_own',
      'orders:create', 'orders:read_own', 'orders:update_own', 'orders:cancel', 'orders:submit',
      'offers:read_own',
      'invoices:read_own',
    ],

    line_manager: [
      ...commonPerms,
      'companies:read_own',
      'users:read',
      'orders:create', 'orders:read_company', 'orders:update_own', 'orders:cancel', 'orders:submit',
      'approvals:read', 'approvals:approve', 'approvals:reject',
      'offers:read_own',
      'invoices:read_company',
      'analytics:read_company',
      'tickets:read_company',
    ],

    provider_admin: [
      ...commonPerms,
      'providers:read_own', 'providers:update_own',
      'providers:manage_workers', 'providers:manage_vehicles', 'providers:manage_documents',
      'users:create', 'users:read', 'users:update', 'users:assign_roles',
      'orders:read_provider',
      'offers:create', 'offers:read_own', 'offers:withdraw',
      'assignments:create', 'assignments:read_provider',
      'settlements:read_own',
      'settings:manage_provider',
      'analytics:read_provider',
    ],

    provider_operator: [
      ...commonPerms,
      'providers:read_own',
      'orders:read_provider',
      'offers:create', 'offers:read_own', 'offers:withdraw',
      'assignments:read_provider',
    ],

    individual_customer: [
      ...commonPerms,
      'orders:create', 'orders:read_own', 'orders:update_own', 'orders:cancel', 'orders:submit',
      'offers:read_own', 'offers:accept', 'offers:reject',
      'invoices:read_own',
    ],

    delivery_driver: [
      ...commonPerms,
      'assignments:read_own', 'assignments:accept', 'assignments:reject', 'assignments:update_status',
    ],
  };

  let rpCount = 0;
  for (const [roleCode, permCodes] of Object.entries(rolePermMap)) {
    const role = roles[roleCode];
    const uniquePerms = [...new Set(permCodes)];
    for (const permCode of uniquePerms) {
      const permission = permissions[permCode];
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
      rpCount++;
    }
  }
  console.log(`  ✓ ${rpCount} role-permission mappings created\n`);

  // ============================================================
  // USERS
  // ============================================================

  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const testPasswordHash = await bcrypt.hash('Test@123', 12);

  const usersData = [
    { email: 'admin@goodstransfer.com', phone: '+966500000001', hash: passwordHash, firstName: 'Super', lastName: 'Admin', roleCode: 'super_admin', userType: 'DASHBOARD', myAdmin: true, jobTitle: 'Platform Admin' },
    { email: 'ops@goodstransfer.com', phone: '+966500000002', hash: passwordHash, firstName: 'Operations', lastName: 'Admin', roleCode: 'operations_admin', userType: 'DASHBOARD', jobTitle: 'Operations Admin' },
    { email: 'support@goodstransfer.com', phone: '+966500000003', hash: passwordHash, firstName: 'Support', lastName: 'Admin', roleCode: 'support_admin', userType: 'DASHBOARD', jobTitle: 'Support Admin' },
    { email: 'finance@goodstransfer.com', phone: '+966500000004', hash: passwordHash, firstName: 'Finance', lastName: 'Admin', roleCode: 'finance_admin', userType: 'DASHBOARD', jobTitle: 'Finance Admin' },
    { email: 'company@test.com', phone: '+966500000005', hash: testPasswordHash, firstName: 'Company', lastName: 'Admin', roleCode: 'company_admin', userType: 'DASHBOARD', jobTitle: 'Company Admin' },
    { email: 'employee@test.com', phone: '+966500000006', hash: testPasswordHash, firstName: 'Test', lastName: 'Employee', roleCode: 'employee', userType: 'DASHBOARD', jobTitle: 'Employee' },
    { email: 'manager@test.com', phone: '+966500000007', hash: testPasswordHash, firstName: 'Test', lastName: 'Manager', roleCode: 'line_manager', userType: 'DASHBOARD', jobTitle: 'Line Manager' },
    { email: 'provider@test.com', phone: '+966500000008', hash: testPasswordHash, firstName: 'Provider', lastName: 'Admin', roleCode: 'provider_admin', userType: 'APP', appRole: 'PROVIDER' },
    { email: 'operator@test.com', phone: '+966500000009', hash: testPasswordHash, firstName: 'Test', lastName: 'Operator', roleCode: 'provider_operator', userType: 'APP', appRole: 'PROVIDER' },
    { email: 'customer@test.com', phone: '+966500000010', hash: testPasswordHash, firstName: 'Test', lastName: 'Customer', roleCode: 'individual_customer', userType: 'APP', appRole: 'CUSTOMER' },
    { email: 'driver@test.com', phone: '+966500000011', hash: testPasswordHash, firstName: 'Test', lastName: 'Driver', roleCode: 'delivery_driver', userType: 'APP', appRole: 'PROVIDER' },
  ];

  const users = {};
  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      // Always sync demo passwords so re-running seed fixes "Invalid credentials"
      // after manual DB changes or an older seed that used different passwords.
      update: {
        passwordHash: userData.hash,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        appRole: userData.appRole || null,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        email: userData.email,
        phone: userData.phone,
        passwordHash: userData.hash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        appRole: userData.appRole || null,
        status: 'ACTIVE',
      },
    });

    const role = roles[userData.roleCode];
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    if (userData.userType === 'DASHBOARD') {
      await prisma.dashboardUserProfile.upsert({
        where: { userId: user.id },
        update: {
          roleId: role.id,
          myAdmin: Boolean(userData.myAdmin),
          jobTitle: userData.jobTitle || null,
        },
        create: {
          userId: user.id,
          roleId: role.id,
          myAdmin: Boolean(userData.myAdmin),
          jobTitle: userData.jobTitle || null,
        },
      });
    }

    users[userData.roleCode] = user;
  }
  console.log(`  ✓ ${Object.keys(users).length} users created\n`);

  // ============================================================
  // COMPANY + BRANCH + COMPANY USERS
  // ============================================================

  console.log('Creating test company...');
  const company = await prisma.company.upsert({
    where: { id: 'test-company-001' },
    update: {},
    create: {
      id: 'test-company-001',
      name: 'Acme Corporation',
      nameAr: 'شركة أكمي',
      contactEmail: 'info@acme.com',
      contactPhone: '+966511111111',
      address: 'Riyadh, Saudi Arabia',
      status: 'active',
      createdBy: users.super_admin.id,
    },
  });

  const companyBranch = await prisma.companyBranch.upsert({
    where: { id: 'test-branch-001' },
    update: {},
    create: {
      id: 'test-branch-001',
      companyId: company.id,
      name: 'Main Office',
      nameAr: 'المكتب الرئيسي',
      city: 'Riyadh',
      isActive: true,
    },
  });

  // Link company users
  for (const roleCode of ['company_admin', 'employee', 'line_manager']) {
    const user = users[roleCode];
    await prisma.companyUser.upsert({
      where: { companyId_userId: { companyId: company.id, userId: user.id } },
      update: {},
      create: {
        companyId: company.id,
        userId: user.id,
        branchId: companyBranch.id,
        role: roleCode,
      },
    });
  }
  console.log(`  ✓ Company "${company.name}" with branch and users\n`);

  // ============================================================
  // PROVIDER + PROVIDER USERS
  // ============================================================

  console.log('Creating test provider...');
  const provider = await prisma.provider.upsert({
    where: { id: 'test-provider-001' },
    update: {},
    create: {
      id: 'test-provider-001',
      name: 'Fast Movers Co.',
      nameAr: 'شركة النقل السريع',
      contactEmail: 'info@fastmovers.com',
      contactPhone: '+966522222222',
      address: 'Jeddah, Saudi Arabia',
      status: 'active',
      isVerified: true,
      createdBy: users.super_admin.id,
    },
  });

  // Link provider users
  for (const roleCode of ['provider_admin', 'provider_operator']) {
    const user = users[roleCode];
    await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: provider.name,
        logoUrl: provider.logoUrl,
        address: provider.address,
        taxNumber: provider.taxNumber,
        licenseNumber: provider.licenseNumber,
      },
      create: {
        userId: user.id,
        businessName: provider.name,
        logoUrl: provider.logoUrl,
        address: provider.address,
        taxNumber: provider.taxNumber,
        licenseNumber: provider.licenseNumber,
      },
    });
    await prisma.providerUser.upsert({
      where: { providerId_userId: { providerId: provider.id, userId: user.id } },
      update: {},
      create: {
        providerId: provider.id,
        userId: user.id,
        role: roleCode,
      },
    });
  }

  // Provider wallet balances are set in the dashboard demo block below.

  // Create provider driver (link delivery_driver user)
  await prisma.providerDriver.upsert({
    where: { id: 'test-driver-001' },
    update: {},
    create: {
      id: 'test-driver-001',
      providerId: provider.id,
      userId: users.delivery_driver.id,
      name: 'Test Driver',
      phone: '+966500000011',
      isActive: true,
    },
  });

  await prisma.branch.upsert({
    where: { id: 'logistics-branch-001' },
    update: {},
    create: {
      id: 'logistics-branch-001',
      providerId: provider.id,
      name: 'Jeddah Logistics Hub',
      nameAr: 'مركز جدة اللوجستي',
      address: 'Industrial Area, Jeddah',
      phone: '+966520000123',
      isActive: true,
    },
  });

  console.log(`  ✓ Provider "${provider.name}" with users, wallet, and driver\n`);

  // ============================================================
  // INDIVIDUAL CUSTOMER
  // ============================================================

  console.log('Creating individual customer profile...');
  await prisma.individualCustomer.upsert({
    where: { userId: users.individual_customer.id },
    update: {},
    create: { userId: users.individual_customer.id },
  });
  console.log('  ✓ Individual customer profile\n');

  // ============================================================
  // MASTER DATA
  // ============================================================

  console.log('Creating master data...');

  // Service Categories
  const categories = [
    { code: 'furniture_moving', name: 'Furniture Moving', nameAr: 'نقل أثاث', sortOrder: 1 },
    { code: 'item_transport', name: 'Item Transport', nameAr: 'نقل بضائع', sortOrder: 2 },
    { code: 'tow_truck', name: 'Tow Truck', nameAr: 'سحب مركبات', sortOrder: 3 },
    { code: 'general_cargo', name: 'General Cargo', nameAr: 'شحن عام', sortOrder: 4 },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const created = await prisma.serviceCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
    createdCategories[cat.code] = created;
  }

  // Service Types
  const serviceTypes = [
    { code: 'local_moving', name: 'Local Moving', nameAr: 'نقل محلي', categoryCode: 'furniture_moving' },
    { code: 'intercity_moving', name: 'Intercity Moving', nameAr: 'نقل بين المدن', categoryCode: 'furniture_moving' },
    { code: 'office_moving', name: 'Office Moving', nameAr: 'نقل مكاتب', categoryCode: 'furniture_moving' },
    { code: 'small_item', name: 'Small Item Delivery', nameAr: 'توصيل طرود صغيرة', categoryCode: 'item_transport' },
    { code: 'large_item', name: 'Large Item Transport', nameAr: 'نقل قطع كبيرة', categoryCode: 'item_transport' },
    { code: 'vehicle_tow', name: 'Vehicle Towing', nameAr: 'سحب مركبة', categoryCode: 'tow_truck' },
    { code: 'custom_cargo', name: 'Custom Cargo', nameAr: 'شحن مخصص', categoryCode: 'general_cargo' },
  ];

  for (const st of serviceTypes) {
    const category = createdCategories[st.categoryCode];
    await prisma.serviceType.upsert({
      where: { code: st.code },
      update: {},
      create: {
        code: st.code,
        name: st.name,
        nameAr: st.nameAr,
        serviceCategoryId: category.id,
      },
    });
  }

  // Vehicle Types
  const vehicleTypes = [
    { code: 'pickup_truck', name: 'Pickup Truck', nameAr: 'بيك أب', capacity: '1-2 tons' },
    { code: 'van', name: 'Van', nameAr: 'فان', capacity: '0.5-1 ton' },
    { code: 'small_truck', name: 'Small Truck', nameAr: 'شاحنة صغيرة', capacity: '3-5 tons' },
    { code: 'large_truck', name: 'Large Truck', nameAr: 'شاحنة كبيرة', capacity: '10-15 tons' },
    { code: 'flatbed', name: 'Flatbed', nameAr: 'سطحة', capacity: '5-10 tons' },
    { code: 'tow_truck', name: 'Tow Truck', nameAr: 'ونش سحب', capacity: '1 vehicle' },
  ];

  for (const vt of vehicleTypes) {
    await prisma.vehicleType.upsert({
      where: { code: vt.code },
      update: {},
      create: vt,
    });
  }

  // Cities
  const cities = [
    { code: 'riyadh', name: 'Riyadh', nameAr: 'الرياض' },
    { code: 'jeddah', name: 'Jeddah', nameAr: 'جدة' },
    { code: 'dammam', name: 'Dammam', nameAr: 'الدمام' },
    { code: 'makkah', name: 'Makkah', nameAr: 'مكة المكرمة' },
    { code: 'madinah', name: 'Madinah', nameAr: 'المدينة المنورة' },
  ];

  const createdCities = {};
  for (const city of cities) {
    const created = await prisma.city.upsert({
      where: { code: city.code },
      update: {},
      create: city,
    });
    createdCities[city.code] = created;
  }

  // Zones
  const zones = [
    { code: 'zone_central', name: 'Central Zone', nameAr: 'المنطقة الوسطى' },
    { code: 'zone_western', name: 'Western Zone', nameAr: 'المنطقة الغربية' },
    { code: 'zone_eastern', name: 'Eastern Zone', nameAr: 'المنطقة الشرقية' },
  ];

  const createdZones = {};
  for (const zone of zones) {
    const created = await prisma.zone.upsert({
      where: { code: zone.code },
      update: {},
      create: zone,
    });
    createdZones[zone.code] = created;
  }

  // Areas
  const areas = [
    { code: 'riyadh_olaya', name: 'Al Olaya', nameAr: 'العليا', cityCode: 'riyadh', zoneCode: 'zone_central' },
    { code: 'riyadh_malaz', name: 'Al Malaz', nameAr: 'الملز', cityCode: 'riyadh', zoneCode: 'zone_central' },
    { code: 'jeddah_corniche', name: 'Corniche', nameAr: 'الكورنيش', cityCode: 'jeddah', zoneCode: 'zone_western' },
    { code: 'jeddah_rawdah', name: 'Al Rawdah', nameAr: 'الروضة', cityCode: 'jeddah', zoneCode: 'zone_western' },
    { code: 'dammam_faisaliah', name: 'Al Faisaliah', nameAr: 'الفيصلية', cityCode: 'dammam', zoneCode: 'zone_eastern' },
  ];

  for (const area of areas) {
    const city = createdCities[area.cityCode];
    const zone = createdZones[area.zoneCode];
    await prisma.area.upsert({
      where: { code: area.code },
      update: {},
      create: {
        code: area.code,
        name: area.name,
        nameAr: area.nameAr,
        cityId: city.id,
        zoneId: zone.id,
      },
    });
  }

  // Issue Types
  const issueTypes = [
    { code: 'order_issue', name: 'Order Issue', nameAr: 'مشكلة في الطلب' },
    { code: 'payment_issue', name: 'Payment Issue', nameAr: 'مشكلة في الدفع' },
    { code: 'driver_issue', name: 'Driver Issue', nameAr: 'مشكلة مع السائق' },
    { code: 'damage_claim', name: 'Damage Claim', nameAr: 'مطالبة تلف' },
    { code: 'general_inquiry', name: 'General Inquiry', nameAr: 'استفسار عام' },
  ];

  for (const it of issueTypes) {
    await prisma.issueType.upsert({
      where: { code: it.code },
      update: {},
      create: it,
    });
  }

  // App Settings
  const appSettings = [
    { key: 'platform_name', value: 'Goods Transfer', group: 'general' },
    { key: 'platform_name_ar', value: 'نقل البضائع', group: 'general' },
    { key: 'default_currency', value: 'SAR', group: 'finance' },
    { key: 'vat_rate', value: '0.15', group: 'finance' },
    { key: 'offer_validity_hours', value: '24', group: 'orders' },
    { key: 'auto_complete_hours', value: '48', group: 'orders' },
    { key: 'max_offers_per_order', value: '10', group: 'orders' },
    { key: 'commission_rate', value: '0.15', group: 'finance' },
  ];

  for (const setting of appSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  const pricingRows = [
    { serviceTypeCode: 'local_moving', baseFare: 120, perKmRate: 4.5, perWorkerRate: 35, floorRate: 25, fragileMultiplier: 1.15 },
    { serviceTypeCode: 'small_item', baseFare: 40, perKmRate: 2, perWorkerRate: 0, floorRate: 0, fragileMultiplier: 1.05 },
    { serviceTypeCode: 'intercity_moving', baseFare: 800, perKmRate: 2.2, perWorkerRate: 50, floorRate: 40, fragileMultiplier: 1.2 },
  ];
  for (const p of pricingRows) {
    await prisma.pricingSetting.upsert({
      where: { serviceTypeCode: p.serviceTypeCode },
      update: {
        baseFare: p.baseFare,
        perKmRate: p.perKmRate,
        perWorkerRate: p.perWorkerRate,
        floorRate: p.floorRate,
        fragileMultiplier: p.fragileMultiplier,
      },
      create: { ...p, currency: 'SAR', isActive: true },
    });
  }

  console.log('  ✓ Service categories, types, vehicle types, cities, zones, areas');
  console.log('  ✓ Issue types, app settings, pricing settings\n');

  // ============================================================
  // COMPANY BILLING + APPROVAL RULES (company admin / finance UI)
  // ============================================================
  await prisma.companyBillingProfile.upsert({
    where: { id: 'seed-billing-company-001' },
    update: {},
    create: {
      id: 'seed-billing-company-001',
      companyId: company.id,
      billingName: 'Acme Corporation — Billing',
      billingEmail: 'billing@acme.com',
      billingAddress: 'Riyadh, Saudi Arabia',
      taxNumber: '300000000000003',
      paymentTermsDays: 30,
      creditLimit: 50000,
      currency: 'SAR',
      isDefault: true,
    },
  });

  await prisma.approvalRule.upsert({
    where: { id: 'seed-approval-rule-001' },
    update: { isActive: true },
    create: {
      id: 'seed-approval-rule-001',
      companyId: company.id,
      name: 'Any company order — manager approval',
      serviceTypeCode: null,
      minAmount: null,
      maxAmount: null,
      approverRole: 'line_manager',
      level: 1,
      isActive: true,
    },
  });

  // ============================================================
  // INDIVIDUAL CUSTOMER — saved address (customer UI)
  // ============================================================
  const indCustomerRow = await prisma.individualCustomer.findUnique({
    where: { userId: users.individual_customer.id },
  });
  if (indCustomerRow) {
    await prisma.customerAddress.upsert({
      where: { id: 'seed-cust-addr-001' },
      update: {},
      create: {
        id: 'seed-cust-addr-001',
        individualCustomerId: indCustomerRow.id,
        label: 'Home',
        addressLine1: 'King Fahd Road, Building 12',
        city: 'Riyadh',
        area: 'Al Olaya',
        isDefault: true,
      },
    });
  }

  // ============================================================
  // PROVIDER — documents, vehicle, worker, service area, wallet, availability
  // ============================================================
  const areaOlaya = await prisma.area.findUnique({ where: { code: 'riyadh_olaya' } });
  const areaMalaz = await prisma.area.findUnique({ where: { code: 'riyadh_malaz' } });
  const vtPickup = await prisma.vehicleType.findUnique({ where: { code: 'pickup_truck' } });

  await prisma.providerWallet.upsert({
    where: { providerId: provider.id },
    update: {
      balance: 1250.5,
      pendingBalance: 320,
      totalEarnings: 8900,
      totalWithdrawn: 2100,
    },
    create: {
      providerId: provider.id,
      balance: 1250.5,
      pendingBalance: 320,
      totalEarnings: 8900,
      totalWithdrawn: 2100,
    },
  });

  if (areaOlaya) {
    await prisma.providerServiceArea.upsert({
      where: { providerId_areaId: { providerId: provider.id, areaId: areaOlaya.id } },
      update: { isActive: true },
      create: { providerId: provider.id, areaId: areaOlaya.id, isActive: true },
    });
  }
  if (areaMalaz) {
    await prisma.providerServiceArea.upsert({
      where: { providerId_areaId: { providerId: provider.id, areaId: areaMalaz.id } },
      update: { isActive: true },
      create: { providerId: provider.id, areaId: areaMalaz.id, isActive: true },
    });
  }

  await prisma.providerWorker.upsert({
    where: { id: 'seed-worker-001' },
    update: { isActive: true },
    create: {
      id: 'seed-worker-001',
      providerId: provider.id,
      name: 'Ahmed Helper',
      phone: '+966501112233',
      idNumber: '1XXXXXXXXX',
      isActive: true,
    },
  });

  if (vtPickup) {
    await prisma.providerVehicle.upsert({
      where: { id: 'seed-vehicle-001' },
      update: { isActive: true },
      create: {
        id: 'seed-vehicle-001',
        providerId: provider.id,
        vehicleTypeId: vtPickup.id,
        plateNumber: 'ABC 1234',
        make: 'Toyota',
        model: 'Hilux',
        year: 2022,
        color: 'White',
        isActive: true,
      },
    });
  }

  await prisma.providerAvailability.upsert({
    where: { id: 'seed-avail-001' },
    update: {},
    create: {
      id: 'seed-avail-001',
      providerId: provider.id,
      dayOfWeek: 0,
      startTime: '08:00',
      endTime: '18:00',
      isActive: true,
    },
  });

  await prisma.providerDocument.upsert({
    where: { id: 'seed-doc-pending' },
    update: { status: 'pending' },
    create: {
      id: 'seed-doc-pending',
      providerId: provider.id,
      documentType: 'commercial_registration',
      fileName: 'cr_pending.pdf',
      originalName: 'CR.pdf',
      filePath: '/seed/demo/cr_pending.pdf',
      mimeType: 'application/pdf',
      fileSize: 102400,
      status: 'pending',
      uploadedBy: users.provider_admin.id,
    },
  });
  await prisma.providerDocument.upsert({
    where: { id: 'seed-doc-approved' },
    update: {},
    create: {
      id: 'seed-doc-approved',
      providerId: provider.id,
      documentType: 'transport_license',
      fileName: 'license_ok.pdf',
      originalName: 'License.pdf',
      filePath: '/seed/demo/license_ok.pdf',
      mimeType: 'application/pdf',
      fileSize: 88000,
      status: 'approved',
      reviewedBy: users.super_admin.id,
      reviewedAt: new Date(),
      uploadedBy: users.provider_admin.id,
    },
  });
  await prisma.providerDocument.upsert({
    where: { id: 'seed-doc-rejected' },
    update: {},
    create: {
      id: 'seed-doc-rejected',
      providerId: provider.id,
      documentType: 'insurance',
      fileName: 'insurance_bad.pdf',
      originalName: 'Insurance.pdf',
      filePath: '/seed/demo/insurance_bad.pdf',
      mimeType: 'application/pdf',
      fileSize: 64000,
      status: 'rejected',
      reviewedBy: users.super_admin.id,
      reviewedAt: new Date(),
      rejectionReason: 'Expired policy date — please upload current certificate.',
      uploadedBy: users.provider_admin.id,
    },
  });

  console.log('  ✓ Company billing, approval rule, customer address');
  console.log('  ✓ Provider wallet, areas, worker, vehicle, availability, documents\n');

  // ============================================================
  // DEMO ORDERS — all key statuses + offers + assignments + finance
  // ============================================================
  const stMoving = await prisma.serviceType.findUnique({ where: { code: 'local_moving' } });
  const stSmall = await prisma.serviceType.findUnique({ where: { code: 'small_item' } });
  const vanVt = await prisma.vehicleType.findUnique({ where: { code: 'van' } });

  const locPair = (city = 'Riyadh', pickupArea = 'Al Olaya', dropArea = 'Al Malaz') => [
    { type: 'pickup', addressLine: `Pickup — ${pickupArea}`, city, area: pickupArea },
    { type: 'dropoff', addressLine: `Dropoff — ${dropArea}`, city, area: dropArea },
  ];

  const O = {
    indPublished: '00000000-0000-4000-8000-000000000001',
    offDemo: '00000000-0000-4000-8000-000000000002',
    compDraft: '00000000-0000-4000-8000-000000000010',
    compSubmitted: '00000000-0000-4000-8000-000000000011',
    compPendingAppr: '00000000-0000-4000-8000-000000000012',
    compRejected: '00000000-0000-4000-8000-000000000013',
    compPublished: '00000000-0000-4000-8000-000000000014',
    compOfferAccepted: '00000000-0000-4000-8000-000000000015',
    compAssigned: '00000000-0000-4000-8000-000000000016',
    compInTransit: '00000000-0000-4000-8000-000000000017',
    compCompleted: '00000000-0000-4000-8000-000000000018',
    indCompleted: '00000000-0000-4000-8000-000000000019',
    compCanceled: '00000000-0000-4000-8000-00000000001a',
    offPubA: '00000000-0000-4000-8000-000000000021',
    offPubB: '00000000-0000-4000-8000-000000000022',
    offAccepted: '00000000-0000-4000-8000-000000000023',
    asg016: '00000000-0000-4000-8000-000000000031',
    asg017: '00000000-0000-4000-8000-000000000032',
    asg018: '00000000-0000-4000-8000-000000000033',
    invDraft: '00000000-0000-4000-8000-000000000041',
    inv018: '00000000-0000-4000-8000-000000000042',
    inv019: '00000000-0000-4000-8000-000000000043',
    earn01: '00000000-0000-4000-8000-000000000051',
    settle01: '00000000-0000-4000-8000-000000000052',
    tickOpen: '00000000-0000-4000-8000-000000000061',
    tickProg: '00000000-0000-4000-8000-000000000062',
    tickDone: '00000000-0000-4000-8000-000000000063',
  };

  if (!stMoving || !provider) {
    console.log('  ⚠ Skipping demo orders (missing service type or provider)\n');
  } else {
    const vId = vanVt?.id ?? null;
    const stSmallId = stSmall?.id ?? stMoving.id;

    const companyBase = {
      sourceType: 'company',
      companyId: company.id,
      requesterId: users.employee.id,
      serviceTypeId: stMoving.id,
      vehicleTypeId: vId,
      createdBy: users.employee.id,
    };

    // --- Individual: published for offers (customer accepts/rejects offers) ---
    await prisma.order.upsert({
      where: { id: O.indPublished },
      update: {
        status: 'published_for_offers',
        deletedAt: null,
        orderNumber: 'GT-DEMO-IND-PUB',
        sourceType: 'individual',
        requesterId: users.individual_customer.id,
        companyId: null,
        serviceTypeId: stMoving.id,
        vehicleTypeId: vId,
        estimatedPrice: 350,
        finalPrice: null,
        completedAt: null,
        cancelReason: null,
      },
      create: {
        id: O.indPublished,
        orderNumber: 'GT-DEMO-IND-PUB',
        sourceType: 'individual',
        requesterId: users.individual_customer.id,
        serviceTypeId: stMoving.id,
        vehicleTypeId: vId,
        status: 'published_for_offers',
        estimatedPrice: 350,
        createdBy: users.individual_customer.id,
      },
    });
    await syncOrderLocations(O.indPublished, locPair());
    await syncOrderStatusHistory(O.indPublished, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.individual_customer.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'submitted', changedBy: users.individual_customer.id, notes: 'seed' },
      { fromStatus: 'submitted', toStatus: 'published_for_offers', changedBy: users.individual_customer.id, notes: 'seed' },
    ]);
    await prisma.offer.upsert({
      where: { id: O.offDemo },
      update: { status: 'pending', price: 320 },
      create: {
        id: O.offDemo,
        orderId: O.indPublished,
        providerId: provider.id,
        price: 320,
        notes: 'Demo provider offer (pending)',
        status: 'pending',
        createdBy: users.provider_operator.id,
      },
    });

    // --- Company pipeline ---
    await prisma.order.upsert({
      where: { id: O.compDraft },
      update: { ...companyBase, status: 'draft', orderNumber: 'GT-COMP-DRAFT', estimatedPrice: 200, finalPrice: null, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compDraft, orderNumber: 'GT-COMP-DRAFT', ...companyBase, status: 'draft', estimatedPrice: 200 },
    });
    await syncOrderLocations(O.compDraft, locPair());
    await syncOrderStatusHistory(O.compDraft, [{ fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' }]);
    await syncOrderItems(O.compDraft, [{ name: 'Office chairs', quantity: 4, isFragile: false }]);

    await prisma.order.upsert({
      where: { id: O.compSubmitted },
      update: { ...companyBase, status: 'submitted', orderNumber: 'GT-COMP-SUBMIT', estimatedPrice: 450, finalPrice: null, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compSubmitted, orderNumber: 'GT-COMP-SUBMIT', ...companyBase, status: 'submitted', estimatedPrice: 450 },
    });
    await syncOrderLocations(O.compSubmitted, locPair());
    await syncOrderStatusHistory(O.compSubmitted, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'submitted', changedBy: users.employee.id, notes: 'seed' },
    ]);

    await prisma.order.upsert({
      where: { id: O.compPendingAppr },
      update: { ...companyBase, status: 'pending_approval', orderNumber: 'GT-COMP-PEND-APP', estimatedPrice: 1200, finalPrice: null, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compPendingAppr, orderNumber: 'GT-COMP-PEND-APP', ...companyBase, status: 'pending_approval', estimatedPrice: 1200 },
    });
    await syncOrderLocations(O.compPendingAppr, locPair());
    await syncOrderStatusHistory(O.compPendingAppr, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'submitted', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'submitted', toStatus: 'pending_approval', changedBy: users.employee.id, notes: 'seed' },
    ]);
    await prisma.approvalHistory.deleteMany({ where: { orderId: O.compPendingAppr } });
    await prisma.approvalHistory.create({
      data: {
        orderId: O.compPendingAppr,
        approverId: users.line_manager.id,
        ruleId: 'seed-approval-rule-001',
        status: 'pending',
        notes: 'Awaiting line manager — seed',
        level: 1,
      },
    });

    await prisma.order.upsert({
      where: { id: O.compRejected },
      update: { ...companyBase, status: 'rejected', orderNumber: 'GT-COMP-REJECTED', estimatedPrice: 99999, finalPrice: null, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compRejected, orderNumber: 'GT-COMP-REJECTED', ...companyBase, status: 'rejected', estimatedPrice: 99999 },
    });
    await syncOrderLocations(O.compRejected, locPair());
    await syncOrderStatusHistory(O.compRejected, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'submitted', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'submitted', toStatus: 'pending_approval', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'pending_approval', toStatus: 'rejected', changedBy: users.line_manager.id, notes: 'Over budget — seed' },
    ]);
    await prisma.approvalHistory.deleteMany({ where: { orderId: O.compRejected } });
    await prisma.approvalHistory.create({
      data: {
        orderId: O.compRejected,
        approverId: users.line_manager.id,
        ruleId: 'seed-approval-rule-001',
        status: 'rejected',
        notes: 'Over budget — seed',
        level: 1,
      },
    });

    await prisma.order.upsert({
      where: { id: O.compPublished },
      update: { ...companyBase, status: 'published_for_offers', orderNumber: 'GT-COMP-PUBLISH', estimatedPrice: 600, finalPrice: null, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compPublished, orderNumber: 'GT-COMP-PUBLISH', ...companyBase, status: 'published_for_offers', estimatedPrice: 600 },
    });
    await syncOrderLocations(O.compPublished, locPair());
    await syncOrderStatusHistory(O.compPublished, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'submitted', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'submitted', toStatus: 'approved', changedBy: users.line_manager.id, notes: 'seed' },
      { fromStatus: 'approved', toStatus: 'published_for_offers', changedBy: users.company_admin.id, notes: 'seed' },
    ]);
    await prisma.offer.upsert({
      where: { id: O.offPubA },
      update: { status: 'pending', price: 580 },
      create: {
        id: O.offPubA,
        orderId: O.compPublished,
        providerId: provider.id,
        price: 580,
        status: 'pending',
        createdBy: users.provider_operator.id,
      },
    });
    await prisma.offer.upsert({
      where: { id: O.offPubB },
      update: { status: 'withdrawn', price: 620 },
      create: {
        id: O.offPubB,
        orderId: O.compPublished,
        providerId: provider.id,
        price: 620,
        status: 'withdrawn',
        notes: 'Withdrawn for demo',
        respondedAt: new Date(),
        respondedBy: users.provider_admin.id,
        createdBy: users.provider_operator.id,
      },
    });

    await prisma.order.upsert({
      where: { id: O.compOfferAccepted },
      update: { ...companyBase, status: 'offer_accepted', orderNumber: 'GT-COMP-OFF-OK', estimatedPrice: 700, finalPrice: 680, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compOfferAccepted, orderNumber: 'GT-COMP-OFF-OK', ...companyBase, status: 'offer_accepted', estimatedPrice: 700, finalPrice: 680 },
    });
    await syncOrderLocations(O.compOfferAccepted, locPair());
    await syncOrderStatusHistory(O.compOfferAccepted, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'published_for_offers', changedBy: users.company_admin.id, notes: 'seed shortcut' },
      { fromStatus: 'published_for_offers', toStatus: 'offer_accepted', changedBy: users.company_admin.id, notes: 'seed' },
    ]);
    await prisma.offer.upsert({
      where: { id: O.offAccepted },
      update: { status: 'accepted', price: 680 },
      create: {
        id: O.offAccepted,
        orderId: O.compOfferAccepted,
        providerId: provider.id,
        price: 680,
        status: 'accepted',
        respondedAt: new Date(),
        respondedBy: users.company_admin.id,
        createdBy: users.provider_operator.id,
      },
    });

    await prisma.order.upsert({
      where: { id: O.compAssigned },
      update: { ...companyBase, status: 'assigned', orderNumber: 'GT-COMP-ASSIGNED', estimatedPrice: 500, finalPrice: 490, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compAssigned, orderNumber: 'GT-COMP-ASSIGNED', ...companyBase, status: 'assigned', estimatedPrice: 500, finalPrice: 490 },
    });
    await syncOrderLocations(O.compAssigned, locPair());
    await syncOrderStatusHistory(O.compAssigned, [
      { fromStatus: null, toStatus: 'offer_accepted', changedBy: users.company_admin.id, notes: 'seed' },
      { fromStatus: 'offer_accepted', toStatus: 'assigned', changedBy: users.operations_admin.id, notes: 'seed' },
    ]);
    await prisma.assignment.upsert({
      where: { id: O.asg016 },
      update: { status: 'accepted', driverId: 'test-driver-001' },
      create: {
        id: O.asg016,
        orderId: O.compAssigned,
        providerId: provider.id,
        driverId: 'test-driver-001',
        status: 'accepted',
        assignedBy: users.provider_admin.id,
        acceptedAt: new Date(),
        notes: 'Seed assignment (accepted)',
      },
    });

    await prisma.order.upsert({
      where: { id: O.compInTransit },
      update: { ...companyBase, status: 'in_transit', orderNumber: 'GT-COMP-TRANSIT', estimatedPrice: 550, finalPrice: 540, completedAt: null, cancelReason: null, deletedAt: null },
      create: { id: O.compInTransit, orderNumber: 'GT-COMP-TRANSIT', ...companyBase, status: 'in_transit', estimatedPrice: 550, finalPrice: 540 },
    });
    await syncOrderLocations(O.compInTransit, locPair());
    await syncOrderStatusHistory(O.compInTransit, [
      { fromStatus: null, toStatus: 'assigned', changedBy: users.provider_admin.id, notes: 'seed' },
      { fromStatus: 'assigned', toStatus: 'in_transit', changedBy: users.delivery_driver.id, notes: 'seed' },
    ]);
    await prisma.assignment.upsert({
      where: { id: O.asg017 },
      update: { status: 'in_progress', driverId: 'test-driver-001' },
      create: {
        id: O.asg017,
        orderId: O.compInTransit,
        providerId: provider.id,
        driverId: 'test-driver-001',
        status: 'in_progress',
        assignedBy: users.provider_admin.id,
        acceptedAt: new Date(),
        startedAt: new Date(),
        notes: 'Seed — driver en route',
      },
    });
    await prisma.trackingEvent.deleteMany({ where: { assignmentId: O.asg017 } });
    await prisma.trackingEvent.createMany({
      data: [
        { assignmentId: O.asg017, eventType: 'location_update', latitude: 24.7136, longitude: 46.6753, data: { label: 'Riyadh seed ping' } },
        { assignmentId: O.asg017, eventType: 'status', data: { message: 'in_transit' } },
      ],
    });

    const completedAt = new Date();
    await prisma.order.upsert({
      where: { id: O.compCompleted },
      update: { ...companyBase, status: 'completed', orderNumber: 'GT-COMP-DONE', estimatedPrice: 800, finalPrice: 790, completedAt, cancelReason: null, deletedAt: null },
      create: { id: O.compCompleted, orderNumber: 'GT-COMP-DONE', ...companyBase, status: 'completed', estimatedPrice: 800, finalPrice: 790, completedAt },
    });
    await syncOrderLocations(O.compCompleted, locPair());
    await syncOrderStatusHistory(O.compCompleted, [
      { fromStatus: null, toStatus: 'completed', changedBy: users.provider_admin.id, notes: 'seed terminal state' },
    ]);
    await prisma.assignment.upsert({
      where: { id: O.asg018 },
      update: { status: 'completed', driverId: 'test-driver-001', completedAt },
      create: {
        id: O.asg018,
        orderId: O.compCompleted,
        providerId: provider.id,
        driverId: 'test-driver-001',
        status: 'completed',
        assignedBy: users.provider_admin.id,
        acceptedAt: completedAt,
        startedAt: completedAt,
        completedAt,
        notes: 'Seed completed job',
      },
    });
    await prisma.deliveryProof.deleteMany({ where: { orderId: O.compCompleted } });
    await prisma.deliveryProof.create({
      data: {
        orderId: O.compCompleted,
        type: 'photo',
        fileName: 'proof.jpg',
        filePath: '/seed/demo/proof.jpg',
        mimeType: 'image/jpeg',
        notes: 'Seed delivery proof',
        capturedBy: users.provider_operator.id,
      },
    });

    await prisma.commission.deleteMany({ where: { orderId: O.compCompleted } });
    await prisma.commission.create({
      data: {
        orderId: O.compCompleted,
        providerId: provider.id,
        orderTotal: 790,
        rate: 0.15,
        amount: 118.5,
        currency: 'SAR',
      },
    });

    await prisma.order.upsert({
      where: { id: O.indCompleted },
      update: {
        sourceType: 'individual',
        requesterId: users.individual_customer.id,
        companyId: null,
        serviceTypeId: stSmallId,
        vehicleTypeId: vId,
        status: 'completed',
        orderNumber: 'GT-IND-DONE',
        estimatedPrice: 90,
        finalPrice: 85,
        completedAt,
        cancelReason: null,
        deletedAt: null,
        createdBy: users.individual_customer.id,
      },
      create: {
        id: O.indCompleted,
        orderNumber: 'GT-IND-DONE',
        sourceType: 'individual',
        requesterId: users.individual_customer.id,
        serviceTypeId: stSmallId,
        vehicleTypeId: vId,
        status: 'completed',
        estimatedPrice: 90,
        finalPrice: 85,
        completedAt,
        createdBy: users.individual_customer.id,
      },
    });
    await syncOrderLocations(O.indCompleted, locPair('Jeddah', 'Corniche', 'Al Rawdah'));
    await syncOrderStatusHistory(O.indCompleted, [
      { fromStatus: null, toStatus: 'completed', changedBy: users.individual_customer.id, notes: 'seed' },
    ]);

    if (indCustomerRow) {
      await prisma.customerReview.deleteMany({ where: { orderId: O.indCompleted } });
      await prisma.customerReview.create({
        data: {
          individualCustomerId: indCustomerRow.id,
          providerId: provider.id,
          orderId: O.indCompleted,
          rating: 5,
          comment: 'Great seed delivery — very professional.',
        },
      });
    }

    await prisma.order.upsert({
      where: { id: O.compCanceled },
      update: { ...companyBase, status: 'canceled', orderNumber: 'GT-COMP-CANCEL', estimatedPrice: 300, finalPrice: null, completedAt: null, cancelReason: 'Customer changed plans — seed', deletedAt: null },
      create: { id: O.compCanceled, orderNumber: 'GT-COMP-CANCEL', ...companyBase, status: 'canceled', estimatedPrice: 300, cancelReason: 'Customer changed plans — seed' },
    });
    await syncOrderLocations(O.compCanceled, locPair());
    await syncOrderStatusHistory(O.compCanceled, [
      { fromStatus: null, toStatus: 'draft', changedBy: users.employee.id, notes: 'seed' },
      { fromStatus: 'draft', toStatus: 'canceled', changedBy: users.company_admin.id, notes: 'seed' },
    ]);
    await prisma.cancellation.deleteMany({ where: { orderId: O.compCanceled } });
    await prisma.cancellation.create({
      data: {
        orderId: O.compCanceled,
        reason: 'Plans changed — no longer need transport',
        canceledBy: users.company_admin.id,
        fee: 0,
        feeCurrency: 'SAR',
      },
    });

    // --- Invoices & payments (finance / company invoices) ---
    await prisma.invoice.upsert({
      where: { id: O.invDraft },
      update: { status: 'draft', companyId: company.id, orderId: null, subtotal: 1000, taxAmount: 150, totalAmount: 1150, paidAmount: 0 },
      create: {
        id: O.invDraft,
        invoiceNumber: 'GT-INV-DRAFT-001',
        companyId: company.id,
        orderId: null,
        subtotal: 1000,
        taxAmount: 150,
        totalAmount: 1150,
        paidAmount: 0,
        currency: 'SAR',
        status: 'draft',
        notes: 'Seed draft invoice (no order)',
        createdBy: users.finance_admin.id,
      },
    });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: O.invDraft } });
    await prisma.invoiceItem.create({
      data: { invoiceId: O.invDraft, description: 'Platform services (draft)', quantity: 1, unitPrice: 1000, amount: 1000 },
    });

    await prisma.invoice.upsert({
      where: { id: O.inv018 },
      update: {
        orderId: O.compCompleted,
        companyId: company.id,
        status: 'paid',
        subtotal: 790,
        taxAmount: 118.5,
        totalAmount: 908.5,
        paidAmount: 908.5,
        issuedAt: completedAt,
      },
      create: {
        id: O.inv018,
        invoiceNumber: 'GT-INV-COMP-018',
        orderId: O.compCompleted,
        companyId: company.id,
        subtotal: 790,
        taxAmount: 118.5,
        totalAmount: 908.5,
        paidAmount: 908.5,
        currency: 'SAR',
        status: 'paid',
        issuedAt: completedAt,
        dueDate: new Date(completedAt.getTime() + 30 * 86400000),
        createdBy: users.finance_admin.id,
      },
    });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: O.inv018 } });
    await prisma.invoiceItem.create({
      data: { invoiceId: O.inv018, description: 'Completed move — GT-COMP-DONE', quantity: 1, unitPrice: 790, amount: 790 },
    });
    await prisma.payment.deleteMany({ where: { invoiceId: O.inv018 } });
    await prisma.payment.create({
      data: {
        invoiceId: O.inv018,
        amount: 908.5,
        currency: 'SAR',
        method: 'bank_transfer',
        status: 'completed',
        transactionRef: 'SEED-TXN-018',
        paidAt: completedAt,
        createdBy: users.finance_admin.id,
        notes: 'Seed full payment',
      },
    });

    await prisma.invoice.upsert({
      where: { id: O.inv019 },
      update: {
        orderId: O.indCompleted,
        companyId: null,
        providerId: provider.id,
        status: 'partially_paid',
        subtotal: 85,
        taxAmount: 12.75,
        totalAmount: 97.75,
        paidAmount: 50,
        issuedAt: completedAt,
      },
      create: {
        id: O.inv019,
        invoiceNumber: 'GT-INV-IND-019',
        orderId: O.indCompleted,
        companyId: null,
        providerId: provider.id,
        subtotal: 85,
        taxAmount: 12.75,
        totalAmount: 97.75,
        paidAmount: 50,
        currency: 'SAR',
        status: 'partially_paid',
        issuedAt: completedAt,
        createdBy: users.finance_admin.id,
      },
    });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: O.inv019 } });
    await prisma.invoiceItem.create({
      data: { invoiceId: O.inv019, description: 'Small item delivery', quantity: 1, unitPrice: 85, amount: 85 },
    });
    await prisma.payment.deleteMany({ where: { invoiceId: O.inv019 } });
    await prisma.payment.create({
      data: {
        invoiceId: O.inv019,
        amount: 50,
        currency: 'SAR',
        method: 'online',
        status: 'completed',
        transactionRef: 'SEED-TXN-019-P1',
        paidAt: completedAt,
        createdBy: users.finance_admin.id,
      },
    });

    // --- Settlement + earnings snapshot (admin / provider finance views) ---
    const periodStart = new Date(completedAt.getFullYear(), completedAt.getMonth(), 1);
    const periodEnd = new Date(completedAt.getFullYear(), completedAt.getMonth() + 1, 0, 23, 59, 59);
    await prisma.settlement.upsert({
      where: { id: O.settle01 },
      update: { status: 'pending', amount: 500 },
      create: {
        id: O.settle01,
        providerId: provider.id,
        amount: 500,
        currency: 'SAR',
        periodStart,
        periodEnd,
        status: 'pending',
        reference: 'SEED-SETTLE-001',
        notes: 'Pending settlement — verify provider finance UI',
        createdBy: users.finance_admin.id,
      },
    });

    await prisma.earningsReport.upsert({
      where: { id: O.earn01 },
      update: {
        status: 'ready',
        totalGross: 25000,
        totalNet: 21250,
        totalCommission: 3750,
        generatedAt: completedAt,
      },
      create: {
        id: O.earn01,
        subjectType: 'platform',
        subjectId: null,
        periodStart,
        periodEnd,
        currency: 'SAR',
        totalGross: 25000,
        totalNet: 21250,
        totalCommission: 3750,
        status: 'ready',
        generatedAt: completedAt,
        meta: { seed: true, note: 'Admin analytics / revenue snapshot' },
        createdBy: users.finance_admin.id,
      },
    });

    // --- Tickets + comments (support) ---
    const issueOrder = await prisma.issueType.findUnique({ where: { code: 'order_issue' } });
    const issuePay = await prisma.issueType.findUnique({ where: { code: 'payment_issue' } });
    await prisma.ticket.upsert({
      where: { id: O.tickOpen },
      update: { status: 'open' },
      create: {
        id: O.tickOpen,
        ticketNumber: 'GT-TKT-OPEN-001',
        userId: users.company_admin.id,
        issueTypeId: issueOrder?.id ?? null,
        orderId: O.compPublished,
        subject: 'Question about offers on GT-COMP-PUBLISH',
        description: 'Seed ticket — open state for company/support dashboards.',
        status: 'open',
        priority: 'medium',
      },
    });
    await prisma.ticket.upsert({
      where: { id: O.tickProg },
      update: { status: 'in_progress', assignedTo: users.support_admin.id },
      create: {
        id: O.tickProg,
        ticketNumber: 'GT-TKT-PROG-001',
        userId: users.individual_customer.id,
        issueTypeId: issuePay?.id ?? null,
        orderId: O.indPublished,
        subject: 'Payment not showing on demo order',
        description: 'Seed ticket — in progress, assigned to support.',
        status: 'in_progress',
        priority: 'high',
        assignedTo: users.support_admin.id,
      },
    });
    await prisma.ticketComment.deleteMany({ where: { ticketId: O.tickProg } });
    await prisma.ticketComment.create({
      data: {
        ticketId: O.tickProg,
        userId: users.support_admin.id,
        body: 'Internal note: checking invoice linkage — seed.',
        isInternal: true,
      },
    });
    await prisma.ticket.upsert({
      where: { id: O.tickDone },
      update: { status: 'resolved', resolvedAt: completedAt },
      create: {
        id: O.tickDone,
        ticketNumber: 'GT-TKT-RES-001',
        userId: users.individual_customer.id,
        issueTypeId: issueOrder?.id ?? null,
        subject: 'Resolved inquiry (seed)',
        description: 'Seed ticket — resolved with public reply.',
        status: 'resolved',
        priority: 'low',
        resolvedAt: completedAt,
      },
    });
    await prisma.ticketComment.deleteMany({ where: { ticketId: O.tickDone } });
    await prisma.ticketComment.create({
      data: {
        ticketId: O.tickDone,
        userId: users.support_admin.id,
        body: 'Thanks — this was a demo ticket. Closing from seed.',
        isInternal: false,
      },
    });

    // --- Notifications + audit sample (idempotent titles) ---
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { title: 'New offer on GT-COMP-PUBLISH' },
          { title: 'Assignment update' },
          { title: 'Order published' },
        ],
      },
    });
    await prisma.notification.createMany({
      data: [
        {
          userId: users.company_admin.id,
          title: 'New offer on GT-COMP-PUBLISH',
          body: 'A provider submitted an offer — check Offers.',
          type: 'info',
          isRead: false,
          data: { orderId: O.compPublished },
        },
        {
          userId: users.provider_admin.id,
          title: 'Assignment update',
          body: 'Driver accepted assignment for GT-COMP-ASSIGNED.',
          type: 'success',
          isRead: true,
          readAt: new Date(),
          data: { orderId: O.compAssigned },
        },
        {
          userId: users.individual_customer.id,
          title: 'Order published',
          body: 'Your order GT-DEMO-IND-PUB is live for offers.',
          type: 'info',
          isRead: false,
          data: { orderId: O.indPublished },
        },
      ],
    });

    await prisma.auditLog.deleteMany({
      where: { action: 'seed_dashboard', entityId: O.compCompleted },
    });
    await prisma.auditLog.create({
      data: {
        userId: users.super_admin.id,
        action: 'seed_dashboard',
        entityType: 'order',
        entityId: O.compCompleted,
        newData: { note: 'Full dashboard seed run' },
        ipAddress: '127.0.0.1',
        userAgent: 'prisma-seed',
      },
    });

    await prisma.fileAsset.upsert({
      where: { id: 'seed-file-order-draft' },
      update: {
        entityType: 'order',
        entityId: O.compDraft,
        filePath: '/seed/demo/attachment.pdf',
      },
      create: {
        id: 'seed-file-order-draft',
        category: 'order_attachment',
        originalName: 'seed-list.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        filePath: '/seed/demo/attachment.pdf',
        entityType: 'order',
        entityId: O.compDraft,
        uploadedBy: users.employee.id,
      },
    });

    console.log('  ✓ Demo orders (all key statuses), offers, assignments, tracking');
    console.log('  ✓ Invoices, payments, commission, settlement, earnings report');
    console.log('  ✓ Tickets, notifications, audit log, file asset\n');
  }

  console.log('✅ Seed completed successfully!\n');
  console.log('— EN — Test logins:');
  console.log('  super_admin / ops / support / finance: *@goodstransfer.com / Admin@123');
  console.log('  company_admin, employee, manager, provider, operator, customer, driver: *@test.com / Test@123');
  console.log('\n— AR — جدول التحقق السريع من اللوحات:');
  console.log('  شركة: GT-COMP-* (مسودة، مرسل، موافقة معلقة، مرفوض، منشور للعروض، عرض مقبول، مُسند، قيد النقل، مكتمل، ملغى) + فواتير + تذكرة مفتوحة');
  console.log('  مزود: عروض، مهام سائق (GT-COMP-ASSIGNED / TRANSIT)، مستندات، مركبة، عامل، مناطق، محفظة، تسوية معلقة');
  console.log('  أدمن: فواتير، مدفوعات، تقرير أرباح (earnings)، سجلات تدقيق، تذاكر الدعم');
  console.log('  عميل: GT-DEMO-IND-PUB (عروض)، GT-IND-DONE (مكتمل + تقييم)');
  console.log('  سائق: مرتبط بـ test-driver-001 — مهام accepted / in_progress\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
