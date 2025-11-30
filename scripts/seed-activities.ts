import { PrismaClient, ActivityCategory } from '@prisma/client'

const prisma = new PrismaClient()

const activities = [
  {
    title: 'Cours de Coran',
    description: 'Apprentissage de la lecture du Coran avec tajweed pour tous les niveaux',
    category: ActivityCategory.QURAN,
    icon: 'BookOpen',
    color: 'primary',
    order: 1,
    levels: [
      {
        name: 'Débutants',
        schedule: 'Samedi 10h00 - 12h00',
        instructor: 'Cheikh Abdallah',
        participants: '15-20 étudiants',
        details: 'Apprentissage des bases : alphabet arabe, prononciation, et premières sourates',
        minAge: 7,
        maxAge: null,
        price: 30,
        maxCapacity: 20,
        order: 1,
      },
      {
        name: 'Intermédiaire',
        schedule: 'Samedi 14h00 - 16h00',
        instructor: 'Hafidh Ibrahim',
        participants: '12-15 étudiants',
        details: 'Perfectionnement du tajweed et mémorisation de Juz Amma',
        minAge: 10,
        maxAge: null,
        price: 30,
        maxCapacity: 15,
        order: 2,
      },
      {
        name: 'Avancé (Hifz)',
        schedule: 'Samedi & Dimanche 9h00 - 11h00',
        instructor: 'Hafidh Youssef',
        participants: '8-10 étudiants',
        details: 'Programme de mémorisation complète du Coran',
        minAge: 12,
        maxAge: null,
        price: 50,
        maxCapacity: 10,
        order: 3,
      },
    ],
  },
  {
    title: "Cours d'Arabe",
    description: 'Apprentissage de la langue arabe littéraire pour enfants et adultes',
    category: ActivityCategory.ARABIC,
    icon: 'GraduationCap',
    color: 'accent',
    order: 2,
    levels: [
      {
        name: 'Enfants (6-10 ans)',
        schedule: 'Mercredi 14h00 - 15h30',
        instructor: 'Mme Fatima',
        participants: '15-18 enfants',
        details: 'Apprentissage ludique : alphabet, vocabulaire de base, et phrases simples',
        minAge: 6,
        maxAge: 10,
        price: 30,
        maxCapacity: 18,
        order: 1,
      },
      {
        name: 'Adolescents (11-17 ans)',
        schedule: 'Mercredi 16h00 - 17h30',
        instructor: 'M. Youssef',
        participants: '12-15 étudiants',
        details: 'Grammaire, conjugaison, lecture et conversation',
        minAge: 11,
        maxAge: 17,
        price: 30,
        maxCapacity: 15,
        order: 2,
      },
      {
        name: 'Adultes Débutants',
        schedule: 'Jeudi 19h00 - 20h30',
        instructor: 'M. Ahmed',
        participants: '10-12 étudiants',
        details: 'Base de la langue arabe : lecture, écriture et grammaire élémentaire',
        minAge: 18,
        maxAge: null,
        price: 30,
        maxCapacity: 12,
        order: 3,
      },
      {
        name: 'Adultes Avancés',
        schedule: 'Mardi 19h00 - 20h30',
        instructor: 'Dr. Karim',
        participants: '8-10 étudiants',
        details: 'Étude de textes classiques, littérature arabe et conversation avancée',
        minAge: 18,
        maxAge: null,
        price: 30,
        maxCapacity: 10,
        order: 4,
      },
    ],
  },
  {
    title: 'École du Dimanche',
    description: 'Éducation islamique complète pour les enfants de 5 à 15 ans',
    category: ActivityCategory.SUNDAY_SCHOOL,
    icon: 'Users',
    color: 'primary',
    order: 3,
    levels: [
      {
        name: 'Petit Groupe (5-7 ans)',
        schedule: 'Dimanche 10h00 - 11h30',
        instructor: 'Mme Aïcha & Mme Khadija',
        participants: '20-25 enfants',
        details: 'Histoires des Prophètes, bonnes manières islamiques, prières de base',
        minAge: 5,
        maxAge: 7,
        price: 30,
        maxCapacity: 25,
        order: 1,
      },
      {
        name: 'Moyen Groupe (8-11 ans)',
        schedule: 'Dimanche 10h00 - 12h00',
        instructor: 'M. Omar & Mme Hafsa',
        participants: '25-30 enfants',
        details: 'Aqida, Fiqh, histoire islamique, et valeurs morales',
        minAge: 8,
        maxAge: 11,
        price: 30,
        maxCapacity: 30,
        order: 2,
      },
      {
        name: 'Grand Groupe (12-15 ans)',
        schedule: 'Dimanche 14h00 - 16h00',
        instructor: 'Cheikh Mohammed & M. Hassan',
        participants: '15-20 jeunes',
        details: 'Islam contemporain, débats, questions-réponses, et projets communautaires',
        minAge: 12,
        maxAge: 15,
        price: 30,
        maxCapacity: 20,
        order: 3,
      },
    ],
  },
  {
    title: "Cercles d'Étude (Halaqat)",
    description: 'Discussion et apprentissage sur des sujets islamiques variés',
    category: ActivityCategory.HALAQAT,
    icon: 'Users',
    color: 'primary',
    order: 4,
    levels: [
      {
        name: 'Halaqat hebdomadaire',
        schedule: 'Tous les vendredis après Asr',
        instructor: 'Imam de la mosquée',
        participants: '30-40 participants',
        details: 'Discussion et apprentissage sur des sujets islamiques variés',
        minAge: 16,
        maxAge: null,
        price: 0,
        maxCapacity: 50,
        order: 1,
      },
    ],
  },
  {
    title: 'Cours pour Femmes',
    description: 'Enseignements islamiques et discussions dans un cadre réservé aux sœurs',
    category: ActivityCategory.WOMEN,
    icon: 'BookOpen',
    color: 'accent',
    order: 5,
    levels: [
      {
        name: 'Session hebdomadaire',
        schedule: 'Samedis 15h00 - 16h30',
        instructor: 'Enseignante qualifiée',
        participants: '20-25 sœurs',
        details: 'Enseignements islamiques et discussions dans un cadre réservé aux sœurs',
        minAge: 18,
        maxAge: null,
        price: 0,
        maxCapacity: 30,
        order: 1,
      },
    ],
  },
  {
    title: 'Soutien Scolaire',
    description: 'Aide aux devoirs pour les élèves du primaire et collège',
    category: ActivityCategory.SUPPORT,
    icon: 'GraduationCap',
    color: 'primary',
    order: 6,
    levels: [
      {
        name: 'Primaire (6-11 ans)',
        schedule: 'Mercredis 17h00 - 18h30',
        instructor: 'Équipe pédagogique',
        participants: '15-20 élèves',
        details: 'Aide aux devoirs et soutien scolaire pour élèves du primaire',
        minAge: 6,
        maxAge: 11,
        price: 20,
        maxCapacity: 20,
        order: 1,
      },
      {
        name: 'Collège (12-15 ans)',
        schedule: 'Samedis 17h00 - 18h30',
        instructor: 'Équipe pédagogique',
        participants: '12-15 élèves',
        details: 'Aide aux devoirs et soutien scolaire pour collégiens',
        minAge: 12,
        maxAge: 15,
        price: 20,
        maxCapacity: 15,
        order: 2,
      },
    ],
  },
]

async function main() {
  console.log('🌱 Début du seed des activités...')

  for (const activityData of activities) {
    const { levels, ...activity } = activityData

    console.log(`\n📚 Création de l'activité: ${activity.title}`)

    const createdActivity = await prisma.activity.create({
      data: {
        ...activity,
        levels: {
          create: levels,
        },
      },
      include: {
        levels: true,
      },
    })

    console.log(`   ✅ Créé avec ${createdActivity.levels.length} niveaux`)
  }

  console.log('\n✨ Seed terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
