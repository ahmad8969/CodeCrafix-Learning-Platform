const { body, param } = require('express-validator')
const {
  CURRICULUM_STATUS,
  COURSE_DIFFICULTY,
  LESSON_TYPES,
  RESOURCE_TYPES,
  RESOURCE_VISIBILITY,
} = require('../constants')

const mongoId = (field = 'id') => param(field).isMongoId().withMessage('Invalid id')

const reorderBody = [
  body('items').isArray({ min: 1 }).withMessage('items array is required'),
  body('items.*.id').isMongoId(),
  body('items.*.displayOrder').isInt({ min: 0 }),
]

const moduleCreate = [
  body('course').isMongoId().withMessage('Valid course is required'),
  body('name').trim().notEmpty().withMessage('Module name is required'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('estimatedDuration').optional().trim(),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
]

const moduleUpdate = [
  mongoId(),
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

const weekCreate = [
  body('module').isMongoId().withMessage('Valid module is required'),
  body('weekNumber').isInt({ min: 1 }).withMessage('Week number is required'),
  body('name').trim().notEmpty().withMessage('Week name is required'),
  body('description').optional().trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
]

const weekUpdate = [
  mongoId(),
  body('name').optional().trim().notEmpty(),
  body('weekNumber').optional().isInt({ min: 1 }),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

const topicCreate = [
  body('week').isMongoId().withMessage('Valid week is required'),
  body('name').trim().notEmpty().withMessage('Topic name is required'),
  body('slug').optional().trim(),
  body('shortDescription').optional().trim(),
  body('difficulty').optional().isIn(Object.values(COURSE_DIFFICULTY)),
  body('estimatedTime').optional().trim(),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('learningObjectives').optional().isArray(),
  body('keywords').optional().isArray(),
  body('tags').optional().isArray(),
]

const topicUpdate = [
  mongoId(),
  body('name').optional().trim().notEmpty(),
  body('difficulty').optional().isIn(Object.values(COURSE_DIFFICULTY)),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

const lessonCreate = [
  body('topic').isMongoId().withMessage('Valid topic is required'),
  body('title').trim().notEmpty().withMessage('Lesson title is required'),
  body('lessonType').optional().isIn(Object.values(LESSON_TYPES)),
  body('content').optional(),
  body('summary').optional().trim(),
  body('estimatedReadingTime').optional().isFloat({ min: 0 }),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('previewAllowed').optional().isBoolean(),
  body('bookmarksEnabled').optional().isBoolean(),
]

const lessonUpdate = [
  mongoId(),
  body('title').optional().trim().notEmpty(),
  body('lessonType').optional().isIn(Object.values(LESSON_TYPES)),
  body('status').optional().isIn(Object.values(CURRICULUM_STATUS)),
  body('displayOrder').optional().isInt({ min: 0 }),
  body('previewAllowed').optional().isBoolean(),
]

const resourceCreate = [
  body('lesson').isMongoId().withMessage('Valid lesson is required'),
  body('title').trim().notEmpty().withMessage('Resource title is required'),
  body('url').trim().notEmpty().withMessage('URL is required'),
  body('type').optional().isIn(Object.values(RESOURCE_TYPES)),
  body('description').optional().trim(),
  body('size').optional().trim(),
  body('visibility').optional().isIn(Object.values(RESOURCE_VISIBILITY)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

const resourceUpdate = [
  mongoId(),
  body('title').optional().trim().notEmpty(),
  body('url').optional().trim().notEmpty(),
  body('type').optional().isIn(Object.values(RESOURCE_TYPES)),
  body('visibility').optional().isIn(Object.values(RESOURCE_VISIBILITY)),
  body('displayOrder').optional().isInt({ min: 0 }),
]

module.exports = {
  mongoId,
  reorderBody,
  moduleCreate,
  moduleUpdate,
  weekCreate,
  weekUpdate,
  topicCreate,
  topicUpdate,
  lessonCreate,
  lessonUpdate,
  resourceCreate,
  resourceUpdate,
}
