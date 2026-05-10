/**
 * Parse pagination parameters from query string.
 * Returns Prisma-compatible skip/take and metadata.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const sort = query.sort || 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sort]: order },
  };
}

/**
 * Build a Prisma-compatible filter from common query params.
 */
function parseFilters(query, allowedFields = []) {
  const where = {};

  if (query.search && allowedFields.includes('search')) {
    where.OR = [];
  }

  if (query.status) {
    where.status = query.status.includes(',')
      ? { in: query.status.split(',') }
      : query.status;
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  for (const field of allowedFields) {
    if (field === 'search' || field === 'status') continue;
    if (query[field] !== undefined) {
      where[field] = query[field];
    }
  }

  return where;
}

module.exports = { parsePagination, parseFilters };
