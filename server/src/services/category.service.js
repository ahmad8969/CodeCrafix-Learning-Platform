const categoryRepo = require('../repositories/category.repository')
const { ApiError } = require('../utils/helpers')
const { slugify, parseListQuery } = require('../utils/query')

async function createCategory(payload, userId) {
  const slug = slugify(payload.slug || payload.name)
  const existing = await categoryRepo.findBySlug(slug, { includeDeleted: true })
  if (existing && !existing.deletedAt) {
    throw new ApiError(409, 'Category slug already exists')
  }
  if (existing?.deletedAt) {
    throw new ApiError(409, 'A deleted category uses this slug. Restore it instead.')
  }

  return categoryRepo.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateCategory(id, payload, userId) {
  const category = await categoryRepo.findById(id)
  if (!category) throw new ApiError(404, 'Category not found')

  if (payload.name || payload.slug) {
    const slug = slugify(payload.slug || payload.name || category.name)
    const existing = await categoryRepo.findBySlug(slug, { includeDeleted: true })
    if (existing && String(existing._id) !== String(id) && !existing.deletedAt) {
      throw new ApiError(409, 'Category slug already exists')
    }
    payload.slug = slug
  }

  payload.updatedBy = userId
  const updated = await categoryRepo.updateById(id, payload)
  if (!updated) throw new ApiError(404, 'Category not found')
  return updated
}

async function getCategory(id) {
  const category = await categoryRepo.findById(id)
  if (!category) throw new ApiError(404, 'Category not found')
  return category
}

async function listCategories(query) {
  return categoryRepo.list(parseListQuery(query))
}

async function deleteCategory(id) {
  const deleted = await categoryRepo.softDelete(id)
  if (!deleted) throw new ApiError(404, 'Category not found')
  return deleted
}

async function restoreCategory(id) {
  const restored = await categoryRepo.restore(id)
  if (!restored) throw new ApiError(404, 'Deleted category not found')
  return restored
}

module.exports = {
  createCategory,
  updateCategory,
  getCategory,
  listCategories,
  deleteCategory,
  restoreCategory,
}
