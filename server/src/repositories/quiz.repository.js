const Quiz = require('../models/Quiz')
const { parseListQuery, buildPagedResult, slugify } = require('../utils/query')

async function list(query = {}) {
  const { page, limit, search, sortBy, sortOrder, includeDeleted, filters, skip } = parseListQuery(query)
  const filter = {}
  if (!includeDeleted) filter.deletedAt = null
  if (filters.course) filter.course = filters.course
  if (filters.topic) filter.topic = filters.topic
  if (filters.status) filter.status = filters.status
  if (filters.category) filter.category = filters.category
  if (search) filter.$text = { $search: search }

  const [items, total] = await Promise.all([
    Quiz.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .populate('topic', 'name slug')
      .populate('createdBy', 'fullName')
      .lean(),
    Quiz.countDocuments(filter),
  ])
  return buildPagedResult({ items, total, page, limit })
}

async function findById(id) {
  return Quiz.findById(id)
    .populate('course', 'title slug instructor')
    .populate('topic', 'name slug')
    .populate('items.practiceQuestion', 'title type difficulty category status')
}

async function create(data) {
  return Quiz.create(data)
}

async function update(id, data) {
  return Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

async function softDelete(id) {
  return Quiz.findByIdAndUpdate(id, { deletedAt: new Date(), status: 'archived' }, { new: true })
}

async function restore(id) {
  return Quiz.findByIdAndUpdate(id, { deletedAt: null, status: 'draft' }, { new: true })
}

async function uniqueSlug(title, courseId, excludeId) {
  let base = slugify(title) || `quiz-${Date.now()}`
  let n = 0
  for (;;) {
    const slug = n === 0 ? base : `${base}-${n}`
    const hit = await Quiz.findOne({
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
  Model: Quiz,
}
