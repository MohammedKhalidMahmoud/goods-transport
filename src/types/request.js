/**
 * @typedef {object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string|null} phone
 * @property {string} status
 * @property {string[]} roles
 * @property {string[]} permissions
 * @property {string|null} providerId
 */

/**
 * @typedef {object} TenantScope
 * @property {'global'|'provider'|'self'|'assignment'} type
 * @property {string|null} id        Primary scope id (providerId or userId for self/assignment)
 * @property {string|null} providerId
 */

/**
 * Express request after `authenticate` and optional `resolveTenantScope`.
 * @typedef {import('express').Request & { user?: AuthUser, tenantScope?: TenantScope }} AuthedRequest
 */

module.exports = {};
