const { body, param } = require('express-validator')
const { COURSE_STATUS, COURSE_DIFFICULTY, COURSE_VISIBILITY, BATCH_DAYS, BATCH_STATUS, CATEGORY_STATUS } = require('../constants')

const mongoId = (field = 'id') => param(field).isMongoId().withMessage('Invalid id')

const categoryCreate = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('color').optional().trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(Object.values(CATEGORY_STATUS)),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
]

const categoryUpdate = [
  mongoId(),
  body('name').optional().trim().notEmpty(),
  body('slug').optional().trim(),
  body('status').optional().isIn(Object.values(CATEGORY_STATUS)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

const courseCreate = [
  body('title').trim().notEmpty().withMessage('Course title is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('instructor').isMongoId().withMessage('Valid instructor is required'),
  body('shortDescription').optional().trim(),
  body('fullDescription').optional().trim(),
  body('difficulty').optional().isIn(Object.values(COURSE_DIFFICULTY)),
  body('status').optional().isIn(Object.values(COURSE_STATUS)),
  body('visibility').optional().isIn(Object.values(COURSE_VISIBILITY)),
  body('price').optional().isFloat({ min: 0 }),
  body('discountPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('tags').optional().isArray(),
  body('learningOutcomes').optional().isArray(),
  body('requirements').optional().isArray(),
  body('targetAudience').optional().isArray(),
  body('settings').optional().isObject(),
]

const courseUpdate = [
  mongoId(),
  body('title').optional().trim().notEmpty(),
  body('category').optional().isMongoId(),
  body('instructor').optional().isMongoId(),
  body('difficulty').optional().isIn(Object.values(COURSE_DIFFICULTY)),
  body('status').optional().isIn(Object.values(COURSE_STATUS)),
  body('visibility').optional().isIn(Object.values(COURSE_VISIBILITY)),
  body('price').optional().isFloat({ min: 0 }),
]

const batchCreate = [
  body('course').isMongoId().withMessage('Valid course is required'),
  body('name').trim().notEmpty().withMessage('Batch name is required'),
  body('batchCode').trim().notEmpty().withMessage('Batch code is required'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('teacher').isMongoId().withMessage('Valid teacher is required'),
  body('days').optional().isArray(),
  body('days.*').optional().isIn(BATCH_DAYS),
  body('status').optional().isIn(Object.values(BATCH_STATUS)),
  body('maximumStudents').optional().isInt({ min: 1 }),
]

const batchUpdate = [
  mongoId(),
  body('name').optional().trim().notEmpty(),
  body('course').optional().isMongoId(),
  body('teacher').optional().isMongoId(),
  body('status').optional().isIn(Object.values(BATCH_STATUS)),
  body('days.*').optional().isIn(BATCH_DAYS),
]

const bulkIds = [
  body('ids').isArray({ min: 1 }).withMessage('ids array is required'),
  body('ids.*').isMongoId(),
]

module.exports = {
  categoryCreate,
  categoryUpdate,
  courseCreate,
  courseUpdate,
  batchCreate,
  batchUpdate,
  bulkIds,
  mongoId,
}
