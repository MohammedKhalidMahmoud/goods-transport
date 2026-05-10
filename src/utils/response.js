/**
 * Standard API response wrapper.
 * All responses follow the envelope: { success, data, message, meta }
 */

function success(res, data, message = 'Operation successful', statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function paginated(res, data, pagination, message = 'Records retrieved successfully') {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data,
    message,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      timestamp: new Date().toISOString(),
    },
  });
}

function error(res, message, statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = null) {
  const body = {
    success: false,
    data: null,
    message,
    meta: {
      errorCode,
      timestamp: new Date().toISOString(),
    },
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, created, noContent, paginated, error };
