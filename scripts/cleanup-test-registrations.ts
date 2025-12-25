import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  // Trouver les inscriptions avec des IDs de test
  const testRegistrations = await prisma.eventRegistration.findMany({
    where: {
      eventId: {
        startsWith: 'test-'
      }
    }
  })
  
  console.log(`Found ${testRegistrations.length} test event registrations:`)
  testRegistrations.forEach(r => {
    console.log(`  - ${r.id}: ${r.eventTitle} (eventId: ${r.eventId})`)
  })
  
  // Supprimer les inscriptions de test
  if (testRegistrations.length > 0) {
    const deleted = await prisma.eventRegistration.deleteMany({
      where: {
        eventId: {
          startsWith: 'test-'
        }
      }
    })
    console.log(`\nDeleted ${deleted.count} test registrations`)
  }
  
  // Vérifier aussi les enrollments de test
  const testEnrollments = await prisma.enrollment.findMany({
    where: {
      activityId: {
        startsWith: 'test-'
      }
    }
  })
  
  console.log(`\nFound ${testEnrollments.length} test activity enrollments`)
  
  if (testEnrollments.length > 0) {
    const deleted = await prisma.enrollment.deleteMany({
      where: {
        activityId: {
          startsWith: 'test-'
        }
      }
    })
    console.log(`Deleted ${deleted.count} test enrollments`)
  }
  
  await prisma.$disconnect()
}

cleanup().catch(console.error)
