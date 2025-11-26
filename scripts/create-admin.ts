import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@mosquee.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'

  console.log('Création de l\'utilisateur admin...')

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  })

  if (existingAdmin) {
    console.log('Un utilisateur avec cet email existe déjà')
    return
  }

  // Hash du mot de passe
  const hashedPassword = await hash(password, 12)

  // Créer l'admin
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Mosquée',
      role: 'ADMIN',
    },
  })

  console.log('✅ Utilisateur admin créé avec succès !')
  console.log('Email:', email)
  console.log('Mot de passe:', password)
  console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion !')
}

main()
  .catch((e) => {
    console.error('Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
