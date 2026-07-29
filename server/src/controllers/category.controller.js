const categoryService = require('../services/category.service')
const { asyncHandler, sendSuccess } = require('../utils/helpers')

const create = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body, req.user._id)
  sendSuccess(res, data, 'Category created', 201)
})

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body, req.user._id)
  sendSuccess(res, data, 'Category updated')
})

const getOne = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategory(req.params.id)
  sendSuccess(res, data)
})

const getAll = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories(req.query)
  sendSuccess(res, data)
})

const remove = asyncHandler(async (req, res) => {
  const data = await categoryService.deleteCategory(req.params.id)
  sendSuccess(res, data, 'Category deleted')
})

const restore = asyncHandler(async (req, res) => {
  const data = await categoryService.restoreCategory(req.params.id)
  sendSuccess(res, data, 'Category restored')
})

module.exports = { create, update, getOne, getAll, remove, restore }
