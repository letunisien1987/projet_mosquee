# 📧💳 SYSTÈME COMPLET : NOTIFICATIONS, PAIEMENTS & LISTE D'ATTENTE

**Date** : 1er décembre 2025
**Complément de** : `SYSTEME_GESTION_ENFANTS.md`

---

## 🎯 FONCTIONNALITÉS AJOUTÉES

### 1. Notifications Multi-Canal
### 2. Système de Paiement (Stripe)
### 3. Liste d'Attente Automatique
### 4. Emails Automatisés
### 5. Rappels Avant Événements

---

## 📊 ARCHITECTURE ÉTENDUE

### 1. Nouveaux Modèles Prisma

#### `Payment` - Gestion des Paiements

```prisma
model Payment {
  id                String             @id @default(uuid()) @db.Uuid
  userId            String             @db.Uuid
  user              User               @relation(fields: [userId], references: [id])

  // Type de paiement
  type              PaymentType        // EVENT, ACTIVITY, MEMBERSHIP, DONATION
  referenceId       String             // ID de l'événement, activité, etc.
  referenceName     String             // Nom de l'événement pour affichage

  // Montant
  amount            Decimal            @db.Decimal(10, 2)
  currency          String             @default("CHF")

  // Stripe
  stripePaymentIntentId String?        @unique
  stripePaymentStatus   StripePaymentStatus?

  // Statut
  status            PaymentStatus      @default(PENDING)
  paidAt            DateTime?

  // Métadonnées
  metadata          Json?              // Infos additionnelles

  // Relations
  eventRegistrationId String?          @db.Uuid
  eventRegistration   EventRegistration? @relation(fields: [eventRegistrationId], references: [id])

  enrollmentId      String?            @db.Uuid
  enrollment        Enrollment?        @relation(fields: [enrollmentId], references: [id])

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([userId])
  @@index([stripePaymentIntentId])
  @@index([status])
}

enum PaymentType {
  EVENT
  ACTIVITY
  MEMBERSHIP
  DONATION
}

enum PaymentStatus {
  PENDING           // En attente
  COMPLETED         // Payé
  FAILED            // Échec
  REFUNDED          // Remboursé
  CANCELLED         // Annulé
}

enum StripePaymentStatus {
  requires_payment_method
  requires_confirmation
  requires_action
  processing
  succeeded
  canceled
}
```

#### `Notification` - Notifications Utilisateur

```prisma
model Notification {
  id                String             @id @default(uuid()) @db.Uuid
  userId            String             @db.Uuid
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Type de notification
  type              NotificationType
  title             String
  message           String

  // Action liée (optionnel)
  actionUrl         String?            // URL vers l'inscription, paiement, etc.
  actionLabel       String?            // "Voir l'inscription", "Payer maintenant"

  // Statut
  read              Boolean            @default(false)
  readAt            DateTime?

  // Métadonnées
  metadata          Json?              // Données supplémentaires

  createdAt         DateTime           @default(now())

  @@index([userId, read])
  @@index([createdAt])
}

enum NotificationType {
  REGISTRATION_CONFIRMED    // Inscription confirmée
  REGISTRATION_PENDING      // Inscription en attente d'approbation
  REGISTRATION_APPROVED     // Inscription approuvée
  REGISTRATION_REJECTED     // Inscription rejetée
  WAITING_LIST_ADDED        // Ajouté à la liste d'attente
  SPOT_AVAILABLE            // Place disponible (promu de liste d'attente)
  PAYMENT_REQUIRED          // Paiement requis
  PAYMENT_RECEIVED          // Paiement reçu
  EVENT_REMINDER            // Rappel événement (J-3, J-1)
  EVENT_CANCELLED           // Événement annulé
  REGISTRATION_CANCELLED    // Inscription annulée
}
```

#### `WaitingList` - Liste d'Attente

```prisma
model WaitingList {
  id                String             @id @default(uuid()) @db.Uuid
  userId            String             @db.Uuid
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Type
  type              WaitingListType    // EVENT, ACTIVITY
  referenceId       String             // ID de l'événement ou activité
  referenceName     String

  // Pour un enfant ?
  childId           String?            @db.Uuid
  child             Child?             @relation(fields: [childId], references: [id], onDelete: Cascade)

  // Position dans la file
  position          Int                @default(0)

  // Statut
  status            WaitingListStatus  @default(WAITING)
  notifiedAt        DateTime?          // Quand notifié qu'une place est disponible
  expiresAt         DateTime?          // Expiration de la notification (24h)

  // Contact
  email             String
  phone             String

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([referenceId, status])
  @@index([userId])
  @@index([expiresAt])
}

enum WaitingListType {
  EVENT
  ACTIVITY
}

enum WaitingListStatus {
  WAITING           // En attente
  NOTIFIED          // Notifié qu'une place est disponible
  PROMOTED          // Promu (inscription confirmée)
  EXPIRED           // Notification expirée (n'a pas confirmé à temps)
  CANCELLED         // Annulé par l'utilisateur
}
```

#### Modifications des Modèles Existants

**EventRegistration** :
```prisma
model EventRegistration {
  // ... champs existants ...

  // NOUVEAU : Statut étendu
  status            RegistrationStatus @default(PENDING)

  // NOUVEAU : Paiement
  paymentRequired   Boolean            @default(false)
  paymentAmount     Decimal?           @db.Decimal(10, 2)
  paymentId         String?            @db.Uuid
  payments          Payment[]

  // NOUVEAU : Timestamps
  approvedAt        DateTime?
  rejectedAt        DateTime?
  cancelledAt       DateTime?
}

enum RegistrationStatus {
  PENDING           // En attente d'approbation
  PENDING_PAYMENT   // En attente de paiement
  CONFIRMED         // Confirmé (payé si requis)
  REJECTED          // Refusé
  CANCELLED         // Annulé
  WAITING_LIST      // Liste d'attente
}
```

**User** :
```prisma
model User {
  // ... champs existants ...

  // NOUVEAU : Relations
  notifications     Notification[]
  payments          Payment[]
  waitingLists      WaitingList[]

  // Préférences notifications
  emailNotifications Boolean @default(true)
  smsNotifications   Boolean @default(false)
}
```

---

### 2. API Routes Étendues

#### Paiements

**`/api/payments/create-intent` (POST)**
Crée un PaymentIntent Stripe pour une inscription

```json
{
  "type": "EVENT",
  "referenceId": "event-id",
  "amount": 50.00,
  "currency": "CHF",
  "registrationId": "uuid"
}
```

**`/api/payments/webhook` (POST)**
Webhook Stripe pour confirmer les paiements

**`/api/payments/[id]/refund` (POST)**
Rembourser un paiement

#### Notifications

**`/api/notifications` (GET)**
Liste des notifications de l'utilisateur connecté
- Query: `?read=false` (non lues)

**`/api/notifications/[id]/read` (PATCH)**
Marquer comme lue

**`/api/notifications/mark-all-read` (POST)**
Marquer toutes comme lues

#### Liste d'Attente

**`/api/waiting-list/join` (POST)**
Rejoindre la liste d'attente

```json
{
  "type": "EVENT",
  "referenceId": "event-id",
  "childId": "child-id" // optionnel
}
```

**`/api/waiting-list/[id]/cancel` (DELETE)**
Se retirer de la liste d'attente

**`/api/waiting-list/[id]/accept` (POST)**
Accepter la place disponible (24h)

#### Admin

**`/api/admin/registrations/[id]/approve` (POST)**
Approuver une inscription en attente

**`/api/admin/registrations/[id]/reject` (POST)**
Rejeter une inscription

**`/api/admin/events/[id]/promote-waiting-list` (POST)**
Promouvoir manuellement de la liste d'attente

---

### 3. Flux de Paiement (Stripe)

#### Événement/Activité Payante

```
┌─────────────────────────────────────────────────────┐
│ FLUX INSCRIPTION AVEC PAIEMENT                      │
└─────────────────────────────────────────────────────┘

1. Utilisateur s'inscrit à "Camp d'Été" (CHF 50.-)
   ↓
2. API vérifie si places disponibles
   ├─ OUI → Continue
   └─ NON → Proposition liste d'attente
   ↓
3. Inscription créée avec status = PENDING_PAYMENT
   ↓
4. Redirection vers page de paiement
   ├─ Affiche montant : CHF 50.-
   ├─ Formulaire Stripe Elements (carte bancaire)
   └─ Bouton "Payer maintenant"
   ↓
5. Clic "Payer"
   ├─ Appel /api/payments/create-intent
   ├─ Stripe génère PaymentIntent
   └─ Confirmation paiement (3D Secure si requis)
   ↓
6. Webhook Stripe → /api/payments/webhook
   ├─ Vérifie signature
   ├─ Met à jour Payment.status = COMPLETED
   └─ Met à jour Registration.status = CONFIRMED
   ↓
7. Email de confirmation envoyé
   ├─ "Votre inscription est confirmée"
   ├─ Reçu de paiement (CHF 50.-)
   └─ Détails événement
   ↓
8. Notification in-app
   "✅ Paiement reçu pour Camp d'Été"
```

#### Configuration Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
```

#### Composant Paiement

```tsx
// components/StripePaymentForm.tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function StripePaymentForm({ clientSecret, amount, onSuccess }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  )
}
```

---

### 4. Système de Notifications

#### Types de Notifications

| Type | Déclencheur | Message | Action |
|------|-------------|---------|--------|
| REGISTRATION_CONFIRMED | Inscription confirmée | "Votre inscription à [Événement] est confirmée !" | Voir l'inscription |
| REGISTRATION_PENDING | Inscription soumise | "Votre inscription est en attente d'approbation" | Voir l'inscription |
| REGISTRATION_APPROVED | Admin approuve | "✅ Votre inscription à [Événement] a été approuvée !" | Payer maintenant |
| PAYMENT_REQUIRED | Après approbation | "💳 Paiement requis pour confirmer votre inscription" | Payer maintenant |
| PAYMENT_RECEIVED | Paiement confirmé | "✅ Paiement reçu ! Votre place est réservée" | Voir le reçu |
| WAITING_LIST_ADDED | Événement complet | "Vous êtes sur la liste d'attente (position #3)" | Voir la position |
| SPOT_AVAILABLE | Place libérée | "🎉 Une place s'est libérée ! Confirmez dans 24h" | Accepter la place |
| EVENT_REMINDER | 3 jours avant | "📅 Rappel : [Événement] dans 3 jours" | Voir les détails |
| EVENT_CANCELLED | Admin annule | "❌ [Événement] a été annulé. Remboursement en cours" | Voir les détails |

#### Service d'Envoi d'Emails

```typescript
// lib/email-service.ts
import nodemailer from 'nodemailer'
import { renderEmailTemplate } from './email-templates'

export async function sendNotificationEmail(
  to: string,
  type: NotificationType,
  data: any
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const { subject, html } = renderEmailTemplate(type, data)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}
```

#### Templates d'Emails

**Inscription Confirmée** :
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #10B981; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { background: #059669; color: white; padding: 12px 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Inscription Confirmée</h1>
    </div>
    <div class="content">
      <p>Bonjour {{firstName}},</p>
      <p>Votre inscription à <strong>{{eventTitle}}</strong> est confirmée !</p>

      <h3>Détails de l'événement</h3>
      <ul>
        <li>📅 Date : {{eventDate}}</li>
        <li>⏰ Heure : {{eventTime}}</li>
        <li>📍 Lieu : {{eventLocation}}</li>
      </ul>

      {{#if paymentAmount}}
      <h3>Paiement</h3>
      <p>Montant payé : <strong>CHF {{paymentAmount}}</strong></p>
      {{/if}}

      <a href="{{viewUrl}}" class="button">Voir mon inscription</a>
    </div>
  </div>
</body>
</html>
```

**Place Disponible (Liste d'Attente)** :
```html
<div class="header" style="background: #F59E0B;">
  <h1>🎉 Une place s'est libérée !</h1>
</div>
<div class="content">
  <p>Bonne nouvelle ! Une place est disponible pour <strong>{{eventTitle}}</strong>.</p>

  <div class="alert" style="background: #FEF3C7; padding: 15px;">
    ⏰ Vous avez <strong>24 heures</strong> pour confirmer votre inscription.
  </div>

  <a href="{{acceptUrl}}" class="button">Accepter la place</a>
  <a href="{{declineUrl}}" class="button-secondary">Décliner</a>
</div>
```

---

### 5. Liste d'Attente Automatique

#### Logique

```typescript
// Quand un utilisateur s'inscrit à un événement complet
async function handleFullEvent(eventId: string, userData: any) {
  // Vérifier si complet
  const isFull = await checkEventCapacity(eventId)

  if (isFull) {
    // Ajouter à la liste d'attente
    const position = await getNextWaitingListPosition(eventId)

    const waitingEntry = await prisma.waitingList.create({
      data: {
        userId: userData.userId,
        type: 'EVENT',
        referenceId: eventId,
        referenceName: eventData.title,
        childId: userData.childId,
        position,
        email: userData.email,
        phone: userData.phone,
      }
    })

    // Notification
    await createNotification({
      userId: userData.userId,
      type: 'WAITING_LIST_ADDED',
      title: 'Ajouté à la liste d'attente',
      message: `Vous êtes en position #${position} pour ${eventData.title}`,
    })

    // Email
    await sendNotificationEmail(
      userData.email,
      'WAITING_LIST_ADDED',
      { position, eventTitle: eventData.title }
    )

    return { status: 'WAITING_LIST', position }
  }
}

// Quand une inscription est annulée
async function onRegistrationCancelled(registrationId: string) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId }
  })

  // Promouvoir le premier de la liste d'attente
  const nextInLine = await prisma.waitingList.findFirst({
    where: {
      referenceId: registration.eventId,
      type: 'EVENT',
      status: 'WAITING',
    },
    orderBy: { position: 'asc' }
  })

  if (nextInLine) {
    // Mettre à jour le statut
    await prisma.waitingList.update({
      where: { id: nextInLine.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      }
    })

    // Notification
    await createNotification({
      userId: nextInLine.userId,
      type: 'SPOT_AVAILABLE',
      title: '🎉 Une place est disponible !',
      message: `Une place s'est libérée pour ${registration.eventTitle}`,
      actionUrl: `/waiting-list/${nextInLine.id}/accept`,
      actionLabel: 'Accepter la place',
    })

    // Email urgent
    await sendNotificationEmail(
      nextInLine.email,
      'SPOT_AVAILABLE',
      { eventTitle: registration.eventTitle, expiresAt: nextInLine.expiresAt }
    )
  }
}
```

#### Cron Job - Expiration Liste d'Attente

```typescript
// scripts/cron-waiting-list-expiry.ts
import { prisma } from '@/lib/prisma'

export async function expireWaitingListNotifications() {
  const now = new Date()

  // Trouver les notifications expirées
  const expired = await prisma.waitingList.findMany({
    where: {
      status: 'NOTIFIED',
      expiresAt: { lt: now },
    }
  })

  for (const entry of expired) {
    // Marquer comme expiré
    await prisma.waitingList.update({
      where: { id: entry.id },
      data: { status: 'EXPIRED' }
    })

    // Promouvoir le suivant
    await promoteNextInLine(entry.referenceId, entry.type)
  }
}

// À exécuter toutes les heures
// Avec Vercel Cron ou autre service
```

---

### 6. Rappels Automatiques

#### Cron Job - Rappels Événements

```typescript
// scripts/cron-event-reminders.ts
export async function sendEventReminders() {
  const now = new Date()
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // Rappel J-3
  await sendRemindersForDate(threeDaysFromNow, 'J-3')

  // Rappel J-1
  await sendRemindersForDate(oneDayFromNow, 'J-1')
}

async function sendRemindersForDate(targetDate: Date, label: string) {
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      status: 'CONFIRMED',
      event: {
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        }
      },
      // Éviter de renvoyer si déjà envoyé
      reminderSentAt: null,
    },
    include: { event: true, user: true }
  })

  for (const reg of registrations) {
    await createNotification({
      userId: reg.userId,
      type: 'EVENT_REMINDER',
      title: `📅 Rappel : ${reg.event.title} ${label}`,
      message: `N'oubliez pas ! L'événement a lieu ${label}`,
    })

    await sendNotificationEmail(
      reg.email,
      'EVENT_REMINDER',
      { eventTitle: reg.event.title, eventDate: reg.event.date, label }
    )

    // Marquer comme envoyé
    await prisma.eventRegistration.update({
      where: { id: reg.id },
      data: { reminderSentAt: new Date() }
    })
  }
}
```

---

### 7. Interface Utilisateur

#### Badge Notifications (Header)

```tsx
// components/NotificationBell.tsx
export function NotificationBell() {
  const { data: notifications } = useSWR('/api/notifications?read=false')
  const unreadCount = notifications?.length || 0

  return (
    <button className="relative">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  )
}
```

#### Page Notifications

```tsx
// app/membre/dashboard/notifications/page.tsx
export default function NotificationsPage() {
  const { data: notifications } = useSWR('/api/notifications')

  return (
    <div>
      <h1>Notifications</h1>
      {notifications?.map(notif => (
        <NotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  )
}
```

#### Modal Paiement

```tsx
// components/PaymentModal.tsx
export function PaymentModal({ registration, amount, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null)

  useEffect(() => {
    // Créer PaymentIntent
    fetch('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        registrationId: registration.id,
        amount
      })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret))
  }, [])

  if (!clientSecret) return <Loading />

  return (
    <StripePaymentForm
      clientSecret={clientSecret}
      amount={amount}
      onSuccess={onSuccess}
    />
  )
}
```

---

## 📧 EMAILS AUTOMATIQUES

### Récapitulatif

| Événement | Email | Destinataire | Contenu |
|-----------|-------|--------------|---------|
| Inscription créée (approval requis) | En attente d'approbation | Utilisateur | "Votre inscription sera examinée" |
| Inscription créée (pas d'approval) | Confirmation | Utilisateur | "Inscription confirmée !" |
| Inscription approuvée | Approuvée | Utilisateur | "Approuvé ! Payer maintenant" |
| Paiement reçu | Reçu de paiement | Utilisateur | "Paiement confirmé CHF XX" |
| Ajouté liste d'attente | Position liste d'attente | Utilisateur | "Position #3 en liste d'attente" |
| Place disponible | Place disponible | Utilisateur | "Une place est libre ! 24h pour confirmer" |
| Rappel J-3 | Rappel événement | Utilisateur | "Événement dans 3 jours" |
| Rappel J-1 | Rappel événement | Utilisateur | "Événement demain !" |
| Inscription annulée | Annulation | Utilisateur | "Votre inscription a été annulée" |
| Remboursement | Remboursement | Utilisateur | "CHF XX remboursé" |

---

## 🔄 WORKFLOW COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW COMPLET : INSCRIPTION → PAIEMENT → CONFIRMATION   │
└─────────────────────────────────────────────────────────────┘

1. UTILISATEUR S'INSCRIT
   ↓
2. SYSTÈME VÉRIFIE PLACES
   ├─ Complet ? → Liste d'attente
   └─ Disponible ? → Continue
   ↓
3. INSCRIPTION CRÉÉE
   ├─ Requires approval ? → Status PENDING
   │  ├─ Email "En attente"
   │  ├─ Notification in-app
   │  └─ Attend admin approval
   │
   └─ Pas d'approval ? → Continue
   ↓
4. VÉRIFICATION PAIEMENT
   ├─ Paiement requis ? → Status PENDING_PAYMENT
   │  ├─ Email "Payer maintenant"
   │  ├─ Notification in-app
   │  ├─ Redirection Stripe
   │  └─ Attend paiement
   │
   └─ Gratuit ? → Status CONFIRMED
      ├─ Email "Confirmé !"
      └─ Notification in-app
   ↓
5. PAIEMENT (si requis)
   ├─ Utilisateur paie
   ├─ Webhook Stripe
   ├─ Update Status → CONFIRMED
   ├─ Email "Reçu paiement"
   └─ Notification in-app
   ↓
6. RAPPELS AUTOMATIQUES
   ├─ J-3 : Email + Notification
   ├─ J-1 : Email + Notification
   └─ J-0 : Bon événement !
```

---

## 📊 TABLEAU DE BORD ADMIN

### Page Gestion Inscriptions

```
┌──────────────────────────────────────────────────────────┐
│ INSCRIPTIONS EN ATTENTE (12)                             │
├──────┬─────────────────┬────────┬─────────┬─────────────┤
│ Nom  │ Événement       │ Type   │ Montant │ Actions     │
├──────┼─────────────────┼────────┼─────────┼─────────────┤
│ Ahmed│ Camp Été        │ Enfant │ CHF 50  │[✓][✗]      │
│ Sarah│ Conférence      │ Adulte │ Gratuit │[✓][✗]      │
└──────┴─────────────────┴────────┴─────────┴─────────────┘

Actions rapides :
[✓] = Approuver → Email envoyé + Demande paiement si requis
[✗] = Rejeter → Email envoyé
```

### Statistiques Paiements

```
┌─────────────────────────────────────────┐
│ REVENUS DU MOIS                         │
├─────────────────────────────────────────┤
│ Total : CHF 2,450.-                     │
│ ├─ Événements : CHF 1,200.-             │
│ ├─ Activités : CHF 1,000.-              │
│ └─ Dons : CHF 250.-                     │
├─────────────────────────────────────────┤
│ En attente : CHF 350.-                  │
│ Remboursements : CHF 100.-              │
└─────────────────────────────────────────┘
```

---

## 🛠️ CONFIGURATION REQUISE

### Variables d'Environnement

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@mosquee.ch
SMTP_PASS=***
EMAIL_FROM="Mosquée de Bienne <noreply@mosquee.ch>"

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Webhooks Stripe

Configurer dans Stripe Dashboard :
- URL : `https://votre-domaine.com/api/payments/webhook`
- Événements :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`

---

## 📁 NOUVEAUX FICHIERS

```
prisma/
  migrations/
    xxx_add_payments_notifications_waitlist/

lib/
  stripe.ts
  email-service.ts
  email-templates.ts
  notification-service.ts

app/
  api/
    payments/
      create-intent/route.ts
      webhook/route.ts
      [id]/refund/route.ts
    notifications/
      route.ts
      [id]/read/route.ts
      mark-all-read/route.ts
    waiting-list/
      join/route.ts
      [id]/accept/route.ts
      [id]/cancel/route.ts
    admin/
      registrations/
        [id]/approve/route.ts
        [id]/reject/route.ts

  membre/
    dashboard/
      notifications/page.tsx
      paiements/page.tsx

components/
  NotificationBell.tsx
  NotificationCard.tsx
  NotificationsList.tsx
  PaymentModal.tsx
  StripePaymentForm.tsx
  WaitingListStatus.tsx

scripts/
  cron-event-reminders.ts
  cron-waiting-list-expiry.ts
```

---

## ⏱️ TEMPS D'IMPLÉMENTATION ADDITIONNEL

| Phase | Tâches | Temps |
|-------|--------|-------|
| Paiements Stripe | Modèle, API, Webhooks | 4-5h |
| Notifications | Modèle, API, UI | 3-4h |
| Liste d'attente | Logique, Promotions auto | 3-4h |
| Emails | Templates, Service | 2-3h |
| Rappels | Cron jobs | 1-2h |
| Admin approvals | UI + API | 2-3h |
| Tests complets | E2E tous workflows | 3-4h |
| **TOTAL** | | **18-25h** |

**TOTAL SYSTÈME COMPLET** : 30-43 heures

---

**Ce système offre une expérience complète de gestion d'inscriptions avec paiements, notifications et liste d'attente automatique !** 🚀
