require('dotenv').config()
const connectDB = require('../config/db')
const User = require('../models/User')
const { ROLES, USER_STATUS } = require('../constants')

const users = [
  {
    fullName: 'Super Admin',
    email: 'superadmin@codecrafters.dev',
    password: 'SuperAdmin1',
    role: ROLES.SUPER_ADMIN,
    phoneNumber: '+10000000001',
  },
  {
    fullName: 'Platform Admin',
    email: 'admin@codecrafters.dev',
    password: 'Admin1234',
    role: ROLES.ADMIN,
    phoneNumber: '+10000000002',
  },
  {
    fullName: 'Maya Chen',
    email: 'teacher@codecrafters.dev',
    password: 'Teacher12',
    role: ROLES.TEACHER,
    phoneNumber: '+10000000003',
  },
  {
    fullName: 'Alex Rivera',
    email: 'student@codecrafters.dev',
    password: 'Student12',
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
      existing.status = USER_STATUS.ACTIVE
      existing.emailVerified = true
      existing.phoneNumber = entry.phoneNumber
      existing.password = entry.password
      await existing.save()
      console.log(`Updated ${entry.email}`)
    } else {
      await User.create({
        ...entry,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
      })
      console.log(`Created ${entry.email}`)
    }
  }

  console.log('\nSeed complete. Demo accounts:')
  users.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`))
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
