import { prisma } from '../lib/prisma'

/**
 * Script pour créer des données de démonstration pour un utilisateur
 *
 * Usage: npx tsx scripts/create-demo-data.ts
 */

async function createDemoData() {
  console.log('🎨 Création de données de démonstration\n')
  console.log('='.repeat(80))

  try {
    // Trouver ou créer l'utilisateur ahmedelghoudi@gmail.com
    const userEmail = 'ahmedelghoudi@gmail.com'
    let user = await prisma.user.findFirst({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé, création en cours...')
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('password123', 10)

      user = await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: 'Ahmed',
          lastName: 'El Ghoudi',
          role: 'MEMBER'
        }
      })
      console.log('✅ Utilisateur créé')
    }

    console.log(`\n✅ Utilisateur: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Nom: ${user.firstName} ${user.lastName}\n`)

    // 1. CRÉER DES DONS
    console.log('💰 Création de 3 dons...')
    const donations = await Promise.all([
      prisma.donation.create({
        data: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '+41 79 123 45 67',
          amount: 50.00,
          type: 'PROJECT',
          projectId: '1',
          projectName: 'Rénovation de la mosquée',
          message: 'Qu\'Allah accepte ce don',
          anonymous: false
        }
      }),
      prisma.donation.create({
        data: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '+41 79 123 45 67',
          amount: 100.00,
          type: 'PROJECT',
          projectId: '2',
          projectName: 'Aide aux nécessiteux',
          message: 'Pour aider les familles dans le besoin',
          anonymous: false
        }
      }),
      prisma.donation.create({
        data: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '+41 79 123 45 67',
          amount: 25.00,
          type: 'SADAQA',
          message: 'Pour les cours d\'arabe',
          anonymous: false
        }
      })
    ])
    console.log(`✅ ${donations.length} dons créés (Total: ${donations.reduce((sum, d) => sum + d.amount, 0)} CHF)\n`)

    // 2. CRÉER DES INSCRIPTIONS ÉVÉNEMENTS
    console.log('📅 Création de 2 inscriptions événements...')
    const eventRegs = await Promise.all([
      prisma.eventRegistration.create({
        data: {
          userId: user.id,
          eventId: '1',
          eventTitle: 'Conférence: Les bienfaits du Ramadan',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '+41 79 123 45 67',
          attendees: 2,
          status: 'CONFIRMED',
          notes: 'Je viens avec ma famille'
        }
      }),
      prisma.eventRegistration.create({
        data: {
          userId: user.id,
          eventId: '2',
          eventTitle: 'Iftar communautaire - Ramadan 2025',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '+41 79 123 45 67',
          attendees: 3,
          status: 'CONFIRMED'
        }
      })
    ])
    console.log(`✅ ${eventRegs.length} inscriptions événements créées\n`)

    // 3. CRÉER DES INSCRIPTIONS ACTIVITÉS
    console.log('📚 Création de 2 inscriptions activités...')

    // Vérifier si des enfants existent
    let children = await prisma.child.findMany({
      where: { parentId: user.id }
    })

    if (children.length === 0) {
      console.log('   Création de 2 enfants...')
      children = await Promise.all([
        prisma.child.create({
          data: {
            parentId: user.id,
            firstName: 'Youssef',
            lastName: user.lastName,
            birthDate: new Date('2015-03-15')
          }
        }),
        prisma.child.create({
          data: {
            parentId: user.id,
            firstName: 'Fatima',
            lastName: user.lastName,
            birthDate: new Date('2017-08-20')
          }
        })
      ])
      console.log(`   ✅ ${children.length} enfants créés`)
    }

    const enrollments = await Promise.all([
      prisma.enrollment.create({
        data: {
          userId: user.id,
          childId: children[0].id,
          activityIdOld: '1',
          activityTitle: 'Cours d\'Arabe - Niveau Débutant',
          status: 'APPROVED',
          notes: 'Mon fils est très motivé'
        }
      }),
      prisma.enrollment.create({
        data: {
          userId: user.id,
          childId: children[1].id,
          activityIdOld: '2',
          activityTitle: 'Tajweed - Perfectionnement',
          status: 'PENDING',
          notes: 'Ma fille a déjà des bases'
        }
      })
    ])
    console.log(`✅ ${enrollments.length} inscriptions activités créées\n`)

    // 4. CRÉER UNE COTISATION
    console.log('🎫 Création d\'une cotisation...')
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        type: 'FAMILY',
        status: 'ACTIVE',
        amount: 120.00,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      }
    })
    console.log(`✅ Cotisation créée (${membership.type} - ${membership.amount} CHF)\n`)

    // RÉSUMÉ
    console.log('='.repeat(80))
    console.log('📊 RÉSUMÉ DES DONNÉES CRÉÉES')
    console.log('='.repeat(80))
    console.log(`✅ Utilisateur: ${user.email}`)
    console.log(`✅ Dons: 3 (Total: 175 CHF)`)
    console.log(`✅ Événements: 2 inscriptions`)
    console.log(`✅ Activités: 2 inscriptions`)
    console.log(`✅ Enfants: ${children.length}`)
    console.log(`✅ Cotisation: 1 (Active jusqu'au ${membership.endDate.toLocaleDateString('fr-FR')})`)
    console.log('\n🎉 Données de démonstration créées avec succès !')
    console.log('\n💡 Connectez-vous avec:')
    console.log(`   Email: ${userEmail}`)
    console.log(`   Password: password123`)
    console.log('\n🔗 Allez sur: http://localhost:3000/connexion')

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoData()
