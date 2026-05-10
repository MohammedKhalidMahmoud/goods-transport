const { AppError } = require('../utils/AppError');

/**
 * Express middleware factory for Joi validation.
 * Validates req.body, req.query, or req.params based on the schema keys.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), controller.login);
 *
 * Where loginSchema is:
 *   { body: Joi.object({ ... }) }
 */
function validate(schema) {
  return (req, _res, next) => {
    const errors = [];

    for (const source of ['body', 'query', 'params']) {
      if (!schema[source]) continue;

      const { error: validationError, value } = schema[source].validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
      });

      if (validationError) {
        const fieldErrors = validationError.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
        }));
        errors.push(...fieldErrors);
      } else {
        req[source] = value;
      }
    }

    if (errors.length > 0) {
      throw AppError.badRequest('Validation failed', errors);
    }

    next();
  };
}

module.exports = { validate };
