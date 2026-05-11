const masterDataController = require('../master-data/master-data.controller');
const appSettingsService = require('./app-settings.service');
const { success } = require('../../utils/response');

const getAppSettingsTab = async (req, res, next) => {
  try {
    return success(res, await appSettingsService.getAppSettingsTab());
  } catch (error) {
    return next(error);
  }
};

const getHelpSupportTab = async (req, res, next) => {
  try {
    return success(res, await appSettingsService.getHelpSupportTab());
  } catch (error) {
    return next(error);
  }
};

const getPrivacyPolicyTab = async (req, res, next) => {
  try {
    return success(res, await appSettingsService.getPrivacyPolicyTab());
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAppSettingsTab,
  getHelpSupportTab,
  getPrivacyPolicyTab,
  list: masterDataController.list('appSetting', 'OK'),
  get: masterDataController.get('appSetting'),
  create: masterDataController.create('appSetting'),
  update: masterDataController.update('appSetting'),
  remove: masterDataController.remove('appSetting'),
};
