const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const masterDataRoutes = require('../modules/master-data/master-data.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const operationsRoutes = require('../modules/operations/operations.routes');
const companiesRoutes = require('../modules/companies/companies.routes');
const providersRoutes = require('../modules/providers/providers.routes');
const systemRoutes = require('../modules/system/system.routes');

const router = Router();

router.use('/auth', authRoutes);
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
