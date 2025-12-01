'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Heart } from 'lucide-react'

interface TamaroWidgetProps {
  language?: 'fr' | 'de' | 'en' | 'it'
  testMode?: boolean
  onPaymentComplete?: (data: any) => void // Callback quand don complété
}

export default function TamaroWidget({
  language = 'fr',
  testMode = false,
  onPaymentComplete,
}: TamaroWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const uuid = process.env.NEXT_PUBLIC_RAISENOW_UUID

  useEffect(() => {
    // Initialiser le widget une fois que le script est chargé
    if (scriptLoaded && typeof window !== 'undefined' && (window as any).rnw && uuid) {
      (window as any).rnw.tamaro.runWidget('.rnw-widget-container', {
        // Configuration de base
        language: language,
        testMode: testMode,
        debug: testMode, // Afficher les logs en mode test

        // Montants suggérés (en CHF ou EUR selon votre config RaiseNow)
        amounts: [50, 100, 200, 500],
        defaultAmount: 100,

        // Types de paiement disponibles
        paymentMethods: ['card', 'twint', 'paypal', 'postfinance', 'sepa'],

        // Objectifs de dons (purposes)
        purposes: [
          { id: 'general', label: 'Don général' },
          { id: 'zakat', label: 'Zakat' },
          { id: 'sadaqa', label: 'Sadaqa' },
          { id: 'renovation', label: 'Rénovation mosquée' },
          { id: 'education', label: 'Éducation & Cours' },
          { id: 'ramadan', label: 'Campagne Ramadan' },
        ],

        // Champs personnalisés (demander infos au donateur)
        customFields: [
          {
            id: 'donor_type',
            type: 'dropdown',
            label: 'Type de donateur',
            required: false,
            options: [
              { value: 'individual', label: 'Particulier' },
              { value: 'company', label: 'Entreprise' },
              { value: 'association', label: 'Association' },
            ],
          },
          {
            id: 'message',
            type: 'text',
            label: 'Message (optionnel)',
            required: false,
            placeholder: 'Votre message pour la mosquée...',
          },
        ],

        // Personnalisation visuelle
        theme: {
          colors: {
            primary: '#059669',   // Couleur principale (emerald-600)
            secondary: '#D4AF37', // Couleur or/accent
          },
        },

        // Textes personnalisés
        translations: {
          fr: {
            'payment.amount.label': 'Montant de votre don',
            'payment.recurring.label': 'Don récurrent',
            'payment.button.label': 'Faire un don',
            'payment.success.title': 'Merci pour votre générosité !',
            'payment.success.message': 'Que Allah vous récompense pour votre don.',
          },
        },

        // Callbacks pour récupérer les informations
        callbacks: {
          // Quand le paiement est complété
          paymentComplete: (data: any) => {
            console.log('Don complété:', data)

            // Enregistrer le don dans votre base de données
            if (onPaymentComplete) {
              onPaymentComplete(data)
            }

            // Vous pouvez aussi envoyer à une API
            fetch('/api/donations/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: data.amount,
                currency: data.currency,
                purpose: data.purpose,
                transactionId: data.epp_transaction_id,
                donorEmail: data.email,
                donorName: `${data.first_name} ${data.last_name}`,
                customFields: data.custom_fields,
                timestamp: new Date().toISOString(),
              }),
            }).catch(err => console.error('Erreur enregistrement don:', err))
          },

          // Quand le formulaire est affiché
          formReady: () => {
            console.log('Formulaire de don prêt')
          },

          // En cas d'erreur
          error: (error: any) => {
            console.error('Erreur widget Tamaro:', error)
          },
        },
      })
    }
  }, [scriptLoaded, uuid, language, testMode, onPaymentComplete])

  const handleScriptLoad = () => {
    console.log('Tamaro widget script loaded')
    setScriptLoaded(true)
  }

  if (!uuid) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          Configuration manquante
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          La variable NEXT_PUBLIC_RAISENOW_UUID n'est pas définie dans .env
        </p>
      </div>
    )
  }

  // Si le script n'a pas pu se charger, afficher un bouton de redirection
  if (scriptError) {
    return (
      <div className="text-center">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Widget temporairement indisponible</strong>
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            L'UUID RaiseNow n'est pas encore activé. Utilisez le bouton ci-dessous pour faire votre don.
          </p>
        </div>

        <a
          href="https://donate.raisenow.io/ftwhv?lng=fr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-bold text-lg px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <Heart className="h-6 w-6" />
          Faire un don maintenant
        </a>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Vous serez redirigé vers notre plateforme de paiement sécurisée RaiseNow
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Charger le script Tamaro */}
      <Script
        src={`https://tamaro.raisenow.com/${uuid}/latest/widget.js`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error('Erreur lors du chargement du script Tamaro:', e)
          console.error('UUID utilisé:', uuid)
          console.error('L\'UUID n\'est probablement pas encore activé sur RaiseNow')
          setScriptError(true)
        }}
      />

      {/* Container pour le widget */}
      <div className="rnw-widget-container w-full min-h-[400px]">
        {!scriptLoaded && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Chargement du formulaire de don...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
