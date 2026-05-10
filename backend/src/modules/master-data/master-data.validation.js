const Joi = require('joi');

const idParam = Joi.object({ id: Joi.string().uuid().required() });

const categoryBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  icon: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const serviceTypeBody = Joi.object({
  serviceCategoryId: Joi.string().uuid().required(),
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const vehicleTypeBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  capacity: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const cityBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  isActive: Joi.boolean(),
});

const zoneBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  isActive: Joi.boolean(),
});

const areaBody = Joi.object({
  cityId: Joi.string().uuid().required(),
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  zoneId: Joi.string().uuid().allow(null),
  isActive: Joi.boolean(),
});

const branchBody = Joi.object({
  providerId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  latitude: Joi.number(),
  longitude: Joi.number(),
  isActive: Joi.boolean(),
});

const pricingBody = Joi.object({
  serviceTypeCode: Joi.string().required(),
  baseFare: Joi.number(),
  perKmRate: Joi.number(),
  perWorkerRate: Joi.number(),
  floorRate: Joi.number(),
  fragileMultiplier: Joi.number(),
  currency: Joi.string(),
  isActive: Joi.boolean(),
});

const appSettingBody = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().required(),
  group: Joi.string(),
});

module.exports = {
  idParam,
  categoryBody,
  serviceTypeBody,
  vehicleTypeBody,
  cityBody,
  zoneBody,
  areaBody,
  branchBody,
  pricingBody,
  appSettingBody,
};
