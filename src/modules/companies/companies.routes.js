const { Router } = require('express');
const Joi = require('joi');
const companiesController = require('./companies.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

const companySchema = { body: Joi.object({ name: Joi.string().required(), nameAr: Joi.string().allow('', null), contactEmail: Joi.string().email().required(), contactPhone: Joi.string().required(), address: Joi.string().allow('', null), taxNumber: Joi.string().allow('', null), industry: Joi.string().allow('', null) }) };
const companyUserSchema = { body: Joi.object({ companyId: Joi.string().uuid().required(), userId: Joi.string().uuid().required(), role: Joi.string().required() }) };
const billingProfileSchema = { body: Joi.object({ companyId: Joi.string().uuid().required(), billingName: Joi.string().required(), billingEmail: Joi.string().email().required(), billingAddress: Joi.string().allow('', null), taxNumber: Joi.string().allow('', null), paymentTermsDays: Joi.number().integer(), creditLimit: Joi.number(), currency: Joi.string(), isDefault: Joi.boolean() }) };
const approvalRuleSchema = { body: Joi.object({ companyId: Joi.string().uuid().required(), name: Joi.string().required(), serviceTypeCode: Joi.string().allow('', null), minAmount: Joi.number().allow(null), maxAmount: Joi.number().allow(null), approverRole: Joi.string().required(), level: Joi.number().integer() }) };
const approveSchema = { body: Joi.object({ notes: Joi.string().allow('', null) }) };
const rejectSchema = { body: Joi.object({ notes: Joi.string().required() }) };

router.get('/companies', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_READ, PERMISSIONS.COMPANIES_READ_OWN), companiesController.listCompanies);
router.post('/companies', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_CREATE), validate(companySchema), companiesController.createCompany);
router.get('/companies/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_READ, PERMISSIONS.COMPANIES_READ_OWN), companiesController.getCompany);
router.patch('/companies/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_UPDATE, PERMISSIONS.COMPANIES_UPDATE_OWN), companiesController.updateCompany);
router.delete('/companies/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_DELETE), companiesController.deleteCompany);

router.get('/company-users', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS, PERMISSIONS.USERS_READ), companiesController.listCompanyUsers);
router.post('/company-users', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), validate(companyUserSchema), companiesController.createCompanyUser);
router.get('/company-users/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), companiesController.getCompanyUser);
router.patch('/company-users/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), companiesController.updateCompanyUser);
router.delete('/company-users/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), companiesController.deleteCompanyUser);

router.get('/company-billing-profiles', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN, PERMISSIONS.INVOICES_READ_COMPANY), companiesController.listBillingProfiles);
router.post('/company-billing-profiles', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_UPDATE_OWN, PERMISSIONS.COMPANIES_UPDATE), validate(billingProfileSchema), companiesController.createBillingProfile);
router.get('/company-billing-profiles/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN, PERMISSIONS.INVOICES_READ_COMPANY), companiesController.getBillingProfile);
router.patch('/company-billing-profiles/:id', ...tenant, authorizePermissions(PERMISSIONS.COMPANIES_UPDATE_OWN), companiesController.updateBillingProfile);

router.get('/approval-rules', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_READ), companiesController.listApprovalRules);
router.post('/approval-rules', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_APPROVE, PERMISSIONS.SETTINGS_MANAGE_COMPANY), validate(approvalRuleSchema), companiesController.createApprovalRule);
router.patch('/approval-rules/:id', ...tenant, authorizePermissions(PERMISSIONS.SETTINGS_MANAGE_COMPANY), companiesController.updateApprovalRule);
router.delete('/approval-rules/:id', ...tenant, authorizePermissions(PERMISSIONS.SETTINGS_MANAGE_COMPANY), companiesController.deleteApprovalRule);

router.get('/approvals', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_READ), companiesController.listApprovals);
router.get('/approvals/:id', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_READ), companiesController.getApproval);
router.post('/approvals/:id/approve', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_APPROVE), validate(approveSchema), companiesController.approveOrder);
router.post('/approvals/:id/reject', ...tenant, authorizePermissions(PERMISSIONS.APPROVALS_REJECT), validate(rejectSchema), companiesController.rejectOrder);

module.exports = router;
