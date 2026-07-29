const { body } = require('express-validator')

const passwordRule = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must include an uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must include a lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must include a number')

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('rememberMe must be boolean'),
]

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
]

const resetPasswordValidators = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must include a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number'),
]

const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must include an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must include a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must include a number'),
]

module.exports = {
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
  passwordRule,
}
