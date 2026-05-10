/**
 * @typedef {object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string|null} phone
 * @property {string} status
 * @property {string[]} roles
 * @property {string[]} permissions
 * @property {string|null} companyId
 * @property {string|null} providerId
 * @property {string|null} branchId
 */

/**
 * @typedef {object} TenantScope
 * @property {'global'|'company'|'provider'|'self'|'assignment'} type
 * @property {string|null} id        Primary scope id (companyId, providerId, or userId for self/assignment)
 * @property {string|null} branchId
 * @property {string|null} companyId
 * @property {string|null} providerId
 */

/**
 * Express request after `authenticate` and optional `resolveTenantScope`.
 * @typedef {import('express').Request & { user?: AuthUser, tenantScope?: TenantScope }} AuthedRequest
 */

module.exports = {};
