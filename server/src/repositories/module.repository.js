const Module = require('../models/Module')
const { createCurriculumRepo } = require('./curriculum.factory')

const base = createCurriculumRepo(Module, { searchFields: ['name', 'description', 'slug'] })

module.exports = base
