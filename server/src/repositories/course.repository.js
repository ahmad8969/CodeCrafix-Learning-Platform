const Course = require('../models/Course')
const { buildPagedResult } = require('../utils/query')

const POPULATE = [
  { path: 'category', select: 'name slug color icon' },
  { path: 'instructor', select: 'fullName email role profileImage' },
  { path: 'createdBy', select: 'fullName email' },
  { path: 'updatedBy', select: 'fullName email' },
]

async function create(data) {
  const course = await Course.create(data)
  return Course.findById(course._id).populate(POPULATE).populate('batchCount')
}

async function findById(id, { includeDeleted = false } = {}) {
  const filter = { _id: id }
  if (!includeDeleted) filter.deletedAt = null
  return Course.findOne(filter).populate(POPULATE).populate('batchCount')
}

async function findBySlug(slug, { includeDeleted = false } = {}) {
  const filter = { slug }
  if (!includeDeleted) filter.deletedAt = null
  return Course.findOne(filter).populate(POPULATE).populate('batchCount')
}

async function updateById(id, data) {
  return Course.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .populate('batchCount')
}

async function softDelete(id) {
  return Course.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  )
}

async function restore(id) {
  return Course.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { deletedAt: null },
    { new: true }
  )
    .populate(POPULATE)
    .populate('batchCount')
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
  assignedInstructorId,
}) {
  const query = {}
  if (!includeDeleted) query.deletedAt = null
  else if (filters.deletedOnly === 'true') query.deletedAt = { $ne: null }

  if (filters.status) query.status = filters.status
  if (filters.category) query.category = filters.category
  if (filters.difficulty) query.difficulty = filters.difficulty
  if (filters.featured === 'true') query.featured = true
  if (filters.trending === 'true') query.trending = true
  if (filters.popular === 'true') query.popular = true
  if (filters.instructor) query.instructor = filters.instructor
  if (assignedInstructorId) query.instructor = assignedInstructorId
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { shortDescription: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') },
    ]
  }

  const sort = { [sortBy]: sortOrder }
  const [items, total] = await Promise.all([
    Course.find(query)
      .populate(POPULATE)
      .populate('batchCount')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Course.countDocuments(query),
  ])

  return buildPagedResult({ items, total, page, limit })
}

async function getStats({ assignedInstructorId } = {}) {
  const match = { deletedAt: null }
  if (assignedInstructorId) match.instructor = assignedInstructorId

  const [total, published, draft, archived, featured] = await Promise.all([
    Course.countDocuments(match),
    Course.countDocuments({ ...match, status: 'published' }),
    Course.countDocuments({ ...match, status: 'draft' }),
    Course.countDocuments({ ...match, status: 'archived' }),
    Course.countDocuments({ ...match, featured: true }),
  ])

  return { total, published, draft, archived, featured }
}

module.exports = {
  create,
  findById,
  findBySlug,
  updateById,
  softDelete,
  restore,
  list,
  getStats,
}
