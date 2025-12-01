/**
 * Script pour créer des données de démo dans Directus
 * Exécuter avec: npx tsx scripts/seed-directus-demo.ts
 */

import 'dotenv/config'
import { createDirectus, rest, staticToken, createItems, createItem } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN

if (!DIRECTUS_TOKEN) {
  console.error('❌ DIRECTUS_TOKEN manquant dans .env')
  process.exit(1)
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

async function main() {
  console.log('🚀 Création des données de démo...\n')

  try {
    // Ajouter un suffix unique pour éviter les conflits
    const suffix = Date.now().toString().slice(-4)
    // 1. TEAM MEMBERS
    console.log('👥 Création des membres de l\'équipe...')
    const teamMembers = await client.request(
      createItems('team_members', [
        {
          name: 'Imam Mohammed Al-Khattabi',
          role: 'imam',
          bio: 'Imam de la mosquée depuis 2015, diplômé de l\'université Al-Azhar.',
          email: 'imam@mosquee-madretsch.ch',
          phone: '+41 32 123 45 67',
          order: 1,
          active: true,
        },
        {
          name: 'Ahmed Bennani',
          role: 'president',
          bio: 'Président de l\'association depuis 2018.',
          email: 'president@mosquee-madretsch.ch',
          order: 2,
          active: true,
        },
        {
          name: 'Fatima Zahra',
          role: 'teacher',
          bio: 'Enseignante d\'arabe et de Coran pour enfants.',
          email: 'fatima@mosquee-madretsch.ch',
          order: 3,
          active: true,
        },
        {
          name: 'Youssef El-Amine',
          role: 'treasurer',
          bio: 'Trésorier de l\'association.',
          email: 'tresorier@mosquee-madretsch.ch',
          order: 4,
          active: true,
        },
      ])
    )
    console.log(`✅ ${teamMembers.length} membres créés\n`)

    // Récupérer les IDs pour les relations (convertir en string car Directus peut retourner des IDs numériques)
    const imamId = String(teamMembers[0].id)
    const teacherId = String(teamMembers[2].id)
    const presidentId = String(teamMembers[1].id)

    // 2. EVENTS
    console.log('📅 Création des événements...')
    const events = await client.request(
      createItems('events', [
        {
          title: 'Conférence: La patience en Islam',
          slug: 'conference-patience-islam',
          description: 'Conférence sur l\'importance de la patience dans la vie du musulman.',
          content: '<p>Rejoignez-nous pour une conférence enrichissante sur la patience (Sabr) en Islam.</p>',
          category: 'religieux',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 jours
          start_time: '19:00',
          end_time: '21:00',
          location: 'Mosquée Madretsch',
          registration_required: true,
          max_capacity: 100,
          requires_approval: false,
          featured: true,
          published: true,
        },
        {
          title: 'Iftar communautaire - Ramadan 2025',
          slug: 'iftar-communautaire-ramadan-2025',
          description: 'Repas de rupture du jeûne ouvert à tous.',
          content: '<p>Venez partager un moment de convivialité lors de notre iftar communautaire.</p>',
          category: 'communaute',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 jours
          start_time: '18:30',
          end_time: '20:30',
          attendees: '150 personnes attendues',
          registration_required: true,
          max_capacity: 150,
          requires_approval: false,
          featured: true,
          published: true,
        },
        {
          title: 'Journée portes ouvertes',
          slug: 'journee-portes-ouvertes',
          description: 'Découvrez notre mosquée et ses activités.',
          content: '<p>Une journée pour découvrir l\'Islam et visiter notre mosquée.</p>',
          category: 'communaute',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +21 jours
          start_time: '10:00',
          end_time: '17:00',
          registration_required: false,
          featured: false,
          published: true,
        },
        {
          title: 'Collecte de fonds pour la Palestine',
          slug: 'collecte-palestine',
          description: 'Événement caritatif pour soutenir nos frères et sœurs en Palestine.',
          content: '<p>Participez à notre collecte de fonds pour venir en aide aux Palestiniens.</p>',
          category: 'charite',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
          start_time: '14:00',
          end_time: '18:00',
          registration_required: false,
          featured: false,
          published: true,
        },
      ])
    )
    console.log(`✅ ${events.length} événements créés\n`)

    // 3. ACTIVITIES
    console.log('🎓 Création des activités...')
    const activities = await client.request(
      createItems('activities', [
        {
          title: 'Cours de Coran pour enfants (6-12 ans)',
          slug: 'coran-enfants-6-12',
          category: 'coran',
          description: 'Apprentissage de la lecture et mémorisation du Coran.',
          content: '<p>Cours adapté aux enfants de 6 à 12 ans avec une pédagogie ludique.</p>',
          level: 'Débutant à Intermédiaire',
          age_group: '6-12 ans',
          schedule: 'Mercredi 16h00 - 17h30, Samedi 10h00 - 11h30',
          // instructor: teacherId, // Relation à créer manuellement dans l'admin
          max_participants: 20,
          requires_approval: false,
          price: 30,
          active: true,
          enrollment_open: true,
        },
        {
          title: 'Cours d\'arabe pour adultes',
          slug: 'arabe-adultes',
          category: 'arabe',
          description: 'Apprentissage de la langue arabe classique.',
          content: '<p>Cours pour débutants souhaitant apprendre à lire et écrire l\'arabe.</p>',
          level: 'Débutant',
          age_group: 'Adultes',
          schedule: 'Lundi et Jeudi 19h00 - 20h30',
          // instructor: imamId, // Relation à créer manuellement dans l'admin
          max_participants: 15,
          requires_approval: false,
          price: 50,
          active: true,
          enrollment_open: true,
        },
        {
          title: 'École du dimanche',
          slug: 'ecole-dimanche',
          category: 'ecole',
          description: 'Programme éducatif islamique pour enfants.',
          content: '<p>Enseignement des bases de l\'Islam, du Coran et de la langue arabe.</p>',
          level: 'Tous niveaux',
          age_group: '5-14 ans',
          schedule: 'Dimanche 9h00 - 12h00',
          // instructor: teacherId, // Relation à créer manuellement dans l'admin
          max_participants: 30,
          requires_approval: false,
          price: 25,
          active: true,
          enrollment_open: true,
        },
        {
          title: 'Tajweed avancé',
          slug: 'tajweed-avance',
          category: 'tajweed',
          description: 'Perfectionnement de la récitation coranique.',
          content: '<p>Cours avancé pour maîtriser les règles du Tajweed.</p>',
          level: 'Avancé',
          age_group: 'Adultes et adolescents',
          schedule: 'Vendredi 17h00 - 18h30',
          // instructor: imamId, // Relation à créer manuellement dans l'admin
          max_participants: 10,
          requires_approval: true,
          price: 40,
          active: true,
          enrollment_open: true,
        },
        {
          title: 'Halaqat hebdomadaire',
          slug: 'halaqat-hebdomadaire',
          category: 'halaqat',
          description: 'Cercle d\'étude hebdomadaire sur les sciences islamiques.',
          content: '<p>Discussions et études de textes religieux chaque semaine.</p>',
          level: 'Tous niveaux',
          age_group: 'Adultes',
          schedule: 'Mardi 20h00 - 21h30',
          // instructor: imamId, // Relation à créer manuellement dans l'admin
          max_participants: 25,
          requires_approval: false,
          price: 0,
          active: true,
          enrollment_open: true,
        },
      ])
    )
    console.log(`✅ ${activities.length} activités créées\n`)

    // 4. ARTICLES
    console.log('📰 Création des articles...')
    const articles = await client.request(
      createItems('articles', [
        {
          title: 'Bienvenue sur le nouveau site de la mosquée',
          slug: 'bienvenue-nouveau-site',
          excerpt: 'Nous sommes heureux de vous présenter notre nouveau site web.',
          content: '<p>Après plusieurs mois de travail, nous sommes fiers de vous présenter notre nouveau site internet. Vous y trouverez toutes les informations sur nos activités, événements et services.</p>',
          category: 'announcement',
          // author: presidentId, // Relation à créer manuellement dans l'admin // Président
          published_at: new Date().toISOString(),
          featured: true,
          published: true,
        },
        {
          title: 'Ramadan 2025: Préparatifs et horaires',
          slug: 'ramadan-2025-preparatifs',
          excerpt: 'Informations importantes pour le mois béni de Ramadan.',
          content: '<p>Le mois de Ramadan approche. Retrouvez ici tous les horaires de prières, les iftars communautaires et les activités spéciales organisées durant ce mois béni.</p>',
          category: 'religious',
          // author: imamId, // Relation à créer manuellement dans l'admin
          published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 jours
          featured: true,
          published: true,
        },
        {
          title: 'Succès de la collecte pour la Syrie',
          slug: 'succes-collecte-syrie',
          excerpt: 'Merci à tous pour votre générosité.',
          content: '<p>Grâce à votre générosité, nous avons collecté 15\'000 CHF pour venir en aide aux victimes du tremblement de terre en Syrie. Qu\'Allah vous récompense.</p>',
          category: 'community',
          // author: presidentId, // Relation à créer manuellement dans l'admin
          published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5 jours
          featured: false,
          published: true,
        },
      ])
    )
    console.log(`✅ ${articles.length} articles créés\n`)

    // 5. PROJECTS
    console.log('💰 Création des projets de dons...')
    const projects = await client.request(
      createItems('projects', [
        {
          title: 'Rénovation de la mosquée',
          slug: 'renovation-mosquee',
          description: 'Travaux de rénovation et d\'agrandissement de la salle de prière.',
          content: '<p>Notre mosquée a besoin de travaux de rénovation pour accueillir dignement nos fidèles. Votre contribution nous aidera à améliorer les infrastructures.</p>',
          goal_amount: 50000,
          current_amount: 12500,
          priority: 1,
          active: true,
        },
        {
          title: 'Aide aux orphelins en Palestine',
          slug: 'aide-orphelins-palestine',
          description: 'Soutien aux enfants orphelins de Palestine.',
          content: '<p>Participez à notre projet pour venir en aide aux orphelins palestiniens. Chaque don compte.</p>',
          goal_amount: 20000,
          current_amount: 8500,
          priority: 2,
          active: true,
        },
        {
          title: 'Achat de livres pour la bibliothèque',
          slug: 'bibliotheque-livres',
          description: 'Enrichissement de notre bibliothèque islamique.',
          content: '<p>Aidez-nous à développer notre bibliothèque en acquérant de nouveaux livres sur les sciences islamiques.</p>',
          goal_amount: 5000,
          current_amount: 3200,
          priority: 3,
          active: true,
        },
      ])
    )
    console.log(`✅ ${projects.length} projets créés\n`)

    // 6. MOSQUE SETTINGS
    console.log('⚙️  Création des paramètres de la mosquée...')
    await client.request(
      createItem('mosque_settings', {
        name: 'Mosquée Madretsch',
        description: 'La Mosquée Madretsch est un lieu de culte et de rassemblement pour la communauté musulmane de Bienne et ses environs.',
        address_street: 'Rue de la Mosquée 12',
        address_city: 'Bienne',
        address_postal_code: '2503',
        address_country: 'Suisse',
        contact_email: 'contact@mosquee-madretsch.ch',
        contact_phone: '+41 32 123 45 67',
        contact_phone2: '+41 79 123 45 67',
        bank_iban: 'CH93 0076 2011 6238 5295 7',
        bank_bic: 'POFICHBEXXX',
        bank_account_holder: 'Association Mosquée Madretsch',
        twint: '+41 79 123 45 67',
        social_facebook: 'https://facebook.com/mosquee-madretsch',
        social_instagram: 'https://instagram.com/mosquee_madretsch',
        opening_hours: 'Ouvert tous les jours\nPrières du Fajr jusqu\'à Isha',
        capacity: 200,
      })
    )
    console.log('✅ Paramètres créés\n')

    // 7. JUMUA MESSAGES
    console.log('🕌 Création des messages Joumou\'a...')
    const jumuaMessages = await client.request(
      createItems('jumua_messages', [
        {
          title: 'Joumou\'a Moubarak',
          message: 'Que la paix et les bénédictions d\'Allah soient sur vous en ce jour béni du vendredi.',
          times: ['12:30', '13:30'],
          is_active: true,
          order: 1,
        },
        {
          title: 'Horaires de la prière du vendredi',
          message: 'Premier prêche: 12h30 (en arabe)\nDeuxième prêche: 13h30 (en français)\n\nMerci d\'arriver 15 minutes avant.',
          is_active: true,
          order: 2,
        },
        {
          title: 'Rappel',
          message: 'N\'oubliez pas de libérer votre place après la prière pour permettre à nos frères de prier dans de bonnes conditions.',
          is_active: true,
          order: 3,
        },
      ])
    )
    console.log(`✅ ${jumuaMessages.length} messages Joumou'a créés\n`)

    // 8. GALLERIES
    console.log('📸 Création des galeries...')
    const galleries = await client.request(
      createItems('galleries', [
        {
          title: 'Iftar Ramadan 2024',
          description: 'Photos de notre iftar communautaire du mois de Ramadan 2024.',
          category: 'events',
          date: '2024-03-15',
          published: true,
        },
        {
          title: 'Mosquée Madretsch',
          description: 'Photos de notre mosquée et de ses installations.',
          category: 'mosque',
          published: true,
        },
      ])
    )
    console.log(`✅ ${galleries.length} galeries créées\n`)

    console.log('🎉 Toutes les données de démo ont été créées avec succès !')
    console.log('\n📊 Résumé:')
    console.log(`   - ${teamMembers.length} membres d'équipe`)
    console.log(`   - ${events.length} événements`)
    console.log(`   - ${activities.length} activités`)
    console.log(`   - ${articles.length} articles`)
    console.log(`   - ${projects.length} projets`)
    console.log(`   - ${jumuaMessages.length} messages Joumou'a`)
    console.log(`   - ${galleries.length} galeries`)
    console.log('   - 1 configuration mosquée\n')
    console.log('🌐 Accédez à Directus Admin: http://localhost:8055')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()
