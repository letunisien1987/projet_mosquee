import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const donationId = formData.get('donationId') as string | null

    // Si un don spécifique est demandé
    if (donationId) {
      const donation = await prisma.donation.findFirst({
        where: {
          id: donationId,
          userId: session.user.id,
        },
      })

      if (!donation) {
        return NextResponse.json({ error: 'Don non trouvé' }, { status: 404 })
      }

      // Générer le PDF pour un seul don
      const pdfBuffer = await generateDonationReceipt(donation, session.user)

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="recu-don-${donation.id}.pdf"`,
        },
      })
    } else {
      // Générer le reçu fiscal annuel
      const currentYear = new Date().getFullYear()
      const donations = await prisma.donation.findMany({
        where: {
          userId: session.user.id,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`),
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (donations.length === 0) {
        return NextResponse.json(
          { error: 'Aucun don trouvé pour cette année' },
          { status: 404 }
        )
      }

      const pdfBuffer = await generateAnnualReceipt(donations, session.user, currentYear)

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="recu-fiscal-${currentYear}.pdf"`,
        },
      })
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

async function generateDonationReceipt(donation: any, user: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // En-tête
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Mosquée Al-Nour', { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .text('Rue de Madretsch, 2503 Biel/Bienne', { align: 'center' })
      .text('info@mosquee-alnour.ch', { align: 'center' })
      .moveDown(2)

    // Titre
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('REÇU DE DON', { align: 'center' })
      .moveDown(2)

    // Informations du donateur
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Donateur:')
      .font('Helvetica')
      .text(`${user.firstName} ${user.lastName}`)
      .text(user.email)
      .moveDown()

    // Informations du don
    doc
      .font('Helvetica-Bold')
      .text('Détails du don:')
      .font('Helvetica')
      .text(`Date: ${new Date(donation.createdAt).toLocaleDateString('fr-FR')}`)
      .text(`Type: ${donation.type}`)

    if (donation.projectName) {
      doc.text(`Projet: ${donation.projectName}`)
    }

    doc
      .moveDown()
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Montant: ${donation.amount.toFixed(2)} CHF`)
      .moveDown(2)

    // Mention légale
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        'Ce reçu atteste du don effectué. Conformément à la législation suisse, les dons à des institutions religieuses peuvent être déductibles fiscalement selon votre canton de résidence.',
        { align: 'justify' }
      )
      .moveDown(2)

    // Signature
    doc
      .fontSize(12)
      .text(`Biel/Bienne, le ${new Date().toLocaleDateString('fr-FR')}`)
      .moveDown()
      .text('Pour la Mosquée Al-Nour')

    doc.end()
  })
}

async function generateAnnualReceipt(
  donations: any[],
  user: any,
  year: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // En-tête
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Mosquée Al-Nour', { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .text('Rue de Madretsch, 2503 Biel/Bienne', { align: 'center' })
      .text('info@mosquee-alnour.ch', { align: 'center' })
      .moveDown(2)

    // Titre
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`REÇU FISCAL ANNUEL ${year}`, { align: 'center' })
      .moveDown(2)

    // Informations du donateur
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Donateur:')
      .font('Helvetica')
      .text(`${user.firstName} ${user.lastName}`)
      .text(user.email)

    if (user.address) {
      doc.text(user.address)
    }

    doc.moveDown(2)

    // Tableau des dons
    doc
      .font('Helvetica-Bold')
      .text(`Récapitulatif des dons pour l'année ${year}:`)
      .moveDown()

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

    // Liste des dons
    donations.forEach((donation, index) => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `${index + 1}. ${new Date(donation.createdAt).toLocaleDateString('fr-FR')} - ${
            donation.type
          }${donation.projectName ? ` (${donation.projectName})` : ''} - ${donation.amount.toFixed(
            2
          )} CHF`
        )
    })

    doc.moveDown(2)

    // Total
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`TOTAL DES DONS: ${totalAmount.toFixed(2)} CHF`)
      .moveDown(2)

    // Statistiques
    const donationsByType = donations.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + d.amount
      return acc
    }, {} as Record<string, number>)

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Répartition par type:')
      .font('Helvetica')

    Object.entries(donationsByType).forEach(([type, amount]) => {
      doc.text(`- ${type}: ${(amount as number).toFixed(2)} CHF`)
    })

    doc.moveDown(2)

    // Mention légale
    doc
      .fontSize(10)
      .text(
        `Ce reçu atteste des dons effectués durant l'année ${year}. Conformément à la législation suisse, les dons à des institutions religieuses peuvent être déductibles fiscalement selon votre canton de résidence. Veuillez consulter votre administration fiscale cantonale pour plus d'informations.`,
        { align: 'justify' }
      )
      .moveDown(2)

    // Signature
    doc
      .fontSize(12)
      .text(`Biel/Bienne, le ${new Date().toLocaleDateString('fr-FR')}`)
      .moveDown()
      .text('Pour la Mosquée Al-Nour')

    doc.end()
  })
}
