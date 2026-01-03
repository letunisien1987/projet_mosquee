'use client'

import { useState } from 'react'
import { User, Mail, Phone, Send, X, Loader2 } from 'lucide-react'
import type { OrganizerInfo } from '@/lib/content'

interface OrganizerContactProps {
  organizer: OrganizerInfo
  itemType: 'event' | 'activity'
  itemId: string
  itemTitle: string
}

export function OrganizerContact({ organizer, itemType, itemId, itemTitle }: OrganizerContactProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    email: '',
    subject: `[${itemType === 'event' ? 'Événement' : 'Activité'}] ${itemTitle}`,
    message: ''
  })

  const hasVisibleInfo = organizer.showName || organizer.showEmail || organizer.showPhone
  if (!hasVisibleInfo) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizerEmail: organizer.email,
          itemType,
          itemId,
          itemTitle
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData(prev => ({ ...prev, email: '', message: '' }))
        setTimeout(() => {
          setIsModalOpen(false)
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Carte organisateur */}
      <div className="bg-card border border-border rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Organisateur</h4>

        <div className="space-y-2">
          {/* Nom */}
          {organizer.showName && (organizer.firstName || organizer.lastName) && (
            <div className="flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{organizer.firstName} {organizer.lastName}</span>
            </div>
          )}

          {/* Téléphone */}
          {organizer.showPhone && organizer.phone && (
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${organizer.phone}`} className="hover:text-primary transition-colors">
                {organizer.phone}
              </a>
            </div>
          )}

          {/* Bouton Contacter (si email affiché) */}
          {organizer.showEmail && organizer.email && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contacter l&apos;organisateur
            </button>
          )}
        </div>
      </div>

      {/* Modal de contact */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Contacter l&apos;organisateur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {submitStatus === 'success' ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <Send className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-medium">Message envoyé !</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    L&apos;organisateur vous répondra prochainement.
                  </p>
                </div>
              ) : (
                <>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Votre email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Sujet */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Sujet
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                      readOnly
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Votre message <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Votre question ou demande d'information..."
                    />
                  </div>

                  {submitStatus === 'error' && (
                    <p className="text-sm text-destructive">
                      Une erreur est survenue. Veuillez réessayer.
                    </p>
                  )}

                  {/* Boutons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
