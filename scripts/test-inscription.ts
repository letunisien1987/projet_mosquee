import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { createUserProfile, createNotification } from '../lib/directus'

async function testInscription() {
  try {
    console.log('🧪 Test d\'inscription...')

    // Données de test
    const testUser = {
      email: 'test@mosquee.ch',
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User',
      phone: '0791234567',
      address: 'Rue de Test 1',
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    })

    if (existingUser) {
      console.log('❌ L\'utilisateur existe déjà. Suppression...')
      await prisma.user.delete({
        where: { id: existingUser.id },
      })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(testUser.password, 10)

    // Créer l'utilisateur
    console.log('👤 Création de l\'utilisateur...')
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        phone: testUser.phone,
        address: testUser.address,
        role: 'MEMBER',
      },
    })

    console.log('✅ Utilisateur créé:', user.id)

    // Créer le profil dans Directus
    console.log('📝 Création du profil Directus...')
    const profile = await createUserProfile({
      user_id: user.id,
      city: '',
      postal_code: '',
      country: 'Suisse',
      date_of_birth: null,
      bio: '',
      preferred_language: 'fr',
      notification_email: true,
      notification_sms: false,
      newsletter: true,
    })

    if (profile) {
      console.log('✅ Profil Directus créé:', profile.id)
    } else {
      console.log('⚠️  Erreur lors de la création du profil Directus')
    }

    // Créer une notification de bienvenue
    console.log('🔔 Création de la notification...')
    const notification = await createNotification({
      user_id: user.id,
      type: 'SYSTEM',
      title: 'Bienvenue !',
      message: 'Votre compte a été créé avec succès. Bienvenue sur l\'espace membre de la Mosquée Madretsch.',
      link: '/membre/dashboard',
      read: false,
    })

    if (notification) {
      console.log('✅ Notification créée:', notification.id)
    } else {
      console.log('⚠️  Erreur lors de la création de la notification')
    }

    console.log('\n✅ Test d\'inscription réussi!')
    console.log('\n📧 Email:', testUser.email)
    console.log('🔑 Mot de passe:', testUser.password)
    console.log('\n🔗 Connexion: http://localhost:3000/connexion')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInscription()
