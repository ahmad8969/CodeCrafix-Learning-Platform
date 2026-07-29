/**
 * Email service stub — architecture ready for Prompt 002+.
 * Wire Nodemailer / provider in a later prompt.
 */
const config = require('../config')

async function sendMail({ to, subject, html, text }) {
  if (config.env !== 'production') {
    console.log('[email:stub]', { to, subject, text: text || html })
  }
  return { accepted: [to], stub: true }
}

async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`
  return sendMail({
    to: user.email,
    subject: 'Reset your CodeCrafters password',
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  })
}

async function sendEmailVerification(user, rawToken) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${rawToken}`
  return sendMail({
    to: user.email,
    subject: 'Verify your CodeCrafters email',
    text: `Verify your email: ${verifyUrl}`,
    html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  })
}

module.exports = { sendMail, sendPasswordResetEmail, sendEmailVerification }
