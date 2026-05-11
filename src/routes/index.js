const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const authAdminRoutes = require('../modules/auth/auth.admin.routes');
const masterDataRoutes = require('../modules/master-data/master-data.routes');
const masterDataAdminRoutes = require('../modules/master-data/master-data.admin.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const ordersAdminRoutes = require('../modules/orders/orders.admin.routes');
const operationsRoutes = require('../modules/operations/operations.routes');
const operationsAdminRoutes = require('../modules/operations/operations.admin.routes');
const companiesRoutes = require('../modules/companies/companies.routes');
const companiesAdminRoutes = require('../modules/companies/companies.admin.routes');
const providersRoutes = require('../modules/providers/providers.routes');
const providersAdminRoutes = require('../modules/providers/providers.admin.routes');
const systemRoutes = require('../modules/system/system.routes');
const systemAdminRoutes = require('../modules/system/system.admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard/auth', authAdminRoutes);
router.use('/dashboard', masterDataAdminRoutes);
router.use('/dashboard', ordersAdminRoutes);
router.use('/dashboard', operationsAdminRoutes);
router.use('/dashboard', companiesAdminRoutes);
router.use('/dashboard', providersAdminRoutes);
router.use('/dashboard', systemAdminRoutes);
router.use(masterDataRoutes);
router.use(ordersRoutes);
router.use(operationsRoutes);
router.use(companiesRoutes);
router.use(providersRoutes);
router.use(systemRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: 'API is running',
  });
});

module.exports = router;
