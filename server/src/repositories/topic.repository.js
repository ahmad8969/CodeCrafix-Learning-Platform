const Topic = require('../models/Topic')
const { createCurriculumRepo } = require('./curriculum.factory')

const base = createCurriculumRepo(Topic, {
  searchFields: ['name', 'shortDescription', 'slug', 'tags', 'keywords'],
})

module.exports = base
