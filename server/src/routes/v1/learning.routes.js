const express = require('express')
const learning = require('../../controllers/learning.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { requirePermission, COURSE_PERMISSIONS } = require('../../middlewares/permission.middleware')

const router = express.Router()
router.use(protect)

router.get('/dashboard', requirePermission(COURSE_PERMISSIONS.VIEW_CURRICULUM), learning.dashboard)
router.get('/bookmarks', requirePermission(COURSE_PERMISSIONS.BOOKMARK), learning.listBookmarks)

module.exports = router
