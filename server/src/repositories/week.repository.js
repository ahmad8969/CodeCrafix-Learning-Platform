const Week = require('../models/Week')
const { createCurriculumRepo } = require('./curriculum.factory')

const base = createCurriculumRepo(Week, { searchFields: ['name', 'description'] })

module.exports = base
