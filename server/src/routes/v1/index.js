const express = require('express')
const { getHealth } = require('../../controllers/health.controller')
const authRoutes = require('./auth.routes')

const router = express.Router()

router.get('/health', getHealth)
router.use('/auth', authRoutes)

module.exports = router
