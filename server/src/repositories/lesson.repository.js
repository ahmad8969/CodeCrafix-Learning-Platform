const Lesson = require('../models/Lesson')
const { createCurriculumRepo } = require('./curriculum.factory')

module.exports = createCurriculumRepo(Lesson, {
  searchFields: ['title', 'summary', 'content'],
})
