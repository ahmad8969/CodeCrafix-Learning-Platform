const Resource = require('../models/Resource')
const { createCurriculumRepo } = require('./curriculum.factory')

module.exports = createCurriculumRepo(Resource, {
  searchFields: ['title', 'description', 'url'],
})
