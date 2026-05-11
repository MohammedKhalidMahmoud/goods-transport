const masterDataService = require('../master-data/master-data.service');
const repository = require('./app-settings.repository');

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

function rowsToObject(rows) {
  return rows.reduce((result, row) => {
    result[row.key] = parseValue(row.value);
    return result;
  }, {});
}

async function getSettingsGroup(group) {
  return rowsToObject(await repository.findByGroup(group));
}

async function getAppSettingsTab() {
  return getSettingsGroup('app');
}

async function getHelpSupportTab() {
  return getSettingsGroup('help_support');
}

async function getPrivacyPolicyTab() {
  return getSettingsGroup('privacy_policy');
}

module.exports = {
  ...masterDataService,
  getAppSettingsTab,
  getHelpSupportTab,
  getPrivacyPolicyTab,
};
