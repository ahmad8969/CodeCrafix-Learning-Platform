require('dotenv').config()
const connectDB = require('../config/db')
const User = require('../models/User')
const { ROLES, USER_STATUS } = require('../constants')

const DEMO_PASSWORD = 'Password1'

const users = [
  {
    fullName: 'Super Admin',
    email: 'superadmin@codecrafters.dev',
    role: ROLES.SUPER_ADMIN,
    phoneNumber: '+10000000001',
  },
  {
    fullName: 'Platform Admin',
    email: 'admin@codecrafters.dev',
    role: ROLES.ADMIN,
    phoneNumber: '+10000000002',
  },
  {
    fullName: 'Maya Chen',
    email: 'teacher@codecrafters.dev',
    role: ROLES.TEACHER,
    phoneNumber: '+10000000003',
  },
  {
    fullName: 'Alex Rivera',
    email: 'student@codecrafters.dev',
    role: ROLES.STUDENT,
    phoneNumber: '+10000000004',
  },
]

async function seed() {
  await connectDB()

  for (const entry of users) {
    const existing = await User.findOne({ email: entry.email })
    if (existing) {
      existing.fullName = entry.fullName
      existing.role = entry.role
      existing.phoneNumber = entry.phoneNumber
      existing.status = USER_STATUS.ACTIVE
      existing.emailVerified = true
      existing.password = DEMO_PASSWORD
      await existing.save()
      console.log(`Updated ${entry.email}`)
    } else {
      await User.create({
        ...entry,
        password: DEMO_PASSWORD,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
      })
      console.log(`Created ${entry.email}`)
    }
  }

  console.log('\nSeed complete. Demo password for all:', DEMO_PASSWORD)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
