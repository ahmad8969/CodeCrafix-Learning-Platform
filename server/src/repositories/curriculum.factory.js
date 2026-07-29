const { buildPagedResult } = require('../utils/query')

/**
 * Soft-delete aware list/reorder helpers for curriculum entities.
 */
function createCurriculumRepo(Model, { searchFields = ['name'], defaultSort = 'displayOrder' } = {}) {
  async function create(data) {
    const doc = await Model.create(data)
    return Model.findById(doc._id)
  }

  async function findById(id, { includeDeleted = false } = {}) {
    const filter = { _id: id }
    if (!includeDeleted) filter.deletedAt = null
    return Model.findOne(filter)
  }

  async function updateById(id, data) {
    return Model.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
      new: true,
      runValidators: true,
    })
  }

  async function softDelete(id) {
    return Model.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    )
  }

  async function restore(id) {
    return Model.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    )
  }

  async function list({
    page,
    limit,
    skip,
    search,
    sortBy = defaultSort,
    sortOrder = 1,
    includeDeleted,
    filters = {},
  }) {
    const query = { ...filters }
    if (!includeDeleted) query.deletedAt = null
    else if (filters.deletedOnly === 'true') {
      delete query.deletedOnly
      query.deletedAt = { $ne: null }
    }
    delete query.deletedOnly

    if (search && searchFields.length) {
      query.$or = searchFields.map((field) => ({ [field]: new RegExp(search, 'i') }))
    }

    const sort = { [sortBy]: sortOrder, _id: 1 }
    const [items, total] = await Promise.all([
      Model.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(query),
    ])
    return buildPagedResult({ items, total, page, limit })
  }

  async function reorder(items = []) {
    const ops = items.map((item) =>
      Model.updateOne(
        { _id: item.id, deletedAt: null },
        { $set: { displayOrder: item.displayOrder } }
      )
    )
    await Promise.all(ops)
    return { count: items.length }
  }

  async function nextOrder(parentFilter = {}) {
    const last = await Model.findOne({ ...parentFilter, deletedAt: null })
      .sort({ displayOrder: -1 })
      .select('displayOrder')
      .lean()
    return (last?.displayOrder ?? -1) + 1
  }

  async function count(filter = {}) {
    return Model.countDocuments({ deletedAt: null, ...filter })
  }

  return { create, findById, updateById, softDelete, restore, list, reorder, nextOrder, count }
}

module.exports = { createCurriculumRepo }
