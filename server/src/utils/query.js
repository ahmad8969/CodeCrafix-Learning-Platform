function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Parse list query: page, limit, search, sort, filters, includeDeleted
 */
function parseListQuery(query = {}) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
  const search = (query.search || query.q || '').trim()
  const sortBy = query.sortBy || 'createdAt'
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1
  const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true

  const filters = { ...query }
  ;['page', 'limit', 'search', 'q', 'sortBy', 'sortOrder', 'includeDeleted'].forEach((k) => {
    delete filters[k]
  })

  return { page, limit, search, sortBy, sortOrder, includeDeleted, filters, skip: (page - 1) * limit }
}

function buildPagedResult({ items, total, page, limit }) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

module.exports = { slugify, parseListQuery, buildPagedResult }
