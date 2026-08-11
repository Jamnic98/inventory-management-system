import prisma from '../db.js'

export default async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  // List the initial users you want in your system
  const initialUsers = [
    {
      email: 'jamie.paul.stimpson@gmail.com',
      name: 'Jamie Stimpson',
    },
  ]

  for (const userData of initialUsers) {
    // Upsert ensures running the seed multiple times won't create duplicate users
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: userData,
    })

    console.log(`✅ User ready: ID ${user.id} — ${user.email}`)
  }

  console.log('🎉 Seeding completed successfully!')
}
