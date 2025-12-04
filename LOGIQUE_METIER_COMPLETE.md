# LOGIQUE METIER COMPLETE - PROJET MOSQUEE

> Document de reference technique - Derniere mise a jour: 3 Decembre 2025

---

## TABLE DES MATIERES

1. [Architecture Globale](#1-architecture-globale)
2. [Prisma - Base de Donnees](#2-prisma---base-de-donnees)
3. [Directus - CMS](#3-directus---cms)
4. [Stripe - Paiements](#4-stripe---paiements)
5. [Resend - Emails](#5-resend---emails)
6. [Flux Metier Complets](#6-flux-metier-complets)
7. [Securite](#7-securite)

---

## 1. ARCHITECTURE GLOBALE

### Double Stockage de Donnees

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                    │
├─────────────────────────────────────────────────────────────┤
│                              │                               │
│     ┌───────────────────────┴───────────────────────┐       │
│     │                                               │       │
│     ▼                                               ▼       │
│ ┌─────────────────┐                    ┌─────────────────┐  │
│ │   DIRECTUS CMS  │                    │ POSTGRESQL      │  │
│ │ (Port 8055)     │                    │ (Prisma ORM)    │  │
│ ├─────────────────┤                    ├─────────────────┤  │
│ │ CONTENU:        │                    │ TRANSACTIONNEL: │  │
│ │ - Events        │◄──── IDs ────────►│ - Users         │  │
│ │ - Activities    │    (String)        │ - Children      │  │
│ │ - Projects      │                    │ - Memberships   │  │
│ │ - Team Members  │                    │ - Donations     │  │
│ │ - Articles      │                    │ - Enrollments   │  │
│ │ - Jumua Msgs    │                    │ - EventRegistr. │  │
│ │ - Gallery       │                    │ - Payments      │  │
│ │ - Settings      │                    │ - Notifications │  │
│ └─────────────────┘                    └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Principe de Reference

- **Directus** = Contenu gere par admin (evenements, activites)
- **Prisma** = Donnees transactionnelles (users, inscriptions, paiements)
- **References** = IDs String de Directus stockes dans Prisma
- **Denormalisation** = Titres copies dans Prisma pour performance

---

## 2. PRISMA - BASE DE DONNEES

### Modeles Principaux

#### User (Utilisateur)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash
  firstName String
  lastName  String
  phone     String?
  address   String?
  role      UserRole @default(MEMBER)

  // Relations
  children           Child[]
  memberships        Membership[]
  donations          Donation[]
  eventRegistrations EventRegistration[]
  enrollments        Enrollment[]
  notifications      Notification[]
  payments           Payment[]
}

enum UserRole {
  ADMIN    // Acces complet
  IMAM     // Gestion religieuse
  TEACHER  // Enseignant
  STAFF    // Personnel
  MANAGER  // Gestionnaire activites/evenements
  MEMBER   // Membre standard
}
```

#### Child (Enfant)
```prisma
model Child {
  id        String   @id @default(uuid())
  firstName String
  lastName  String
  nickName  String?
  birthDate DateTime
  gender    String?  // "MALE" | "FEMALE"
  notes     String?  // allergies, infos medicales
  avatarUrl String?
  parentId  String   // FK User - cascade delete

  // Relations
  parent             User @relation(fields: [parentId])
  enrollments        Enrollment[]
  eventRegistrations EventRegistration[]
}
```

#### Enrollment (Inscription Activite)
```prisma
model Enrollment {
  id              String           @id @default(uuid())
  userId          String?
  childId         String?
  activityId      String           // ID Directus
  activityTitle   String           // Denormalise
  status          EnrollmentStatus @default(PENDING)
  requiresPayment Boolean          @default(false)
  paymentAmount   Float?
  paymentId       String?
  paymentToken    String?          // Token lien paiement
  paymentExpiresAt DateTime?       // 7 jours
  notes           String?
}

enum EnrollmentStatus {
  PENDING            // En attente approbation
  APPROVED           // Approuve, attente paiement si payant
  REJECTED           // Refuse
  WAITING_LIST       // Liste d'attente
  INTERVIEW_REQUIRED // Interview obligatoire
  ACTIVE             // Inscription confirmee
}
```

#### EventRegistration (Inscription Evenement)
```prisma
model EventRegistration {
  id                String             @id @default(uuid())
  userId            String?
  childId           String?
  eventId           String             // ID Directus
  eventTitle        String             // Denormalise
  participationType String             // INDIVIDUAL | FAMILY | CHILD
  firstName         String
  lastName          String
  email             String
  phone             String?
  numberOfAdults    Int                @default(1)
  numberOfChildren  Int                @default(0)
  participants      Json?              // Details famille
  requiresPayment   Boolean            @default(false)
  paymentAmount     Float?
  paymentId         String?
  status            RegistrationStatus @default(PENDING)
}

enum RegistrationStatus {
  PENDING         // En attente
  PENDING_PAYMENT // Confirme, paiement en attente
  CONFIRMED       // Paiement recu
  CANCELLED       // Annule
}
```

#### Membership (Cotisation)
```prisma
model Membership {
  id                    String           @id @default(uuid())
  userId                String
  type                  MembershipType
  status                MembershipStatus @default(PENDING)
  paymentStatus         PaymentStatus    @default(PENDING)
  amount                Float            // 120 CHF
  startDate             DateTime
  endDate               DateTime         // +1 an
  stripeSessionId       String?
  stripePaymentIntentId String?
  receiptSent           Boolean          @default(false)
}

enum MembershipType {
  ACTIF, PASSIF, INDIVIDUAL, FAMILY, STUDENT, SENIOR
}

enum MembershipStatus {
  ACTIVE, EXPIRED, PENDING
}
```

#### MembershipRequest (Demande Adhesion)
```prisma
model MembershipRequest {
  id               String                  @id @default(uuid())
  // Informations demandeur
  firstName        String
  lastName         String
  email            String
  phone            String
  dateOfBirth      DateTime?
  address          String
  city             String
  postalCode       String
  country          String                  @default("Suisse")
  membershipType   String                  // ACTIF | PASSIF
  desiredStartDate DateTime
  motivation       String?

  // Workflow
  status           MembershipRequestStatus @default(PENDING)
  reviewedBy       String?                 // Admin UUID
  reviewedAt       DateTime?
  rejectionReason  String?

  // Paiement
  paymentToken     String?                 // 64 char hex
  paymentLinkSentAt DateTime?
  paymentExpiresAt DateTime?               // +7 jours
  stripeSessionId  String?
  paidAt           DateTime?

  // Liens
  membershipId     String?                 // Cree apres paiement
  userId           String?                 // Cree apres paiement
}

enum MembershipRequestStatus {
  PENDING       // Initial
  APPROVED      // Admin accepte
  PAYMENT_SENT  // Lien envoye
  COMPLETED     // Paiement recu
  REJECTED      // Refuse
  EXPIRED       // Token expire
}
```

#### Payment (Paiement)
```prisma
model Payment {
  id                 String        @id @default(uuid())
  userId             String?
  eventId            String?       // Directus ID
  enrollmentId       String?
  amount             Float
  currency           String        @default("chf")
  status             PaymentStatus @default(PENDING)
  stripePaymentId    String?
  stripeCheckoutId   String?
  metadata           Json?         // type, details
  paidAt             DateTime?
  failedAt           DateTime?
  failureReason      String?
  refundedAt         DateTime?
  refundAmount       Float?
}

enum PaymentStatus {
  PENDING, PAID, COMPLETED, FAILED, REFUNDED, CANCELLED
}
```

#### Donation (Don)
```prisma
model Donation {
  id              String       @id @default(uuid())
  userId          String?      // Null si don anonyme/non-membre
  firstName       String
  lastName        String
  email           String
  phone           String?
  amount          Float
  type            DonationType
  projectId       String?      // Directus ID
  projectName     String?
  message         String?
  anonymous       Boolean      @default(false)
  stripeSessionId String?
  receiptSent     Boolean      @default(false)
  receiptSentAt   DateTime?
}

enum DonationType {
  ZAKAT, SADAQA, ZAKAT_AL_FITR, PROJECT, MEMBERSHIP
}
```

#### Notification
```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  link      String?          // URL relative
  read      Boolean          @default(false)
  emailSent Boolean          @default(false)
  createdAt DateTime         @default(now())
}

enum NotificationType {
  EVENT_CONFIRMATION
  EVENT_REGISTRATION_NEW
  EVENT_REMINDER
  EVENT_CANCELLED
  EVENT_WAITLIST_SPOT_AVAILABLE
  EVENT_PAYMENT_PENDING
  ENROLLMENT_CONFIRMATION
  ENROLLMENT_APPROVED
  ENROLLMENT_REJECTED
  ENROLLMENT_PAYMENT_PENDING
  ENROLLMENT_PAYMENT_CONFIRMED
  PAYMENT_PENDING
  PAYMENT_CONFIRMED
  PAYMENT_FAILED
  MEMBERSHIP_PENDING_PAYMENT
  MEMBERSHIP_CONFIRMED
  MEMBERSHIP_REFUNDED
  MEMBERSHIP_EXPIRING_SOON
  DONATION_CONFIRMED
  SYSTEM
  REMINDER
}
```

---

## 3. DIRECTUS - CMS

### Configuration
```
URL: http://localhost:8055
Token: DIRECTUS_TOKEN (dans .env.local)
Schema: "directus" (separe de Prisma)
Admin: admin@mosquee.ch / mosquee2024!
```

### Collections

#### Events
```typescript
{
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  category: 'religieux' | 'communaute' | 'education' | 'charite'
  date: string           // YYYY-MM-DD
  start_time: string     // HH:MM
  end_time: string
  location?: string
  image?: string         // ID image Directus
  max_capacity?: number

  // Paiement
  price?: number         // 0 = gratuit
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'

  // Responsable
  manager_id?: string    // UUID User Prisma
  manager_email?: string

  // Restrictions
  restrictions?: {
    enabled: boolean
    participation_type?: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
    allowed_gender?: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
    min_age?: number
    max_age?: number
  }

  registration_required: boolean
  requires_approval: boolean
  featured: boolean
  published: boolean
}
```

#### Activities
```typescript
{
  id: string
  title: string
  slug: string
  category: 'coran' | 'arabe' | 'ecole' | 'tajweed' | 'hifz' | 'halaqat' | 'autre'
  description?: string
  content?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string
  max_participants?: number
  price?: number         // 0 = gratuit
  requires_approval: boolean
  manager_id?: string
  manager_email?: string
  restrictions?: {...}   // Meme structure que Events
  active: boolean
  enrollment_open: boolean
}
```

#### Projects (Dons)
```typescript
{
  id: string
  title: string
  slug: string
  description?: string
  goal_amount: number    // Objectif CHF
  current_amount: number // Montant actuel
  image?: string
  raisenow_code?: string
  start_date?: string
  end_date?: string
  priority: number       // Tri
  active: boolean
}
```

#### Jumua Messages
```typescript
{
  id: string
  title: string
  message: string
  image?: string
  times?: string[]       // Horaires Joumou'a
  is_active: boolean
  order: number
  valid_from?: string
  valid_until?: string
}
```

### Lien Directus <-> Prisma

| Directus Collection | Prisma Model | Champ de reference |
|---------------------|--------------|-------------------|
| events | EventRegistration | eventId (String) |
| events | Payment | eventId (String) |
| activities | Enrollment | activityId (String) |
| projects | Donation | projectId (String) |

---

## 4. STRIPE - PAIEMENTS

### Configuration
```typescript
// lib/stripe.ts
Currency: 'CHF'
API Version: '2025-11-17'
```

### Types de Paiements

| Type | Montant | API Route |
|------|---------|-----------|
| Don | Presets (20/50/100/200 CHF) ou custom | POST /api/stripe/create-checkout |
| Evenement | Prix defini dans Directus | POST /api/stripe/create-event-checkout |
| Activite | Prix defini dans Directus | POST /api/stripe/create-activity-checkout |
| Adhesion | 120 CHF (fixe) | POST /api/stripe/create-membership-payment |

### Flux de Paiement

```
1. Client soumet formulaire
2. API cree Stripe Checkout Session
3. Client redirige vers Stripe
4. Paiement (carte, 3D Secure)
5. Stripe appelle webhook
6. Webhook traite selon metadata.type
7. Email de confirmation
```

### Webhook Handler

**Route:** POST /api/stripe/webhook

**Verification signature:**
```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

**Events geres:**
- `checkout.session.completed` -> Route selon metadata.type
- `payment_intent.payment_failed` -> Log erreur

**Handlers:**
```typescript
switch (metadata.type) {
  case 'DONATION':
    handleDonationPayment(session)
    // Cree Donation + Email recu
    break

  case 'EVENT_REGISTRATION':
    handleEventRegistrationPayment(session)
    // Cree/Update EventRegistration + Payment + Email
    break

  case 'ACTIVITY_ENROLLMENT':
    handleActivityEnrollmentPayment(session)
    // Update Enrollment + Cree Payment + Email
    break

  case 'MEMBERSHIP':
    handleMembershipPayment(session)
    // Cree User (si nouveau) + Membership + Payment + Email
    break
}
```

### Metadata par Type

**DONATION:**
```json
{
  "type": "DONATION",
  "projectId": "...",
  "projectTitle": "...",
  "donorName": "...",
  "donorEmail": "..."
}
```

**EVENT_REGISTRATION:**
```json
{
  "type": "EVENT_REGISTRATION",
  "eventId": "...",
  "eventTitle": "...",
  "eventDate": "...",
  "participationType": "INDIVIDUAL|FAMILY|CHILD",
  "numberOfAdults": 2,
  "numberOfChildren": 3,
  "totalAttendees": 5,
  "contactName": "...",
  "contactEmail": "...",
  "userId": "...",
  "childId": "...",
  "registrationId": "..."
}
```

**ACTIVITY_ENROLLMENT:**
```json
{
  "type": "ACTIVITY_ENROLLMENT",
  "enrollmentId": "...",
  "activityId": "...",
  "activityTitle": "...",
  "userId": "...",
  "childId": "...",
  "participantName": "...",
  "participantType": "adult|child"
}
```

**MEMBERSHIP:**
```json
{
  "type": "MEMBERSHIP",
  "requestId": "...",
  "membershipType": "ACTIF|PASSIF",
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "address": "...",
  "city": "...",
  "postalCode": "...",
  "country": "...",
  "desiredStartDate": "..."
}
```

---

## 5. RESEND - EMAILS

### Configuration
```typescript
// lib/email.ts
FROM: process.env.EMAIL_FROM || 'noreply@mosquee-madretsch.ch'
API_KEY: process.env.RESEND_API_KEY
```

### Types d'Emails

#### Authentification
| Email | Quand | Contenu |
|-------|-------|---------|
| Welcome | Apres inscription | Bienvenue + lien espace membre |

#### Inscriptions Activites
| Email | Quand | Contenu |
|-------|-------|---------|
| Confirmation PENDING | Apres inscription | "En attente validation" |
| Confirmation ACTIVE | Apres approbation | "Inscription confirmee" |
| Payment Request | Admin approuve payant | Lien paiement + expiration 7j |
| Payment Confirmed | Webhook paiement | Confirmation + recu |
| Rejection | Admin rejette | Motif refus |

#### Inscriptions Evenements
| Email | Quand | Contenu |
|-------|-------|---------|
| Confirmation | Inscription gratuite | Date + lieu |
| Pending Approval | Si requires_approval | "En attente" |
| Payment Confirmed | Webhook paiement | Recap + montant |

#### Adhesion
| Email | Quand | Contenu |
|-------|-------|---------|
| Approved | Admin approuve | Lien paiement 7j |
| Rejected | Admin rejette | Motif |
| Welcome | Webhook paiement | Bienvenue + credentials si nouveau |
| Expiring | Cron 30j avant | Rappel renouvellement |

#### Dons
| Email | Quand | Contenu |
|-------|-------|---------|
| Receipt | Webhook paiement | Recu fiscal + montant |

### Template Email

```html
<!-- Header rouge gradient -->
<td style="background: linear-gradient(135deg, #DC2626, #B91C1C);">
  <h1>Mosquee Madretsch</h1>
</td>

<!-- Contenu dynamique -->
<td style="padding: 40px;">
  ${content}
</td>

<!-- Footer -->
<td style="background-color: #f9fafb;">
  Mosquee Madretsch
  Rue Centrale 49, 2503 Bienne
  info@mosquee-madretsch.ch
</td>
```

---

## 6. FLUX METIER COMPLETS

### FLUX 1: Inscription Evenement Gratuit

```
1. Visiteur -> /evenements/[slug]
2. Soumet formulaire inscription
3. POST /api/event-registrations
   ├─ Cree EventRegistration (status: CONFIRMED)
   ├─ Cree Notification
   └─ Envoie Email confirmation
4. Affiche succes
```

**Donnees:** +1 EventRegistration, +1 Notification
**Emails:** 1 (confirmation)

---

### FLUX 2: Inscription Evenement Payant

```
1. Visiteur -> /evenements/[slug]
2. Soumet formulaire inscription
3. POST /api/event-registrations
   └─ Cree EventRegistration (status: PENDING_PAYMENT)
4. POST /api/stripe/create-event-checkout
   ├─ Calcule prix total:
   │   - INDIVIDUAL: prix_adulte
   │   - CHILD: prix_enfant
   │   - FAMILY: (adults * prix_adulte) + (children * prix_enfant)
   └─ Cree Stripe Session
5. Redirect -> Stripe Checkout
6. Paiement carte
7. Webhook -> handleEventRegistrationPayment
   ├─ Cree Payment (COMPLETED)
   ├─ Update EventRegistration (CONFIRMED)
   ├─ Cree Notification
   └─ Envoie Email confirmation
8. Redirect -> /stripe-success
```

**Donnees:** +1 EventRegistration, +1 Payment, +1 Notification
**Emails:** 1 (confirmation paiement)

---

### FLUX 3: Inscription Activite (Approbation + Gratuit)

```
1. Membre -> /activites/[id]
2. Soumet formulaire inscription
3. POST /api/enrollments
   ├─ Cree Enrollment (status: PENDING)
   ├─ Cree Notification
   └─ Envoie Email "en attente"
4. Admin -> /admin/inscriptions
5. Clique "Approuver"
6. PATCH /api/admin/enrollments/[id]
   ├─ Update Enrollment (status: ACTIVE)
   ├─ Cree Notification
   └─ Envoie Email "confirme"
```

**Donnees:** +1 Enrollment, +2 Notifications
**Emails:** 2 (attente + confirmation)
**Duree:** 1-3 jours (approbation manuelle)

---

### FLUX 4: Inscription Activite (Approbation + Payant)

```
1. Membre -> /activites/[id]
2. POST /api/enrollments
   └─ Cree Enrollment (status: PENDING, requiresPayment: false)
3. Admin approuve
4. PATCH /api/admin/enrollments/[id]
   ├─ Update Enrollment:
   │   - status: APPROVED
   │   - requiresPayment: true
   │   - paymentAmount: activity.price
   │   - paymentToken: crypto.randomBytes(32).hex()
   │   - paymentExpiresAt: +7 jours
   └─ Envoie Email avec lien paiement
5. Membre clique lien
6. POST /api/stripe/create-activity-checkout
   └─ Cree Stripe Session
7. Paiement
8. Webhook -> handleActivityEnrollmentPayment
   ├─ Cree Payment
   ├─ Update Enrollment (status: ACTIVE)
   └─ Envoie Email confirmation
```

**Donnees:** +1 Enrollment, +1 Payment, +2 Notifications
**Emails:** 3 (attente + lien paiement + confirmation)

---

### FLUX 5: Adhesion Complete

```
1. Visiteur -> /devenir-membre
2. Soumet MembershipRequest
3. POST /api/membership-requests
   └─ Cree MembershipRequest (status: PENDING)
4. Admin -> /admin/demandes-adhesion
5. Approuve:
   POST /api/admin/membership-requests/[id]/approve
   ├─ Update MembershipRequest:
   │   - status: APPROVED
   │   - paymentToken: crypto.randomBytes(32).hex()
   │   - paymentExpiresAt: +7 jours
   └─ Envoie Email avec lien paiement
6. Visiteur clique lien -> /adhesion/payer/[token]
7. POST /api/stripe/create-membership-payment
   ├─ Update MembershipRequest (status: PAYMENT_SENT)
   └─ Cree Stripe Session
8. Paiement
9. Webhook -> handleMembershipPayment
   ├─ Cree ou recupere User
   │   (si nouveau: genere mot de passe temp)
   ├─ Cree Membership (status: ACTIVE)
   ├─ Cree Payment
   ├─ Update MembershipRequest (status: COMPLETED)
   └─ Envoie Email bienvenue
```

**Donnees:** +1 MembershipRequest, +1 User (si nouveau), +1 Membership, +1 Payment
**Emails:** 2 (approbation + bienvenue)
**Montant:** 120 CHF fixe

---

### FLUX 6: Don

```
1. Visiteur -> /dons
2. Choisit projet + montant
3. POST /api/stripe/create-checkout
   └─ Cree Stripe Session (metadata.type: DONATION)
4. Paiement
5. Webhook -> handleDonationPayment
   ├─ Cree Donation
   │   (userId si email correspond a un compte)
   └─ Envoie Email recu fiscal
```

**Donnees:** +1 Donation
**Emails:** 1 (recu)

---

### FLUX 7: Gestion Enfants

```
1. Parent -> /membre/dashboard/enfants
2. Clique "Ajouter enfant"
3. POST /api/account/children
   └─ Cree Child (parentId: session.user.id)

Edition:
PATCH /api/account/children/[id]
└─ Verifie parentId == session.user.id

Suppression:
DELETE /api/account/children/[id]
└─ Verifie aucune inscription active
```

**Securite:** Verification parentId sur chaque operation

---

## 7. SECURITE

### Authentification
- **NextAuth** avec JWT strategy
- Session inclut: id, email, role
- Middleware protege /admin et /membre

### Verification Webhook Stripe
```typescript
// CRUCIAL: raw body, pas JSON parse
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
)
```

### Tokens Securises
```typescript
// Adhesion + Activite payante
crypto.randomBytes(32).toString('hex') // 64 char hex
// Expiration 7 jours
```

### Verification Propriete
```typescript
// Enfant
if (child.parentId !== session.user.id) {
  return Response.json({ error: 'Non autorise' }, { status: 403 })
}

// Enrollment
if (enrollment.userId !== session.user.id) {
  return Response.json({ error: 'Non autorise' }, { status: 403 })
}
```

### Protection Suppression Enfant
```typescript
if (child._count.enrollments > 0 || child._count.eventRegistrations > 0) {
  return Response.json({
    error: 'Impossible de supprimer - inscriptions actives'
  }, { status: 400 })
}
```

---

## RESUME DES FLUX

| Flux | Approbation | Paiement | Duree | Tables | Emails |
|------|-------------|----------|-------|--------|--------|
| Event gratuit | - | - | Immediat | 2 | 1 |
| Event payant | - | Stripe | Real-time | 3 | 1 |
| Activite gratuite | Admin | - | 1-3j | 2 | 2 |
| Activite payante | Admin | Stripe | 1-3j + RT | 3 | 3 |
| Adhesion | Admin | Stripe | 1-3j + 7j + RT | 4 | 2 |
| Don | - | Stripe | Real-time | 1 | 1 |
| Enfant | - | - | Immediat | 1 | 0 |

---

*Document de reference - Mosquee Madretsch Biel/Bienne*
