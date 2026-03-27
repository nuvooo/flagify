const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mongodb://mongodb:27017/togglely',
    },
  },
})

async function main() {
  const passwordHash = await bcrypt.hash('demo1234!', 10)

  // Update password
  const user = await prisma.user.update({
    where: { email: 'demo@togglely.io' },
    data: { password: passwordHash },
  })

  console.log('Demo user password updated:', user.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
