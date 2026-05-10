/**
 * Standard list query: page, limit, search, sortBy, sortOrder, status, dateFrom, dateTo
 */
function parseListQuery(query, options = {}) {
  const {
    defaultSort = 'createdAt',
    searchFields = [],
    statusField = 'status',
    enumStatus = false,
  } = options;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const sortBy = query.sortBy || query.sort || defaultSort;
  const sortOrder = query.sortOrder === 'asc' || query.order === 'asc' ? 'asc' : 'desc';
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status !== undefined && query.status !== '') {
    const s = query.status;
    where[statusField] = s.includes(',') ? { in: s.split(',') } : s;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => ({
      [field]: { contains: query.search },
    }));
  }

  return {
    page,
    limit,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    where,
    sortBy,
    sortOrder,
  };
}

module.exports = { parseListQuery };
