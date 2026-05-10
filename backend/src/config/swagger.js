const swaggerJsdoc = require('swagger-jsdoc');
const { config } = require('./index');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Goods Transfer API',
    version: '1.0.0',
    description: 'Enterprise Logistics Platform — REST API Documentation',
    contact: {
      name: 'Goods Transfer Team',
    },
  },
  servers: [
    {
      url: `${config.appUrl}/api/v1`,
      description: config.env === 'production' ? 'Production' : 'Development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
    },
    parameters: {
      PageQuery: { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
      LimitQuery: { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      SortByQuery: { in: 'query', name: 'sortBy', schema: { type: 'string', description: 'Field name (alias sort)' } },
      SortOrderQuery: { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
      SearchQuery: { in: 'query', name: 'search', schema: { type: 'string' } },
      StatusQuery: { in: 'query', name: 'status', schema: { type: 'string' } },
      DateFromQuery: { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date-time' } },
      DateToQuery: { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date-time' } },
      IdPath: { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      OrderIdPath: { in: 'path', name: 'orderId', required: true, schema: { type: 'string', format: 'uuid' } },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation successful' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { type: 'object' } },
          message: { type: 'string' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 5 },
              hasNext: { type: 'boolean', example: true },
              hasPrev: { type: 'boolean', example: false },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data: { type: 'object', nullable: true, example: null },
          message: { type: 'string', example: 'An error occurred' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Email is required' },
              },
            },
          },
        },
      },
      PaginationQuery: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', description: 'Email or phone number', example: 'admin@goodstransfer.com' },
          password: { type: 'string', format: 'password', example: 'Admin@123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string' },
                  roles: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
          message: { type: 'string', example: 'Login successful' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'System', description: 'Health and platform probes' },
    { name: 'Users', description: 'User management' },
    { name: 'Companies', description: 'Company management' },
    { name: 'Providers', description: 'Provider management' },
    { name: 'Orders', description: 'Order lifecycle management' },
    { name: 'Offers', description: 'Provider offer management' },
    { name: 'Approvals', description: 'Company approval workflow' },
    { name: 'Assignments', description: 'Driver/team assignments' },
    { name: 'Tracking', description: 'Real-time tracking events' },
    { name: 'Delivery', description: 'Delivery proofs' },
    { name: 'Finance', description: 'Invoices, payments, settlements' },
    { name: 'Support', description: 'Tickets and issue management' },
    { name: 'Master Data', description: 'Categories, vehicles, locations' },
    { name: 'Notifications', description: 'In-app notifications' },
    { name: 'Customers', description: 'Individual customer profile and addresses' },
    { name: 'Uploads', description: 'File uploads and metadata' },
    { name: 'Dashboard', description: 'Analytics and summaries' },
    { name: 'Audit', description: 'Audit trail' },
    { name: 'Settings', description: 'System and tenant settings' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/docs/**/*.swagger.js', './src/modules/**/*.swagger.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
