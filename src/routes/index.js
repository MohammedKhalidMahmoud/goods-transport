const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const authAdminRoutes = require('../modules/auth/auth.admin.routes');
const servicesRoutes = require('../modules/services/services.routes');
const servicesAdminRoutes = require('../modules/services/services.admin.routes');
const citiesRoutes = require('../modules/cities/cities.routes');
const citiesAdminRoutes = require('../modules/cities/cities.admin.routes');
const pricingSettingsRoutes = require('../modules/pricing-settings/pricing-settings.routes');
const pricingSettingsAdminRoutes = require('../modules/pricing-settings/pricing-settings.admin.routes');
const appSettingsRoutes = require('../modules/app-settings/app-settings.routes');
const appSettingsAdminRoutes = require('../modules/app-settings/app-settings.admin.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const ordersAdminRoutes = require('../modules/orders/orders.admin.routes');
const offersRoutes = require('../modules/offers/offers.routes');
const offersAdminRoutes = require('../modules/offers/offers.admin.routes');
const assignmentsRoutes = require('../modules/assignments/assignments.routes');
const assignmentsAdminRoutes = require('../modules/assignments/assignments.admin.routes');
const trackingRoutes = require('../modules/tracking/tracking.routes');
const trackingAdminRoutes = require('../modules/tracking/tracking.admin.routes');
const deliveryProofRoutes = require('../modules/delivery-proof/delivery-proof.routes');
const deliveryProofAdminRoutes = require('../modules/delivery-proof/delivery-proof.admin.routes');
const providersRoutes = require('../modules/providers/providers.routes');
const providersAdminRoutes = require('../modules/providers/providers.admin.routes');
const invoicesRoutes = require('../modules/invoices/invoices.routes');
const invoicesAdminRoutes = require('../modules/invoices/invoices.admin.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');
const paymentsAdminRoutes = require('../modules/payments/payments.admin.routes');
const commissionsRoutes = require('../modules/commissions/commissions.routes');
const commissionsAdminRoutes = require('../modules/commissions/commissions.admin.routes');
const settlementsRoutes = require('../modules/settlements/settlements.routes');
const settlementsAdminRoutes = require('../modules/settlements/settlements.admin.routes');
const earningsRoutes = require('../modules/earnings/earnings.routes');
const earningsAdminRoutes = require('../modules/earnings/earnings.admin.routes');
const usersAdminRoutes = require('../modules/users/users.admin.routes');
const rbacAdminRoutes = require('../modules/rbac/rbac.admin.routes');
const ticketsRoutes = require('../modules/tickets/tickets.routes');
const ticketsAdminRoutes = require('../modules/tickets/tickets.admin.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const notificationsAdminRoutes = require('../modules/notifications/notifications.admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard/auth', authAdminRoutes);
router.use('/dashboard', servicesAdminRoutes);
router.use('/dashboard', citiesAdminRoutes);
router.use('/dashboard', pricingSettingsAdminRoutes);
router.use('/dashboard', appSettingsAdminRoutes);
router.use('/dashboard', ordersAdminRoutes);
router.use('/dashboard', offersAdminRoutes);
router.use('/dashboard', assignmentsAdminRoutes);
router.use('/dashboard', trackingAdminRoutes);
router.use('/dashboard', deliveryProofAdminRoutes);
router.use('/dashboard', providersAdminRoutes);
router.use('/dashboard', invoicesAdminRoutes);
router.use('/dashboard', paymentsAdminRoutes);
router.use('/dashboard', commissionsAdminRoutes);
router.use('/dashboard', settlementsAdminRoutes);
router.use('/dashboard', earningsAdminRoutes);
router.use('/dashboard', usersAdminRoutes);
router.use('/dashboard', rbacAdminRoutes);
router.use('/dashboard', ticketsAdminRoutes);
router.use('/dashboard', notificationsAdminRoutes);
router.use(servicesRoutes);
router.use(citiesRoutes);
router.use(pricingSettingsRoutes);
router.use(appSettingsRoutes);
router.use(ordersRoutes);
router.use(offersRoutes);
router.use(assignmentsRoutes);
router.use(trackingRoutes);
router.use(deliveryProofRoutes);
router.use(providersRoutes);
router.use(invoicesRoutes);
router.use(paymentsRoutes);
router.use(commissionsRoutes);
router.use(settlementsRoutes);
router.use(earningsRoutes);
router.use(ticketsRoutes);
router.use(notificationsRoutes);

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
