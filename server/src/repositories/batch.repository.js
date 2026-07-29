const Batch = require('../models/Batch')
const { buildPagedResult } = require('../utils/query')

const POPULATE = [
  { path: 'course', select: 'title slug status' },
  { path: 'teacher', select: 'fullName email role profileImage' },
]

async function create(data) {
  const batch = await Batch.create(data)
  return Batch.findById(batch._id).populate(POPULATE)
}

async function findById(id, { includeDeleted = false } = {}) {
  const filter = { _id: id }
  if (!includeDeleted) filter.deletedAt = null
  return Batch.findOne(filter).populate(POPULATE)
}

async function updateById(id, data) {
  return Batch.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  }).populate(POPULATE)
}

async function softDelete(id) {
  return Batch.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  )
}

async function restore(id) {
  return Batch.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { deletedAt: null },
    { new: true }
  ).populate(POPULATE)
}

async function list({
  page,
  limit,
  skip,
  search,
  sortBy,
  sortOrder,
  includeDeleted,
  filters,
  assignedTeacherId,
}) {
  const query = {}
  if (!includeDeleted) query.deletedAt = null
  if (filters.course) query.course = filters.course
  if (filters.status) query.status = filters.status
  if (filters.teacher) query.teacher = filters.teacher
  if (assignedTeacherId) query.teacher = assignedTeacherId
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { batchCode: new RegExp(search, 'i') },
    ]
  }

  const sort = { [sortBy]: sortOrder }
  const [items, total] = await Promise.all([
    Batch.find(query).populate(POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Batch.countDocuments(query),
  ])

  return buildPagedResult({ items, total, page, limit })
}

async function countActive({ assignedTeacherId } = {}) {
  const query = { deletedAt: null, status: { $in: ['upcoming', 'active'] } }
  if (assignedTeacherId) query.teacher = assignedTeacherId
  return Batch.countDocuments(query)
}

module.exports = {
  create,
  findById,
  updateById,
  softDelete,
  restore,
  list,
  countActive,
}
