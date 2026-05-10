const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  SUPPORT_ADMIN: 'support_admin',
  FINANCE_ADMIN: 'finance_admin',
  COMPANY_ADMIN: 'company_admin',
  EMPLOYEE: 'employee',
  LINE_MANAGER: 'line_manager',
  PROVIDER_ADMIN: 'provider_admin',
  PROVIDER_OPERATOR: 'provider_operator',
  INDIVIDUAL_CUSTOMER: 'individual_customer',
  DELIVERY_DRIVER: 'delivery_driver',
};

const ROLE_SCOPE = {
  [ROLES.SUPER_ADMIN]: 'global',
  [ROLES.OPERATIONS_ADMIN]: 'global',
  [ROLES.SUPPORT_ADMIN]: 'global',
  [ROLES.FINANCE_ADMIN]: 'global',
  [ROLES.COMPANY_ADMIN]: 'company',
  [ROLES.EMPLOYEE]: 'company',
  [ROLES.LINE_MANAGER]: 'company',
  [ROLES.PROVIDER_ADMIN]: 'provider',
  [ROLES.PROVIDER_OPERATOR]: 'provider',
  [ROLES.INDIVIDUAL_CUSTOMER]: 'self',
  [ROLES.DELIVERY_DRIVER]: 'assignment',
};

const INTERNAL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.OPERATIONS_ADMIN,
  ROLES.SUPPORT_ADMIN,
  ROLES.FINANCE_ADMIN,
];

const COMPANY_ROLES = [
  ROLES.COMPANY_ADMIN,
  ROLES.EMPLOYEE,
  ROLES.LINE_MANAGER,
];

const PROVIDER_ROLES = [
  ROLES.PROVIDER_ADMIN,
  ROLES.PROVIDER_OPERATOR,
];

module.exports = { ROLES, ROLE_SCOPE, INTERNAL_ROLES, COMPANY_ROLES, PROVIDER_ROLES };
