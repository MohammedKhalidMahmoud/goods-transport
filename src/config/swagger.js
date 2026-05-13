const fs = require('fs');
const path = require('path');

const deepmerge = require('deepmerge');
const glob = require('glob');
const yaml = require('js-yaml');

const { config } = require('./index');
const { logger } = require('../lib/logger');

const globSync = glob.globSync || glob.sync || glob;
const swaggerRoot = path.resolve(__dirname, '../swagger');
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);
const deployedApiUrl = 'https://goods-transfer.nodeteam.site/api/v1';
const configuredApiUrl = `${config.appUrl}/api/v1`;

const servers = [
  {
    url: configuredApiUrl,
    description: config.env === 'production' ? 'Production' : 'Development',
  },
  {
    url: deployedApiUrl,
    description: 'Production',
  },
].filter((server, index, allServers) => allServers.findIndex((item) => item.url === server.url) === index);

const baseDocument = {
  openapi: '3.0.0',
  info: {
    title: config.appName || 'Goods Transfer API',
    version: '1.0.0',
    description: 'Enterprise Logistics Platform REST API Documentation',
  },
  servers,
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {},
  },
};

function discoverYamlFiles() {
  if (!fs.existsSync(swaggerRoot)) return [];

  const files = [
    ...globSync('**/paths.yaml', { cwd: swaggerRoot, nodir: true, absolute: true }),
    ...globSync('**/schemas.yaml', { cwd: swaggerRoot, nodir: true, absolute: true }),
  ];

  return files
    .filter((file) => path.dirname(path.relative(swaggerRoot, file)) !== '.')
    .sort((a, b) => a.localeCompare(b));
}

function moduleFoldersFor(files) {
  return [...new Set(files.map((file) => path.dirname(path.relative(swaggerRoot, file)).split(path.sep)[0]))].sort();
}

function parseYamlFile(file) {
  try {
    const contents = fs.readFileSync(file, 'utf8');
    return yaml.load(contents) || {};
  } catch (error) {
    throw new Error(`Failed to parse Swagger YAML file "${file}": ${error.message}`);
  }
}

function normalizeFragment(file, parsed) {
  const fileName = path.basename(file);

  if (fileName === 'paths.yaml' && !parsed.paths && !parsed.components) {
    return { paths: parsed };
  }

  if (fileName === 'schemas.yaml' && !parsed.paths && !parsed.components) {
    return { components: { schemas: parsed } };
  }

  return parsed;
}

function pathParameterNames(routePath) {
  return [...routePath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
}

function hasPathParameter(parameters, name) {
  return parameters.some((parameter) => parameter && parameter.in === 'path' && parameter.name === name);
}

function createPathParameter(name) {
  const likelyUuid = name === 'id' || name.endsWith('Id');

  return {
    in: 'path',
    name,
    required: true,
    schema: likelyUuid ? { type: 'string', format: 'uuid' } : { type: 'string' },
  };
}

function ensurePathParameters(document) {
  for (const [routePath, pathItem] of Object.entries(document.paths || {})) {
    const names = pathParameterNames(routePath);
    if (names.length === 0 || !pathItem) continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method) || !operation) continue;

      const inheritedParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
      const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];
      const nextParameters = [...operationParameters];

      for (const name of names) {
        if (!hasPathParameter([...inheritedParameters, ...nextParameters], name)) {
          nextParameters.push(createPathParameter(name));
        }
      }

      if (nextParameters.length > operationParameters.length) {
        operation.parameters = nextParameters;
      }
    }
  }

  return document;
}

function assembleSwaggerSpec() {
  const files = discoverYamlFiles();
  const moduleFolders = moduleFoldersFor(files);

  logger.info('Discovered Swagger module folders', { modules: moduleFolders });

  const document = files.reduce((document, file) => {
    const parsed = parseYamlFile(file);
    const fragment = normalizeFragment(file, parsed);
    return deepmerge(document, fragment);
  }, baseDocument);

  return ensurePathParameters(document);
}

const swaggerSpec = assembleSwaggerSpec();

module.exports = {
  swaggerSpec,
  default: swaggerSpec,
};
