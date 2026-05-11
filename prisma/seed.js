const bcrypt = require('bcryptjs');
const { prisma } = require('../src/lib/prisma');

const password = 'Test@123';

const permissions = [
  ['auth:login', 'Login', 'auth', 'login'],
  ['auth:logout', 'Logout', 'auth', 'logout'],
  ['auth:refresh', 'Refresh Token', 'auth', 'refresh'],
  ['users:read', 'Read Users', 'users', 'read'],
  ['users:create', 'Create Users', 'users', 'create'],
  ['users:update', 'Update Users', 'users', 'update'],
  ['users:delete', 'Delete Users', 'users', 'delete'],
  ['master_data:read', 'Read Master Data', 'master_data', 'read'],
  ['master_data:manage', 'Manage Master Data', 'master_data', 'manage'],
  ['providers:read', 'Read Providers', 'providers', 'read'],
  ['providers:create', 'Create Providers', 'providers', 'create'],
  ['providers:update', 'Update Providers', 'providers', 'update'],
  ['providers:delete', 'Delete Providers', 'providers', 'delete'],
  ['orders:read', 'Read Orders', 'orders', 'read'],
  ['orders:create', 'Create Orders', 'orders', 'create'],
  ['orders:update', 'Update Orders', 'orders', 'update'],
  ['orders:cancel', 'Cancel Orders', 'orders', 'cancel'],
  ['orders:submit', 'Submit Orders', 'orders', 'submit'],
  ['offers:read', 'Read Offers', 'offers', 'read'],
  ['offers:create', 'Create Offers', 'offers', 'create'],
  ['offers:accept', 'Accept Offers', 'offers', 'accept'],
  ['offers:reject', 'Reject Offers', 'offers', 'reject'],
  ['offers:withdraw', 'Withdraw Offers', 'offers', 'withdraw'],
  ['assignments:read', 'Read Assignments', 'assignments', 'read'],
  ['assignments:create', 'Create Assignments', 'assignments', 'create'],
  ['assignments:update_status', 'Update Assignment Status', 'assignments', 'update_status'],
  ['invoices:read', 'Read Invoices', 'invoices', 'read'],
  ['invoices:create', 'Create Invoices', 'invoices', 'create'],
  ['payments:read', 'Read Payments', 'payments', 'read'],
  ['payments:create', 'Create Payments', 'payments', 'create'],
  ['settlements:manage', 'Manage Settlements', 'settlements', 'manage'],
  ['tickets:read', 'Read Tickets', 'tickets', 'read'],
  ['tickets:create', 'Create Tickets', 'tickets', 'create'],
  ['tickets:update', 'Update Tickets', 'tickets', 'update'],
  ['tickets:resolve', 'Resolve Tickets', 'tickets', 'resolve'],
  ['notifications:read_own', 'Read Own Notifications', 'notifications', 'read_own'],
  ['analytics:read', 'Read Analytics', 'analytics', 'read'],
];

const roles = [
  { code: 'dashboard_admin', name: 'Dashboard Admin', scopeType: 'global', isSystem: true },
  { code: 'operations_admin', name: 'Operations Admin', scopeType: 'global', isSystem: true },
  { code: 'support_admin', name: 'Support Admin', scopeType: 'global', isSystem: true },
];

async function upsertUser({ id, email, phone, firstName, lastName, userType, appRole, roleId, myAdmin, jobTitle, hash }) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      phone,
      firstName,
      lastName,
      userType,
      appRole,
      status: 'ACTIVE',
    },
    create: {
      id,
      email,
      phone,
      passwordHash: hash,
      firstName,
      lastName,
      userType,
      appRole,
      status: 'ACTIVE',
    },
  });

  if (userType === 'DASHBOARD' && roleId) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
    await prisma.dashboardUserProfile.upsert({
      where: { userId: user.id },
      update: { roleId, myAdmin: Boolean(myAdmin), jobTitle: jobTitle || null },
      create: { userId: user.id, roleId, myAdmin: Boolean(myAdmin), jobTitle: jobTitle || null },
    });
  }

  return user;
}

async function main() {
  const hash = await bcrypt.hash(password, 12);

  const permissionRows = {};
  for (const [code, name, module, action] of permissions) {
    permissionRows[code] = await prisma.permission.upsert({
      where: { code },
      update: { name, module, action },
      create: { code, name, module, action },
    });
  }

  const roleRows = {};
  for (const role of roles) {
    roleRows[role.code] = await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: roleRows.dashboard_admin.id } });
  for (const permission of Object.values(permissionRows)) {
    await prisma.rolePermission.create({ data: { roleId: roleRows.dashboard_admin.id, permissionId: permission.id } });
  }

  const admin = await upsertUser({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@test.com',
    phone: '+966500000001',
    firstName: 'Dashboard',
    lastName: 'Admin',
    userType: 'DASHBOARD',
    appRole: null,
    roleId: roleRows.dashboard_admin.id,
    myAdmin: true,
    jobTitle: 'Administrator',
    hash,
  });

  const customer = await upsertUser({
    id: '00000000-0000-4000-8000-000000000002',
    email: 'customer@test.com',
    phone: '+966500000010',
    firstName: 'Test',
    lastName: 'Customer',
    userType: 'APP',
    appRole: 'CUSTOMER',
    hash,
  });

  const providerUser = await upsertUser({
    id: '00000000-0000-4000-8000-000000000003',
    email: 'provider@test.com',
    phone: '+966500000020',
    firstName: 'Test',
    lastName: 'Provider',
    userType: 'APP',
    appRole: 'PROVIDER',
    hash,
  });

  await prisma.providerProfile.upsert({
    where: { userId: providerUser.id },
    update: { businessName: 'Provider Demo', logoUrl: null },
    create: { userId: providerUser.id, businessName: 'Provider Demo', logoUrl: null },
  });

  const service = await prisma.service.upsert({
    where: { code: 'home_moving' },
    update: { name: 'Home Moving', isActive: true },
    create: { code: 'home_moving', name: 'Home Moving', isActive: true },
  });

  await prisma.city.upsert({
    where: { code: 'riyadh' },
    update: { name: 'Riyadh', nameAr: 'الرياض', isActive: true },
    create: { code: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', isActive: true },
  });

  await prisma.pricingSetting.upsert({
    where: { serviceCode: service.code },
    update: { baseFare: 100, perKmRate: 5, perWorkerRate: 40, currency: 'SAR', isActive: true },
    create: { serviceCode: service.code, baseFare: 100, perKmRate: 5, perWorkerRate: 40, currency: 'SAR', isActive: true },
  });

  const appSettings = [
    ['app_name', 'Goods Transport', 'app'],
    ['default_language', 'en', 'app'],
    ['currency', 'SAR', 'app'],
    ['help_title', 'Help & Support', 'help_support'],
    ['help_description', 'Contact support if you need help with an order or account issue.', 'help_support'],
    ['support_email', 'support@test.com', 'help_support'],
    ['support_phone', '+966500000000', 'help_support'],
    ['support_whatsapp', '+966500000000', 'help_support'],
    ['privacy_title', 'Privacy Policy', 'privacy_policy'],
    ['privacy_content', 'We collect only the information required to provide goods transport services and support your orders.', 'privacy_policy'],
    ['privacy_version', '1.0', 'privacy_policy'],
  ];

  for (const [key, value, group] of appSettings) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value, group },
      create: { key, value, group },
    });
  }

  const provider = await prisma.provider.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    update: { name: 'Demo Provider', contactEmail: 'provider-org@test.com', contactPhone: '+966500000040', status: 'active' },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      name: 'Demo Provider',
      contactEmail: 'provider-org@test.com',
      contactPhone: '+966500000040',
      status: 'active',
      createdBy: admin.id,
    },
  });

  await prisma.providerWallet.upsert({
    where: { providerId: provider.id },
    update: {},
    create: { providerId: provider.id },
  });

  const driver = await prisma.providerDriver.upsert({
    where: { id: '00000000-0000-4000-8000-000000000302' },
    update: { providerId: provider.id, name: 'Demo Driver', phone: '+966500000050' },
    create: { id: '00000000-0000-4000-8000-000000000302', providerId: provider.id, name: 'Demo Driver', phone: '+966500000050' },
  });

  const order = await prisma.order.upsert({
    where: { orderNumber: 'GT-DEMO-001' },
    update: { status: 'published_for_offers', requesterId: customer.id, serviceId: service.id },
    create: {
      orderNumber: 'GT-DEMO-001',
      requesterId: customer.id,
      serviceId: service.id,
      status: 'published_for_offers',
      workerCount: 1,
      estimatedPrice: 250,
      createdBy: customer.id,
    },
  });

  await prisma.orderLocation.deleteMany({ where: { orderId: order.id } });
  await prisma.orderLocation.createMany({
    data: [
      { orderId: order.id, type: 'pickup', addressLine: 'Pickup address', city: 'Riyadh' },
      { orderId: order.id, type: 'dropoff', addressLine: 'Dropoff address', city: 'Riyadh' },
    ],
  });

  await prisma.offer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000401' },
    update: { orderId: order.id, providerId: provider.id, price: 240, status: 'pending' },
    create: { id: '00000000-0000-4000-8000-000000000401', orderId: order.id, providerId: provider.id, price: 240, status: 'pending', createdBy: providerUser.id },
  });

  await prisma.assignment.upsert({
    where: { id: '00000000-0000-4000-8000-000000000402' },
    update: { orderId: order.id, providerId: provider.id, driverId: driver.id, status: 'accepted' },
    create: { id: '00000000-0000-4000-8000-000000000402', orderId: order.id, providerId: provider.id, driverId: driver.id, status: 'accepted', assignedBy: admin.id },
  });

  await prisma.issueType.upsert({
    where: { code: 'general' },
    update: { name: 'General', isActive: true },
    create: { code: 'general', name: 'General', isActive: true },
  });

  console.log('Seed completed');
  console.log(`Demo users use password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

