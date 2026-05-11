const Joi = require('joi');

const idParam = Joi.object({ id: Joi.string().uuid().required() });

const serviceBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
});

const cityBody = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  nameAr: Joi.string().allow('', null),
  isActive: Joi.boolean(),
});

const pricingBody = Joi.object({
  serviceCode: Joi.string().required(),
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
  serviceBody,
  cityBody,
  pricingBody,
  appSettingBody,
};
