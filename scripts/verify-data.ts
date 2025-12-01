import { prisma } from '../lib/prisma'

async function verifyData() {
  console.log('🔍 Vérification des données dans la base de données...\n')

  try {
    // 1. Vérifier l'utilisateur admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mosquee.com' },
      include: {
        children: true
      }
    })

    if (!adminUser) {
      console.log('❌ Utilisateur admin@mosquee.com NON TROUVÉ')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   - ID: ${adminUser.id}`)
    console.log(`   - Email: ${adminUser.email}`)
    console.log(`   - Nom: ${adminUser.firstName} ${adminUser.lastName}`)
    console.log(`   - Rôle: ${adminUser.role}`)
    console.log(`   - Nombre d'enfants: ${adminUser.children.length}\n`)

    // 2. Lister tous les enfants
    if (adminUser.children.length > 0) {
      console.log('👶 Liste des enfants:')
      adminUser.children.forEach((child, index) => {
        console.log(`\n   ${index + 1}. ${child.firstName} ${child.lastName}`)
        console.log(`      - ID: ${child.id}`)
        console.log(`      - Surnom: ${child.nickName || 'Aucun'}`)
        console.log(`      - Date de naissance: ${child.birthDate.toLocaleDateString('fr-FR')}`)
        console.log(`      - Genre: ${child.gender}`)
        console.log(`      - Notes: ${child.notes || 'Aucune'}`)
        console.log(`      - Avatar: ${child.avatarUrl || 'Aucun'}`)
      })
    } else {
      console.log('⚠️  Aucun enfant trouvé pour cet utilisateur')
    }

    // 3. Vérifier tous les enfants dans la base
    console.log('\n\n📊 Tous les enfants dans la base de données:')
    const allChildren = await prisma.child.findMany({
      include: {
        parent: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    console.log(`   Total: ${allChildren.length} enfant(s)\n`)

    allChildren.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.firstName} ${child.lastName}`)
      console.log(`      - Parent: ${child.parent.email}`)
      console.log(`      - ID enfant: ${child.id}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyData()
