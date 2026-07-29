const PracticeQuestion = require('../models/PracticeQuestion')
const { parseListQuery, buildPagedResult } = require('../utils/query')

async function list(query = {}) {
  const { page, limit, search, sortBy, sortOrder, includeDeleted, filters, skip } = parseListQuery(query)
  const filter = {}

  if (!includeDeleted) filter.deletedAt = null
  if (filters.deletedOnly === 'true') filter.deletedAt = { $ne: null }
  if (filters.type) filter.type = filters.type
  if (filters.difficulty) filter.difficulty = filters.difficulty
  if (filters.status) filter.status = filters.status
  if (filters.category) filter.category = filters.category
  if (filters.topic) filter.topic = filters.topic
  if (filters.course) filter.course = filters.course
  if (filters.language) filter.languageIds = filters.language
  if (filters.tag) filter.tags = filters.tag
  if (search) filter.$text = { $search: search }

  const [items, total] = await Promise.all([
    PracticeQuestion.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('topic', 'name slug')
      .populate('course', 'title slug')
      .populate('createdBy', 'fullName email')
      .lean(),
    PracticeQuestion.countDocuments(filter),
  ])

  return buildPagedResult({ items, total, page, limit })
}

async function findById(id, { withSecrets = false } = {}) {
  let q = PracticeQuestion.findById(id)
  if (withSecrets) q = q.select('+referenceSolution +teacherNotes +options.isCorrect')
  return q.populate('topic', 'name slug').populate('course', 'title slug')
}

async function create(data) {
  return PracticeQuestion.create(data)
}

async function update(id, data) {
  return PracticeQuestion.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

async function softDelete(id) {
  return PracticeQuestion.findByIdAndUpdate(id, { deletedAt: new Date(), status: 'archived' }, { new: true })
}

async function restore(id) {
  return PracticeQuestion.findByIdAndUpdate(
    id,
    { deletedAt: null, status: 'draft' },
    { new: true }
  )
}

module.exports = {
  list,
  findById,
  create,
  update,
  softDelete,
  restore,
  Model: PracticeQuestion,
}
