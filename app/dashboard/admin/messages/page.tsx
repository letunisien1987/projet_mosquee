'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Mail, Phone, CheckCircle, Clock, Search, Filter, Reply } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ContactMessage {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  subject: string
  message: string
  read: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [readFilter, setReadFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyMessage, setReplyMessage] = useState<ContactMessage | null>(null)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/contact-messages')
      const data = await response.json()
      setMessages(data)

      setStats({
        total: data.length,
        read: data.filter((m: ContactMessage) => m.read).length,
        unread: data.filter((m: ContactMessage) => !m.read).length,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        fetchMessages()
      }
    } catch (error) {
      console.error('Erreur lors de la mise a jour:', error)
    }
  }

  const handleReply = (message: ContactMessage) => {
    setReplyMessage(message)
    setReplySubject(`Re: ${message.subject}`)
    setReplyBody('')
  }

  const sendReply = async () => {
    if (!replyMessage || !replyBody.trim()) {
      alert('Veuillez ecrire un message')
      return
    }

    setSendingReply(true)

    try {
      const response = await fetch('/api/admin/reply-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: replyMessage.email,
          toName: replyMessage.firstName,
          subject: replySubject,
          message: replyBody,
          originalMessage: replyMessage.message
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Email envoye avec succes !')
        setReplyMessage(null)
        setReplySubject('')
        setReplyBody('')

        if (!replyMessage.read) {
          await markAsRead(replyMessage.id)
        }
      } else {
        alert('Erreur : ' + (data.error || 'Impossible d\'envoyer l\'email'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi de l\'email')
    } finally {
      setSendingReply(false)
    }
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRead =
      readFilter === 'ALL' ||
      (readFilter === 'READ' && message.read) ||
      (readFilter === 'UNREAD' && !message.read)

    return matchesSearch && matchesRead
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages de Contact</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion des messages recus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <MessageSquare className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Non lus</p>
              <p className="text-3xl font-bold mt-2">{stats.unread}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lus</p>
              <p className="text-3xl font-bold mt-2">{stats.read}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as 'ALL' | 'READ' | 'UNREAD')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous</option>
              <option value="UNREAD">Non lus</option>
              <option value="READ">Lus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expediteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun message trouve
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!message.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {message.read ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${!message.read ? 'font-semibold' : ''} text-gray-900 dark:text-white`}>
                        {message.firstName} {message.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span>{message.email}</span>
                        </div>
                        {message.phone && (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{message.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${!message.read ? 'font-semibold' : ''} text-gray-900 dark:text-white`}>
                        {message.subject}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                        {message.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleReply(message)}
                          className="text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary-dark flex items-center gap-1"
                        >
                          <Reply className="h-3 w-3" />
                          Repondre
                        </button>
                        {!message.read && (
                          <button
                            onClick={() => markAsRead(message.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Marquer lu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detail du message */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Details du message</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                X
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">De</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedMessage.firstName} {selectedMessage.lastName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white">{selectedMessage.email}</p>
              </div>

              {selectedMessage.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telephone</label>
                  <p className="text-gray-900 dark:text-white">{selectedMessage.phone}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sujet</label>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedMessage.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</label>
                <p className="mt-2 whitespace-pre-wrap text-gray-900 dark:text-white">{selectedMessage.message}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                <p className="text-gray-900 dark:text-white">{format(new Date(selectedMessage.createdAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleReply(selectedMessage)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Reply className="h-4 w-4" />
                Repondre par email
              </button>
              {!selectedMessage.read && (
                <button
                  onClick={() => {
                    markAsRead(selectedMessage.id)
                    setSelectedMessage(null)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Marquer comme lu
                </button>
              )}
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reponse par email */}
      {replyMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setReplyMessage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Repondre par email</h3>
                <button
                  onClick={() => setReplyMessage(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  X
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">A :</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {replyMessage.firstName} {replyMessage.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{replyMessage.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Sujet</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Sujet du message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Votre message</label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Ecrivez votre reponse ici..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Le message sera envoye avec un template professionnel de la mosquee
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-primary">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Message original :</p>
                  <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">{replyMessage.subject}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {replyMessage.message}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {sendingReply ? 'Envoi en cours...' : 'Envoyer la reponse'}
                  </button>
                  <button
                    onClick={() => setReplyMessage(null)}
                    disabled={sendingReply}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredMessages.length} message{filteredMessages.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
