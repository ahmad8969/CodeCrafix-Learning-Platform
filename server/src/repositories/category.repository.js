const Category = require('../models/Category')
const { buildPagedResult } = require('../utils/query')

async function create(data) {
  return Category.create(data)
}

async function findById(id, { includeDeleted = false } = {}) {
  const filter = { _id: id }
  if (!includeDeleted) filter.deletedAt = null
  return Category.findOne(filter)
}

async function findBySlug(slug, { includeDeleted = false } = {}) {
  const filter = { slug }
  if (!includeDeleted) filter.deletedAt = null
  return Category.findOne(filter)
}

async function updateById(id, data) {
  return Category.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
}

async function softDelete(id) {
  return Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), status: 'inactive' },
    { new: true }
  )
}

async function restore(id) {
  return Category.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { deletedAt: null, status: 'active' },
    { new: true }
  )
}

async function list({ page, limit, skip, search, sortBy, sortOrder, includeDeleted, filters }) {
  const query = {}
  if (!includeDeleted) query.deletedAt = null
  else if (filters.deletedOnly === 'true') query.deletedAt = { $ne: null }

  if (filters.status) query.status = filters.status
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { slug: new RegExp(search, 'i') },
    ]
  }

  const sort = { [sortBy]: sortOrder }
  const [items, total] = await Promise.all([
    Category.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Category.countDocuments(query),
  ])

  return buildPagedResult({ items, total, page, limit })
}

module.exports = {
  create,
  findById,
  findBySlug,
  updateById,
  softDelete,
  restore,
  list,
}
