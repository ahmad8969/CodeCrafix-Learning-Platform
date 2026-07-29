/**
 * Email service stub — architecture ready for SMTP/provider wiring.
 * Prompt 002 logs messages in development instead of sending mail.
 */
const config = require('../config')

async function sendMail({ to, subject, html, text }) {
  if (config.env !== 'production') {
    console.log('[email:stub]', { to, subject, text: text || html })
    return { accepted: [to], stub: true }
  }

  // Production: plug Nodemailer / provider here.
  console.warn('[email] SMTP not configured — message skipped', { to, subject })
  return { accepted: [], stub: true }
}

async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  return sendMail({
    to,
    subject: 'Reset your CodeCrafters password',
    text: `Hi ${fullName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `<p>Hi ${fullName},</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
  })
}

async function sendEmailVerification({ to, verifyUrl, fullName }) {
  return sendMail({
    to,
    subject: 'Verify your CodeCrafters email',
    text: `Hi ${fullName},\n\nVerify your email: ${verifyUrl}`,
    html: `<p>Hi ${fullName},</p><p><a href="${verifyUrl}">Verify email</a></p>`,
  })
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendEmailVerification,
}
