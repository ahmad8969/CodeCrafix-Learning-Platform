const express = require('express')
const authController = require('../../controllers/auth.controller')
const { protect } = require('../../middlewares/auth.middleware')
const { validate } = require('../../middlewares/validate.middleware')
const {
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
} = require('../../validators/auth.validator')

const router = express.Router()

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication & session
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 */
router.post('/login', loginValidators, validate, authController.login)

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', protect, authController.logout)

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh-token', authController.refreshToken)

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 */
router.post('/forgot-password', forgotPasswordValidators, validate, authController.forgotPassword)

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 */
router.post('/reset-password', resetPasswordValidators, validate, authController.resetPassword)

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (authenticated)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/change-password',
  protect,
  changePasswordValidators,
  validate,
  authController.changePassword
)

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', protect, authController.me)

module.exports = router
