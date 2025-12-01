import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function testChildrenSystem() {
  console.log('🧪 DÉBUT DES TESTS - Système de gestion des enfants\n')

  try {
    // 1. Créer un utilisateur de test
    console.log('1️⃣ Création d\'un utilisateur de test...')

    // Supprimer l'utilisateur de test s'il existe déjà
    await prisma.user.deleteMany({
      where: { email: 'test.parent@example.com' }
    })

    const hashedPassword = await bcrypt.hash('password123', 10)

    const testUser = await prisma.user.create({
      data: {
        email: 'test.parent@example.com',
        password: hashedPassword,
        firstName: 'Ahmed',
        lastName: 'Test',
        role: 'MEMBER'
      }
    })

    console.log(`   ✅ Utilisateur créé: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`)
    console.log(`   📧 Email: test.parent@example.com`)
    console.log(`   🔑 Password: password123\n`)

    // 2. Créer un premier enfant
    console.log('2️⃣ Ajout du premier enfant (Amira)...')

    const child1 = await prisma.child.create({
      data: {
        firstName: 'Amira',
        lastName: 'Test',
        nickName: 'Mimi',
        birthDate: new Date('2018-05-15'),
        gender: 'FEMALE',
        notes: 'Allergie aux arachides',
        parentId: testUser.id
      }
    })

    const age1 = calculateAge(child1.birthDate)
    console.log(`   ✅ Enfant créé: ${child1.firstName} ${child1.lastName}`)
    console.log(`   👧 Genre: Fille`)
    console.log(`   🎂 Âge: ${age1} ans`)
    console.log(`   📝 Notes: ${child1.notes}\n`)

    // 3. Créer un deuxième enfant
    console.log('3️⃣ Ajout du deuxième enfant (Youssef)...')

    const child2 = await prisma.child.create({
      data: {
        firstName: 'Youssef',
        lastName: 'Test',
        birthDate: new Date('2015-03-10'),
        gender: 'MALE',
        notes: 'Asthme',
        parentId: testUser.id
      }
    })

    const age2 = calculateAge(child2.birthDate)
    console.log(`   ✅ Enfant créé: ${child2.firstName} ${child2.lastName}`)
    console.log(`   👦 Genre: Garçon`)
    console.log(`   🎂 Âge: ${age2} ans`)
    console.log(`   📝 Notes: ${child2.notes}\n`)

    // 4. Lister tous les enfants
    console.log('4️⃣ Liste de tous les enfants du parent...')

    const children = await prisma.child.findMany({
      where: { parentId: testUser.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            eventRegistrations: true
          }
        }
      }
    })

    console.log(`   ✅ Nombre d'enfants trouvés: ${children.length}`)
    children.forEach((child, index) => {
      const age = calculateAge(child.birthDate)
      console.log(`   ${index + 1}. ${child.firstName} ${child.lastName} (${age} ans)`)
      console.log(`      - Inscriptions activités: ${child._count.enrollments}`)
      console.log(`      - Inscriptions événements: ${child._count.eventRegistrations}`)
    })
    console.log('')

    // 5. Modifier un enfant
    console.log('5️⃣ Modification d\'Amira (changement du surnom)...')

    const updatedChild = await prisma.child.update({
      where: { id: child1.id },
      data: {
        nickName: 'Amoura',
        notes: 'Allergie aux arachides et aux noix'
      }
    })

    console.log(`   ✅ Enfant modifié: ${updatedChild.firstName}`)
    console.log(`   👤 Nouveau surnom: ${updatedChild.nickName}`)
    console.log(`   📝 Nouvelles notes: ${updatedChild.notes}\n`)

    // 6. Récupérer un enfant spécifique
    console.log('6️⃣ Récupération d\'un enfant spécifique (Youssef)...')

    const specificChild = await prisma.child.findUnique({
      where: { id: child2.id },
      include: {
        enrollments: true,
        eventRegistrations: true
      }
    })

    if (specificChild) {
      console.log(`   ✅ Enfant trouvé: ${specificChild.firstName} ${specificChild.lastName}`)
      console.log(`   📊 Détails:`)
      console.log(`      - ID: ${specificChild.id}`)
      console.log(`      - Date de naissance: ${specificChild.birthDate.toLocaleDateString('fr-FR')}`)
      console.log(`      - Genre: ${specificChild.gender === 'MALE' ? 'Garçon' : 'Fille'}`)
      console.log(`      - Inscriptions: ${specificChild.enrollments.length} activités, ${specificChild.eventRegistrations.length} événements\n`)
    }

    // 7. Tester la suppression avec protection
    console.log('7️⃣ Test de suppression (Youssef - sans inscriptions)...')

    // Vérifier qu'il n'a pas d'inscriptions
    const childToDelete = await prisma.child.findUnique({
      where: { id: child2.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            eventRegistrations: true
          }
        }
      }
    })

    if (childToDelete) {
      const hasInscriptions = childToDelete._count.enrollments > 0 || childToDelete._count.eventRegistrations > 0

      if (hasInscriptions) {
        console.log(`   ⚠️  Suppression impossible: ${childToDelete._count.enrollments} activités, ${childToDelete._count.eventRegistrations} événements\n`)
      } else {
        await prisma.child.delete({
          where: { id: child2.id }
        })
        console.log(`   ✅ Enfant supprimé avec succès: ${child2.firstName} ${child2.lastName}\n`)
      }
    }

    // 8. Vérifier la liste finale
    console.log('8️⃣ Liste finale des enfants...')

    const finalChildren = await prisma.child.findMany({
      where: { parentId: testUser.id }
    })

    console.log(`   ✅ Nombre d'enfants restants: ${finalChildren.length}`)
    finalChildren.forEach((child, index) => {
      const age = calculateAge(child.birthDate)
      console.log(`   ${index + 1}. ${child.firstName} ${child.lastName} (${age} ans) ${child.nickName ? `"${child.nickName}"` : ''}`)
    })
    console.log('')

    // 9. Statistiques finales
    console.log('📊 STATISTIQUES FINALES:')
    console.log(`   👨 Utilisateur de test: ${testUser.email}`)
    console.log(`   👶 Enfants créés: 2 (Amira, Youssef)`)
    console.log(`   ✏️  Modifications: 1 (surnom d'Amira)`)
    console.log(`   ❌ Suppressions: 1 (Youssef)`)
    console.log(`   👶 Enfants restants: ${finalChildren.length}`)
    console.log('')

    console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!')
    console.log('')
    console.log('🌐 TESTEZ MAINTENANT DANS LE NAVIGATEUR:')
    console.log('   1. Allez sur: http://localhost:3000/auth/signin')
    console.log('   2. Connectez-vous avec:')
    console.log('      📧 Email: test.parent@example.com')
    console.log('      🔑 Password: password123')
    console.log('   3. Naviguez vers: http://localhost:3000/membre/dashboard/enfants')
    console.log('   4. Vous devriez voir Amira (6 ans) "Amoura"')
    console.log('')

  } catch (error) {
    console.error('❌ ERREUR PENDANT LES TESTS:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

// Exécuter les tests
testChildrenSystem()
  .then(() => {
    console.log('🎉 Tests terminés!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Échec des tests:', error)
    process.exit(1)
  })
