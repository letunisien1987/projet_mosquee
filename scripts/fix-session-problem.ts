import { prisma } from '../lib/prisma'

async function fixSessionProblem() {
  console.log('🔧 CORRECTION DU PROBLÈME DE SESSION\n')
  console.log('═══════════════════════════════════════\n')

  try {
    // 1. Lister tous les utilisateurs
    console.log('1️⃣ Liste de TOUS les utilisateurs dans la base:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            children: true
          }
        }
      }
    })

    console.log(`   Total: ${allUsers.length} utilisateur(s)\n`)

    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`)
      console.log(`      - ID: ${user.id}`)
      console.log(`      - Nom: ${user.firstName} ${user.lastName}`)
      console.log(`      - Rôle: ${user.role}`)
      console.log(`      - Enfants: ${user._count.children}`)
      console.log('')
    })

    // 2. Trouver l'utilisateur admin@mosquee.com
    const adminUser = allUsers.find(u => u.email === 'admin@mosquee.com')

    if (!adminUser) {
      console.log('❌ L\'utilisateur admin@mosquee.com N\'EXISTE PAS !')
      console.log('   Solution: Utiliser un des comptes ci-dessus')
      return
    }

    console.log('✅ Utilisateur admin@mosquee.com trouvé:')
    console.log(`   ID correct: ${adminUser.id}`)
    console.log(`   Nombre d'enfants: ${adminUser._count.children}\n`)

    // 3. Lister ses enfants
    const children = await prisma.child.findMany({
      where: { parentId: adminUser.id }
    })

    console.log(`👶 Enfants de admin@mosquee.com: ${children.length}`)
    children.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.firstName} ${child.lastName}`)
    })
    console.log('')

    // 4. Instructions
    console.log('═══════════════════════════════════════')
    console.log('📋 SOLUTION:')
    console.log('═══════════════════════════════════════\n')
    console.log('1. DÉCONNECTEZ-VOUS complètement du site')
    console.log('2. Fermez le navigateur')
    console.log('3. Rouvrez le navigateur')
    console.log('4. Allez sur: http://localhost:3000/auth/signin')
    console.log('5. Connectez-vous avec:')
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log('   🔑 Password: Admin123!')
    console.log('')
    console.log('Le problème sera résolu après reconnexion.')
    console.log('')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSessionProblem()
