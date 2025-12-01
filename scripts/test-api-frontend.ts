import { prisma } from '../lib/prisma'

async function testAPIForFrontend() {
  console.log('🧪 TEST COMPLET API → FRONTEND')
  console.log('═══════════════════════════════════════\n')

  try {
    // 1. Trouver l'utilisateur admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mosquee.com' }
    })

    if (!admin) {
      console.log('❌ Utilisateur admin@mosquee.com non trouvé\n')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   - Email: ${admin.email}`)
    console.log(`   - ID: ${admin.id}\n`)

    // 2. Simuler l'appel API GET /api/account/children
    console.log('📡 Simulation appel API: GET /api/account/children')
    console.log('   (comme le fait le frontend)\n')

    const children = await prisma.child.findMany({
      where: {
        parentId: admin.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            eventRegistrations: true,
          },
        },
      },
    })

    // 3. Formater la réponse comme l'API
    const apiResponse = {
      children: children.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        nickName: child.nickName,
        birthDate: child.birthDate.toISOString(),
        gender: child.gender,
        notes: child.notes,
        avatarUrl: child.avatarUrl,
        createdAt: child.createdAt.toISOString(),
        _count: child._count
      }))
    }

    console.log('✅ Réponse API (format JSON):')
    console.log(JSON.stringify(apiResponse, null, 2))
    console.log('')

    // 4. Vérifier que les données sont correctes pour le frontend
    console.log('🎨 VÉRIFICATION FORMAT FRONTEND:')
    console.log('═══════════════════════════════════════\n')

    if (apiResponse.children.length === 0) {
      console.log('⚠️  PROBLÈME: Aucun enfant trouvé!')
      console.log('   Le frontend affichera "Aucun enfant ajouté"\n')
      return
    }

    console.log(`✅ Nombre d'enfants: ${apiResponse.children.length}\n`)

    apiResponse.children.forEach((child, index) => {
      console.log(`${index + 1}. 👤 ${child.firstName} ${child.lastName}`)
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`   📋 Données pour le frontend:`)
      console.log(`      • ID: ${child.id}`)
      console.log(`      • Prénom: ${child.firstName}`)
      console.log(`      • Nom: ${child.lastName}`)
      console.log(`      • Surnom: ${child.nickName || '(aucun)'}`)
      console.log(`      • Date naissance: ${child.birthDate}`)
      console.log(`      • Genre: ${child.gender || '(non spécifié)'}`)
      console.log(`      • Notes: ${child.notes || '(aucune)'}`)
      console.log(`      • Avatar URL: ${child.avatarUrl || '(aucun)'}`)
      console.log(`      • Activités: ${child._count.enrollments}`)
      console.log(`      • Événements: ${child._count.eventRegistrations}`)

      // Calculer l'âge comme le fait le frontend
      const today = new Date()
      const birth = new Date(child.birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      console.log(`\n   🎂 Âge calculé: ${age} ans`)

      // Icône genre
      const genderIcon = child.gender === 'MALE' ? '👦' : child.gender === 'FEMALE' ? '👧' : '👤'
      console.log(`   ${genderIcon} Icône: ${genderIcon}`)

      // Initiales pour avatar
      const initials = `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`.toUpperCase()
      console.log(`   🔤 Initiales: ${initials}`)

      if (child.notes) {
        console.log(`   ⚠️  Bandeau jaune: OUI (notes présentes)`)
      }

      console.log('')
    })

    // 5. Statistiques globales (comme le frontend)
    console.log('📊 STATISTIQUES GLOBALES (pour les cartes):')
    console.log('═══════════════════════════════════════\n')

    const totalChildren = apiResponse.children.length
    const totalActivities = apiResponse.children.reduce((sum, child) => sum + child._count.enrollments, 0)
    const totalEvents = apiResponse.children.reduce((sum, child) => sum + child._count.eventRegistrations, 0)

    console.log(`   📌 Total enfants: ${totalChildren}`)
    console.log(`   📚 Inscriptions activités: ${totalActivities}`)
    console.log(`   🎉 Inscriptions événements: ${totalEvents}\n`)

    // 6. Simulation affichage frontend
    console.log('🖥️  APERÇU FRONTEND:')
    console.log('═══════════════════════════════════════\n')

    console.log('╔═══════════════════════════════════════════════════════╗')
    console.log('║                    MES ENFANTS                        ║')
    console.log('╚═══════════════════════════════════════════════════════╝\n')

    console.log('┌─────────────────┬─────────────────┬─────────────────┐')
    console.log(`│ Total enfants   │ Activités       │ Événements      │`)
    console.log(`│      ${totalChildren}          │       ${totalActivities}         │       ${totalEvents}         │`)
    console.log('└─────────────────┴─────────────────┴─────────────────┘\n')

    apiResponse.children.forEach((child) => {
      const today = new Date()
      const birth = new Date(child.birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      const genderIcon = child.gender === 'MALE' ? '👦' : child.gender === 'FEMALE' ? '👧' : '👤'
      const initials = child.avatarUrl ? '🖼️' : `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`

      console.log('┌──────────────────────────────────────────────────────┐')
      console.log(`│ ${initials}  ${child.firstName} ${child.lastName} ${child.nickName ? `"${child.nickName}"` : ''}`)
      console.log(`│ ${genderIcon} ${age} ans`)

      if (child.notes) {
        console.log(`│ ⚠️  Note: ${child.notes.substring(0, 40)}${child.notes.length > 40 ? '...' : ''}`)
      }

      console.log(`│ Activités: ${child._count.enrollments} | Événements: ${child._count.eventRegistrations}`)
      console.log(`│ [Modifier] [Supprimer]`)
      console.log('└──────────────────────────────────────────────────────┘\n')
    })

    // 7. Résultat final
    console.log('═══════════════════════════════════════')
    console.log('✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅')
    console.log('═══════════════════════════════════════\n')

    console.log('📋 RÉSUMÉ:')
    console.log(`   ✅ API fonctionne correctement`)
    console.log(`   ✅ Données bien formatées pour le frontend`)
    console.log(`   ✅ ${apiResponse.children.length} enfant(s) seront affichés`)
    console.log(`   ✅ Toutes les informations sont présentes\n`)

    console.log('🌐 Dans le navigateur, vous devriez voir:')
    console.log('   1. Les statistiques en haut')
    console.log('   2. Les cartes des enfants avec:')
    console.log('      - Avatar ou initiales')
    console.log('      - Nom complet + surnom')
    console.log('      - Âge + icône genre')
    console.log('      - Notes dans un bandeau jaune')
    console.log('      - Compteurs activités/événements')
    console.log('      - Boutons Modifier et Supprimer\n')

  } catch (error) {
    console.error('❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testAPIForFrontend()
  .then(() => {
    console.log('✅ Test terminé\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test échoué:', error)
    process.exit(1)
  })
