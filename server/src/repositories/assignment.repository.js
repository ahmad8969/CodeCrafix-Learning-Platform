const Assignment = require('../models/Assignment')
const { parseListQuery, buildPagedResult, slugify } = require('../utils/query')

async function list(query = {}) {
  const { page, limit, search, sortBy, sortOrder, includeDeleted, filters, skip } = parseListQuery(query)
  const filter = {}
  if (!includeDeleted) filter.deletedAt = null
  if (filters.course) filter.course = filters.course
  if (filters.topic) filter.topic = filters.topic
  if (filters.batch) filter.batch = filters.batch
  if (filters.type) filter.type = filters.type
  if (filters.status) filter.status = filters.status
  if (filters.difficulty) filter.difficulty = filters.difficulty
  if (search) filter.$text = { $search: search }

  const [items, total] = await Promise.all([
    Assignment.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .populate('topic', 'name slug')
      .populate('batch', 'name batchCode')
      .populate('createdBy', 'fullName email')
      .lean(),
    Assignment.countDocuments(filter),
  ])
  return buildPagedResult({ items, total, page, limit })
}

async function findById(id) {
  return Assignment.findById(id)
    .populate('course', 'title slug instructor')
    .populate('topic', 'name slug')
    .populate('module', 'name')
    .populate('week', 'name weekNumber')
    .populate('batch', 'name batchCode')
}

async function create(data) {
  return Assignment.create(data)
}

async function update(id, data) {
  return Assignment.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

async function softDelete(id) {
  return Assignment.findByIdAndUpdate(
    id,
    { deletedAt: new Date(), status: 'archived' },
    { new: true }
  )
}

async function restore(id) {
  return Assignment.findByIdAndUpdate(id, { deletedAt: null, status: 'draft' }, { new: true })
}

async function uniqueSlug(title, courseId, excludeId) {
  let base = slugify(title) || `assignment-${Date.now()}`
  let n = 0
  for (;;) {
    const slug = n === 0 ? base : `${base}-${n}`
    const hit = await Assignment.findOne({
      slug,
      course: courseId,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean()
    if (!hit) return slug
    n += 1
  }
}

module.exports = {
  list,
  findById,
  create,
  update,
  softDelete,
  restore,
  uniqueSlug,
  Model: Assignment,
}
