import { config } from 'dotenv'
import { sendWelcomeEmail } from '../lib/email'

// Charger les variables d'environnement
config()

/**
 * Script de test pour vérifier que l'envoi d'emails fonctionne
 *
 * Usage: npx tsx scripts/test-email.ts
 */

async function testEmail() {
  console.log('🧪 Test d\'envoi d\'email...\n')

  // Remplacez par votre email pour recevoir le test
  // IMPORTANT: Utilisez EXACTEMENT le même email que celui du compte Resend
  const testEmail = 'ahmedelghoudi@gmail.com'
  const firstName = 'Ahmed'

  console.log(`📧 Envoi d'un email de test à : ${testEmail}`)
  console.log('⏳ Veuillez patienter...\n')

  try {
    const result = await sendWelcomeEmail(testEmail, firstName)

    if (result.success) {
      console.log('✅ Email envoyé avec succès !')
      console.log('\n📊 Détails:')
      console.log(JSON.stringify(result.data, null, 2))
      console.log('\n💡 Vérifiez votre boîte de réception (et les spams si besoin)')
      console.log('🔗 Vous pouvez aussi vérifier sur https://resend.com/emails')
    } else {
      console.log('❌ Erreur lors de l\'envoi')
      console.log('Détails:', result.error)

      if (!process.env.RESEND_API_KEY) {
        console.log('\n⚠️  RESEND_API_KEY n\'est pas configurée dans le fichier .env')
        console.log('Ajoutez votre clé API dans le fichier .env :')
        console.log('RESEND_API_KEY=re_votre_cle_ici')
      }
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

testEmail()
