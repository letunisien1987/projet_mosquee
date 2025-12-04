# ARCHITECTURE COMPLETE DU PROJET MOSQUEE

> **Document de Reference** - Derniere mise a jour: 3 Decembre 2025
> Ce fichier sert de reference pour comprendre l'ensemble du projet.

---

## TABLE DES MATIERES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet](#2-structure-du-projet)
3. [Base de donnees (Prisma)](#3-base-de-donnees-prisma)
4. [CMS Directus](#4-cms-directus)
5. [Pages et Routes](#5-pages-et-routes)
6. [API Routes](#6-api-routes)
7. [Composants](#7-composants)
8. [Librairies (lib/)](#8-librairies-lib)
9. [Authentification](#9-authentification)
10. [Paiements Stripe](#10-paiements-stripe)
11. [Systeme d'emails](#11-systeme-demails)
12. [Permissions RBAC](#12-permissions-rbac)
13. [Scripts utilitaires](#13-scripts-utilitaires)
14. [Variables d'environnement](#14-variables-denvironnement)
15. [Flux de donnees](#15-flux-de-donnees)
16. [Problemes connus et solutions](#16-problemes-connus-et-solutions)

---

## 1. VUE D'ENSEMBLE

### Stack Technique
| Technologie | Version | Usage |
|------------|---------|-------|
| Next.js | 16.0.4 | Framework React (App Router) |
| React | 19.2.0 | UI Library |
| TypeScript | 5.x | Typage |
| Prisma | 6.19.0 | ORM PostgreSQL |
| Directus | 11.x | CMS Headless |
| NextAuth | 4.24.13 | Authentification |
| Stripe | 20.0.0 | Paiements |
| Resend | 6.5.2 | Emails |
| Tailwind CSS | 4.x | Styling |

### Architecture Double Stockage

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                              │                                  │
│     ┌───────────────────────┴───────────────────────┐          │
│     │                                               │          │
│     ▼                                               ▼          │
│ ┌─────────────────┐                    ┌─────────────────┐     │
│ │   DIRECTUS CMS  │                    │ POSTGRESQL/PRISMA│     │
│ │ (Port 8055)     │                    │                  │     │
│ ├─────────────────┤                    ├──────────────────┤     │
│ │ - Evenements    │                    │ - Users          │     │
│ │ - Activites     │                    │ - Children       │     │
│ │ - Articles      │                    │ - Memberships    │     │
│ │ - Team Members  │                    │ - Donations      │     │
│ │ - Projects      │                    │ - Enrollments    │     │
│ │ - Jumua Messages│                    │ - EventRegistr.  │     │
│ │ - Gallery       │                    │ - Payments       │     │
│ │ - Settings      │                    │ - Notifications  │     │
│ └─────────────────┘                    └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Principe**:
- Directus = Contenu gere par admin (evenements, activites, articles)
- Prisma = Donnees transactionnelles (users, inscriptions, paiements)
- Les references entre les deux utilisent des IDs string

---

## 2. STRUCTURE DU PROJET

```
/Users/elghoudi/mosquee/
│
├── app/                          # Pages Next.js (App Router)
│   ├── layout.tsx               # Layout global (Navbar, Footer, Providers)
│   ├── page.tsx                 # Page d'accueil
│   │
│   ├── api/                     # API Routes (75+ endpoints)
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── admin/              # APIs administration
│   │   ├── membre/             # APIs espace membre
│   │   ├── events/             # APIs evenements
│   │   ├── activities/         # APIs activites
│   │   ├── stripe/             # Webhooks et checkout Stripe
│   │   └── ...
│   │
│   ├── admin/                   # Pages administration
│   │   ├── layout.tsx          # Layout admin avec sidebar
│   │   ├── page.tsx            # Dashboard stats
│   │   ├── membres/            # Gestion membres
│   │   ├── activites/          # Gestion activites
│   │   ├── evenements-gestion/ # Gestion evenements
│   │   ├── dons/               # Gestion dons
│   │   ├── messages/           # Messages contact
│   │   └── ...
│   │
│   ├── membre/                  # Espace membre (protege)
│   │   ├── layout.tsx          # Layout avec MemberNav
│   │   ├── dashboard/          # Tableau de bord
│   │   ├── mes-activites/      # Mes inscriptions activites
│   │   ├── evenements/         # Mes inscriptions evenements
│   │   ├── dons/               # Historique dons
│   │   └── ...
│   │
│   ├── activites/               # Pages publiques activites
│   ├── evenements/              # Pages publiques evenements
│   ├── dons/                    # Page dons publique
│   ├── connexion/               # Login
│   ├── inscription/             # Register
│   └── ...
│
├── components/                   # Composants React (40+)
│   ├── Navbar.tsx              # Navigation principale
│   ├── Footer.tsx              # Pied de page
│   ├── AddEditChildModal.tsx   # Modal gestion enfants
│   ├── EventRegistrationModal.tsx # Modal inscription evenement
│   ├── EnrollmentForm.tsx      # Formulaire inscription activite
│   ├── HeroWithAnnouncements.tsx # Hero page accueil
│   ├── membre/
│   │   └── MemberNav.tsx       # Navigation espace membre
│   └── ui/                     # Composants UI (shadcn style)
│
├── lib/                          # Librairies utilitaires
│   ├── directus.ts             # Client Directus (1137 lignes)
│   ├── auth.ts                 # Config NextAuth
│   ├── prisma.ts               # Client Prisma singleton
│   ├── email.ts                # Systeme emails Resend
│   ├── stripe.ts               # Config Stripe
│   ├── pricing.ts              # Calcul tarification
│   ├── permissions.ts          # Systeme RBAC
│   └── utils.ts                # Utilitaires (cn)
│
├── types/                        # Types TypeScript
│   └── next-auth.d.ts          # Extension types NextAuth
│
├── prisma/
│   ├── schema.prisma           # Schema base de donnees
│   └── migrations/             # Migrations DB
│
├── scripts/                      # 42 scripts utilitaires
│
├── middleware.ts                 # Protection routes
├── next.config.ts               # Config Next.js
├── package.json                 # Dependances
└── .env.local                   # Variables environnement
```

---

## 3. BASE DE DONNEES (PRISMA)

### Schema Complet

**Fichier**: `/prisma/schema.prisma`

#### Enums

```prisma
enum UserRole {
  ADMIN      // Acces complet
  IMAM       // Gestion religieuse
  TEACHER    // Enseignant
  STAFF      // Personnel
  MANAGER    // Gestionnaire activites/evenements
  MEMBER     // Membre standard
}

enum MembershipType {
  ACTIF, PASSIF, INDIVIDUAL, FAMILY, STUDENT, SENIOR
}

enum MembershipStatus {
  ACTIVE, EXPIRED, PENDING
}

enum DonationType {
  ZAKAT, SADAQA, ZAKAT_AL_FITR, PROJECT, MEMBERSHIP
}

enum EnrollmentStatus {
  PENDING, APPROVED, REJECTED, WAITING_LIST, INTERVIEW_REQUIRED, ACTIVE
}

enum RegistrationStatus {
  PENDING, PENDING_PAYMENT, CONFIRMED, CANCELLED
}

enum PaymentStatus {
  PENDING, PAID, COMPLETED, FAILED, REFUNDED, CANCELLED
}

enum NotificationType {
  EVENT_CONFIRMATION, EVENT_REGISTRATION_NEW, EVENT_REMINDER,
  EVENT_CANCELLED, EVENT_WAITLIST_SPOT_AVAILABLE, EVENT_PAYMENT_PENDING,
  ENROLLMENT_CONFIRMATION, ENROLLMENT_APPROVED, ENROLLMENT_REJECTED,
  ENROLLMENT_PAYMENT_PENDING, ENROLLMENT_PAYMENT_CONFIRMED,
  PAYMENT_PENDING, PAYMENT_CONFIRMED, PAYMENT_FAILED,
  MEMBERSHIP_PENDING_PAYMENT, MEMBERSHIP_CONFIRMED, MEMBERSHIP_REFUNDED,
  MEMBERSHIP_EXPIRING_SOON, DONATION_CONFIRMED, SYSTEM, REMINDER
}
```

#### Modeles Principaux

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String    // Hash bcryptjs
  firstName     String
  lastName      String
  phone         String?
  address       String?
  role          UserRole  @default(MEMBER)
  createdAt     DateTime  @default(now())

  // Relations
  children           Child[]
  memberships        Membership[]
  donations          Donation[]
  eventRegistrations EventRegistration[]
  enrollments        Enrollment[]
  notifications      Notification[]
  payments           Payment[]
}

model Child {
  id          String    @id @default(uuid())
  firstName   String
  lastName    String
  nickName    String?
  birthDate   DateTime
  gender      String?   // "M" ou "F"
  notes       String?   // Allergies, infos medicales
  avatarUrl   String?
  parentId    String
  parent      User      @relation(fields: [parentId], references: [id])

  // Relations
  enrollments        Enrollment[]
  eventRegistrations EventRegistration[]
}

model Enrollment {
  id              String           @id @default(uuid())
  userId          String?
  childId         String?
  activityId      String           // ID Directus
  activityTitle   String
  status          EnrollmentStatus @default(PENDING)
  requiresPayment Boolean          @default(false)
  paymentAmount   Float?
  paymentId       String?

  user    User?    @relation(fields: [userId], references: [id])
  child   Child?   @relation(fields: [childId], references: [id])
  payment Payment? @relation(fields: [paymentId], references: [id])
}

model EventRegistration {
  id                String             @id @default(uuid())
  userId            String?
  childId           String?
  eventId           String             // ID Directus
  eventTitle        String
  participationType String             // INDIVIDUAL, FAMILY, CHILD
  firstName         String
  lastName          String
  email             String
  phone             String?
  numberOfAdults    Int                @default(1)
  numberOfChildren  Int                @default(0)
  participants      Json?
  requiresPayment   Boolean            @default(false)
  paymentAmount     Float?
  paymentId         String?
  status            RegistrationStatus @default(PENDING)

  user    User?    @relation(fields: [userId], references: [id])
  child   Child?   @relation(fields: [childId], references: [id])
  payment Payment? @relation(fields: [paymentId], references: [id])
}

model Payment {
  id                  String        @id @default(uuid())
  userId              String?
  amount              Float
  currency            String        @default("chf")
  status              PaymentStatus @default(PENDING)
  stripePaymentId     String?
  stripeCheckoutId    String?
  metadata            Json?
  paidAt              DateTime?

  user               User?               @relation(fields: [userId], references: [id])
  eventRegistrations EventRegistration[]
  enrollments        Enrollment[]
}

model Donation {
  id              String       @id @default(uuid())
  userId          String?
  firstName       String
  lastName        String
  email           String
  phone           String?
  amount          Float
  type            DonationType
  projectId       String?      // ID Directus
  projectName     String?
  message         String?
  anonymous       Boolean      @default(false)
  stripeSessionId String?
  receiptSent     Boolean      @default(false)
  createdAt       DateTime     @default(now())

  user User? @relation(fields: [userId], references: [id])
}

model Membership {
  id                     String           @id @default(uuid())
  userId                 String
  type                   MembershipType
  status                 MembershipStatus @default(PENDING)
  paymentStatus          PaymentStatus    @default(PENDING)
  amount                 Float
  startDate              DateTime
  endDate                DateTime
  stripeSessionId        String?
  stripePaymentIntentId  String?

  user User @relation(fields: [userId], references: [id])
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  link      String?
  read      Boolean          @default(false)
  emailSent Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### Commandes Prisma

```bash
# Generer le client
npx prisma generate

# Creer migration
npx prisma migrate dev --name description

# Appliquer migrations en prod
npx prisma migrate deploy

# Ouvrir Prisma Studio
npx prisma studio
```

---

## 4. CMS DIRECTUS

### Configuration

**Dossier**: `~/directus-mosquee/`
**Port**: 8055
**URL**: http://localhost:8055

**Fichier .env** (`~/directus-mosquee/.env`):
```env
PORT=8055
PUBLIC_URL="http://localhost:8055"
DB_CLIENT="pg"
DB_CONNECTION_STRING="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
DB_SCHEMA="directus"
KEY="255d861b-5ea1-5996-9aa3-922530ec40b1"
SECRET="6116487b-cda1-52c2-b5b5-c8022c45e263"
ADMIN_EMAIL="admin@mosquee.ch"
ADMIN_PASSWORD="mosquee2024!"
```

### Collections Directus

| Collection | Description | Champs principaux |
|------------|-------------|-------------------|
| `events` | Evenements | title, slug, description, date_start, date_end, location, capacity, price, category, image |
| `activities` | Activites/Cours | title, description, schedule, teacher, price, category, capacity, age_min, age_max |
| `articles` | Articles/News | title, slug, content, excerpt, image, published_date |
| `team_members` | Equipe | name, role, bio, image, email, order |
| `projects` | Projets donation | title, description, goal_amount, current_amount, image, is_active |
| `jumua_messages` | Messages Joumou'a | title, message, times, image, is_active, valid_from, valid_until, order |
| `gallery` | Galeries photos | title, images, category |
| `mosque_settings` | Parametres | key, value |

### Client Directus (lib/directus.ts)

```typescript
// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

const directusClient = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

// Fonctions principales exportees
export async function getEvents()
export async function getEventById(id: string)
export async function getEventBySlug(slug: string)
export async function getActivities()
export async function getActivityById(id: string)
export async function getArticles()
export async function getTeamMembers()
export async function getProjects()
export async function getJumuaMessages()
export async function getMosqueSettings()
export function getDirectusImageUrl(imageId: string)
```

### Demarrer Directus

```bash
cd ~/directus-mosquee
npx directus start
# Ou en arriere-plan:
npx directus start &
```

### Bootstrap Directus (premiere fois)

```bash
cd ~/directus-mosquee
npx directus bootstrap
```

---

## 5. PAGES ET ROUTES

### Pages Publiques

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `app/page.tsx` | Accueil avec horaires, annonces, hero |
| `/horaires` | `app/horaires/page.tsx` | Calendrier horaires de priere |
| `/activites` | `app/activites/page.tsx` | Liste activites avec filtres |
| `/activites/[id]` | `app/activites/[id]/page.tsx` | Detail activite + inscription |
| `/evenements` | `app/evenements/page.tsx` | Liste evenements avec filtres |
| `/evenements/[slug]` | `app/evenements/[slug]/page.tsx` | Detail evenement + inscription |
| `/dons` | `app/dons/page.tsx` | Page dons avec projets |
| `/about` | `app/about/page.tsx` | A propos, equipe, mission |
| `/contact` | `app/contact/page.tsx` | Formulaire contact + carte |
| `/services` | `app/services/page.tsx` | Formulaires services |
| `/connexion` | `app/connexion/page.tsx` | Login |
| `/inscription` | `app/inscription/page.tsx` | Register |

### Espace Membre (protege)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/membre/dashboard` | `app/membre/dashboard/page.tsx` | Tableau de bord |
| `/membre/dashboard/enfants` | `app/membre/dashboard/enfants/page.tsx` | Gestion enfants |
| `/membre/profil` | `app/membre/profil/page.tsx` | Edition profil |
| `/membre/mes-activites` | `app/membre/mes-activites/page.tsx` | Mes inscriptions activites |
| `/membre/evenements` | `app/membre/evenements/page.tsx` | Mes inscriptions evenements |
| `/membre/dons` | `app/membre/dons/page.tsx` | Historique dons |
| `/membre/cotisation` | `app/membre/cotisation/page.tsx` | Statut cotisation |
| `/membre/paiements` | `app/membre/paiements/page.tsx` | Historique paiements |
| `/membre/parametres` | `app/membre/parametres/page.tsx` | Parametres compte |

### Administration (protege - roles admin)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/admin` | `app/admin/page.tsx` | Dashboard stats |
| `/admin/membres` | `app/admin/membres/page.tsx` | Liste utilisateurs |
| `/admin/activites` | `app/admin/activites/page.tsx` | Gestion activites |
| `/admin/activites/nouveau` | `app/admin/activites/nouveau/page.tsx` | Creer activite |
| `/admin/inscriptions` | `app/admin/inscriptions/page.tsx` | Inscriptions activites |
| `/admin/evenements-gestion` | `app/admin/evenements-gestion/page.tsx` | Gestion evenements |
| `/admin/evenements` | `app/admin/evenements/page.tsx` | Inscriptions evenements |
| `/admin/dons` | `app/admin/dons/page.tsx` | Liste dons |
| `/admin/messages` | `app/admin/messages/page.tsx` | Messages contact |
| `/admin/services` | `app/admin/services/page.tsx` | Demandes services |
| `/admin/jumua` | `app/admin/jumua/page.tsx` | Messages Jumua |
| `/admin/roles` | `app/admin/roles/page.tsx` | Gestion permissions |

---

## 6. API ROUTES

### Authentification

```
POST /api/auth/register          - Creer compte
GET/POST /api/auth/[...nextauth] - NextAuth endpoints
```

### Evenements

```
GET  /api/events                     - Liste evenements
GET  /api/events/[id]                - Detail evenement
GET  /api/events/[id]/availability   - Verifier disponibilite
POST /api/events/[id]/checkout       - Creer session Stripe
POST /api/events/[id]/register       - Inscription simple
GET  /api/events/by-slug/[slug]      - Evenement par slug
```

### Activites

```
GET  /api/activities                 - Liste activites
GET  /api/activities/[id]            - Detail activite
POST /api/activities/[id]/checkout   - Session Stripe activite
POST /api/enrollments                - Inscription activite
```

### Espace Membre

```
GET/PATCH /api/membre/profil                          - Profil utilisateur
GET       /api/membre/notifications                   - Notifications
PATCH     /api/membre/notifications/[id]/read         - Marquer lue
DELETE    /api/membre/notifications/[id]              - Supprimer
GET       /api/membre/mes-activites                   - Mes activites
GET       /api/membre/mes-activites/[id]              - Detail activite
GET       /api/membre/mes-activites/[id]/enrollments  - Inscriptions
GET       /api/membre/paiements                       - Historique paiements
POST      /api/membre/dons/export                     - Export PDF dons
```

### Gestion Enfants

```
GET  /api/account/children      - Liste enfants
POST /api/account/children      - Ajouter enfant
GET  /api/account/children/[id] - Detail enfant
PATCH /api/account/children/[id] - Modifier enfant
DELETE /api/account/children/[id] - Supprimer enfant
```

### Paiements Stripe

```
POST /api/stripe/create-checkout            - Checkout don
POST /api/stripe/create-event-checkout      - Checkout evenement
POST /api/stripe/create-activity-checkout   - Checkout activite
POST /api/stripe/create-membership-payment  - Checkout cotisation
POST /api/stripe/webhook                    - Webhook Stripe
```

### Administration

```
GET  /api/admin/stats                         - Statistiques dashboard
GET  /api/admin/users                         - Liste utilisateurs
PATCH /api/admin/users/[id]/role              - Changer role
GET  /api/admin/enrollments                   - Inscriptions activites
PATCH /api/admin/enrollments/[id]             - Approuver/rejeter
GET  /api/admin/event-registrations           - Inscriptions evenements
PATCH /api/admin/event-registrations/[id]     - Modifier inscription
GET  /api/admin/donations                     - Liste dons
GET  /api/admin/contact-messages              - Messages contact
POST /api/admin/reply-message                 - Repondre message
GET/POST /api/admin/jumua                     - Messages Jumua
```

---

## 7. COMPOSANTS

### Composants Principaux

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `Navbar` | `components/Navbar.tsx` | Navigation principale |
| `Footer` | `components/Footer.tsx` | Pied de page |
| `MemberNav` | `components/membre/MemberNav.tsx` | Sidebar espace membre |
| `AddEditChildModal` | `components/AddEditChildModal.tsx` | Modal CRUD enfants |
| `EventRegistrationModal` | `components/EventRegistrationModal.tsx` | Modal inscription evenement |
| `EnrollmentForm` | `components/EnrollmentForm.tsx` | Formulaire inscription activite |
| `HeroWithAnnouncements` | `components/HeroWithAnnouncements.tsx` | Hero + carousel annonces |
| `UnifiedPrayerCard` | `components/UnifiedPrayerCard.tsx` | Card horaires priere |
| `JumuaMessageSlide` | `components/JumuaMessageSlide.tsx` | Slide message Jumua |
| `ContactForm` | `components/ContactForm.tsx` | Formulaire contact |
| `DonationForm` | `components/DonationForm.tsx` | Formulaire don |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Indicateur chargement |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Toggle dark/light |

### Composants UI (shadcn style)

```
components/ui/
├── button.tsx
├── card.tsx
└── sheet.tsx
```

---

## 8. LIBRAIRIES (lib/)

### directus.ts (1137 lignes)
Client Directus complet avec toutes les fonctions CRUD pour le CMS.

### auth.ts
```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaForAuth),
  providers: [
    CredentialsProvider({
      // Authentification email/password
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Ajoute role et id au token
    },
    session: async ({ session, token }) => {
      // Ajoute role et id a la session
    }
  },
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' }
}
```

### prisma.ts
```typescript
// Singleton pattern pour eviter multiple instances
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
export const prismaForAuth = new PrismaClient() // Sans extensions pour NextAuth
```

### email.ts
Systeme complet d'emails avec Resend:
- `sendWelcomeEmail()`
- `sendEventRegistrationConfirmation()`
- `sendActivityEnrollmentConfirmation()`
- `sendMembershipPaymentEmail()`
- `sendDonationReceiptEmail()`
- etc.

### stripe.ts
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
export const DONATION_PRESETS = { small: 2000, medium: 5000, large: 10000 }
export const CURRENCY = 'chf'
```

### pricing.ts
Calcul de tarification flexible:
- Prix adulte/enfant
- Enfants gratuits jusqu'a X ans
- Reduction groupe
- Prix famille max
- Early bird

### permissions.ts
Systeme RBAC avec 23 permissions et 6 roles.

---

## 9. AUTHENTIFICATION

### Flow NextAuth

```
1. User POST /api/auth/signin avec email/password
2. CredentialsProvider verifie dans Prisma
3. JWT cree avec {id, email, role}
4. Session disponible via useSession() ou getServerSession()
```

### Protection Routes (middleware.ts)

```typescript
// Routes protegees
const protectedPaths = ['/admin', '/membre']

// Roles admin autorises
const adminRoles = ['ADMIN', 'IMAM', 'TEACHER', 'STAFF', 'MANAGER']

export function middleware(request: NextRequest) {
  // Verifie JWT et role
  // Redirige si non autorise
}
```

### Utilisation

```typescript
// Client (use client)
import { useSession } from 'next-auth/react'
const { data: session } = useSession()

// Server
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
```

---

## 10. PAIEMENTS STRIPE

### Configuration

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Flow Paiement

```
1. Client appelle /api/stripe/create-*-checkout
2. API cree Stripe Checkout Session
3. Client redirige vers Stripe
4. Apres paiement, Stripe appelle /api/stripe/webhook
5. Webhook verifie signature et traite evenement
6. Met a jour Payment, Registration, etc.
7. Envoie email confirmation
```

### Types de Paiement

| Type | API | Metadata |
|------|-----|----------|
| Don | `/api/stripe/create-checkout` | type: 'DONATION' |
| Evenement | `/api/stripe/create-event-checkout` | type: 'EVENT_REGISTRATION' |
| Activite | `/api/stripe/create-activity-checkout` | type: 'ACTIVITY_ENROLLMENT' |
| Cotisation | `/api/stripe/create-membership-payment` | type: 'MEMBERSHIP' |

---

## 11. SYSTEME D'EMAILS

### Configuration Resend

```env
RESEND_API_KEY=re_...
```

### Emails Envoyes

| Email | Declencheur |
|-------|-------------|
| Bienvenue | Inscription compte |
| Confirmation inscription evenement | Apres paiement/inscription |
| Confirmation inscription activite | Apres approbation |
| Confirmation don | Apres paiement |
| Confirmation cotisation | Apres paiement |
| Rappel expiration cotisation | Cron job |
| Reponse message contact | Admin repond |

---

## 12. PERMISSIONS RBAC

### Roles

| Role | Description |
|------|-------------|
| ADMIN | Acces complet |
| IMAM | Gestion religieuse |
| TEACHER | Enseignant (activites) |
| STAFF | Personnel general |
| MANAGER | Gestionnaire specifique |
| MEMBER | Membre standard |

### Permissions (23 total)

```
MEMBRES:
- VIEW_MEMBERS, MANAGE_MEMBERS, MANAGE_ROLES

EVENEMENTS:
- VIEW_EVENTS, MANAGE_EVENTS
- VIEW_EVENT_REGISTRATIONS, MANAGE_EVENT_REGISTRATIONS

ACTIVITES:
- VIEW_ACTIVITIES, MANAGE_ACTIVITIES
- VIEW_ENROLLMENTS, MANAGE_ENROLLMENTS

FINANCES:
- VIEW_DONATIONS, MANAGE_DONATIONS
- VIEW_MEMBERSHIPS, MANAGE_MEMBERSHIPS

COMMUNICATION:
- VIEW_MESSAGES, MANAGE_MESSAGES
- VIEW_SERVICES, MANAGE_SERVICES

CONFIGURATION:
- VIEW_SETTINGS, MANAGE_SETTINGS
- ADMIN_ACCESS
```

### Utilisation

```typescript
import { hasPermission } from '@/lib/permissions'

if (hasPermission(user.role, 'MANAGE_EVENTS')) {
  // Autoriser action
}
```

---

## 13. SCRIPTS UTILITAIRES

### Scripts Importants

```bash
# Creer admin
npx tsx scripts/create-admin.ts

# Initialiser permissions
npx tsx scripts/init-permissions.ts

# Tester systeme enfants
npx tsx scripts/test-children-system.ts

# Verifier donnees
npx tsx scripts/verify-data.ts

# Reset cotisations
npx tsx scripts/reset-memberships.ts

# Tester emails
npx tsx scripts/test-email.ts
```

---

## 14. VARIABLES D'ENVIRONNEMENT

### .env.local (Next.js)

```env
# Base de donnees
DATABASE_URL="prisma+postgres://..."

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret

# Directus
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=votre_token_statique

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Mawaqit (horaires priere)
MAWAQIT_API_URL=https://mawaqit.elghoudi.net/api/v1
masjid_id=mosque-madretsch-biel-bienne
```

### ~/directus-mosquee/.env

```env
PORT=8055
PUBLIC_URL="http://localhost:8055"
DB_CLIENT="pg"
DB_CONNECTION_STRING="postgres://..."
DB_SCHEMA="directus"
KEY="..."
SECRET="..."
ADMIN_EMAIL="admin@mosquee.ch"
ADMIN_PASSWORD="mosquee2024!"
```

---

## 15. FLUX DE DONNEES

### Inscription Evenement Payant

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │────>│   Next.js    │────>│    Stripe    │
│  (Frontend)  │     │    (API)     │     │   Checkout   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       │                    ▼                    │
       │            ┌──────────────┐             │
       │            │   Payment    │             │
       │            │   (PENDING)  │             │
       │            └──────────────┘             │
       │                    │                    │
       │                    │       Webhook      │
       │                    │<───────────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       │            │   Payment    │
       │            │   (PAID)     │
       │            └──────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       │            │ Registration │
       │            │ (CONFIRMED)  │
       │            └──────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       └────────────│    Email     │
                    │ Confirmation │
                    └──────────────┘
```

### Gestion Enfants

```
Parent ──> /membre/dashboard/enfants
              │
              ├── Liste enfants (GET /api/account/children)
              │
              ├── Ajouter (POST /api/account/children)
              │       │
              │       └── Modal AddEditChildModal
              │
              ├── Modifier (PATCH /api/account/children/[id])
              │       │
              │       └── Modal AddEditChildModal (mode edit)
              │
              └── Supprimer (DELETE /api/account/children/[id])
                      │
                      └── Verification: pas d'inscriptions actives
```

---

## 16. PROBLEMES CONNUS ET SOLUTIONS

### Token Directus Invalide

**Symptome**: Erreur "Invalid user credentials" lors des appels Directus

**Solution**:
1. Acceder a Directus admin: http://localhost:8055/admin
2. Se connecter avec admin@mosquee.ch / mosquee2024!
3. Aller dans Settings > Users > Admin
4. Generer un nouveau token statique
5. Mettre a jour `DIRECTUS_TOKEN` dans `.env.local`

### Schema Directus Inexistant

**Symptome**: Erreur "relation directus.directus_users does not exist"

**Solution**:
```bash
cd ~/directus-mosquee
npx directus bootstrap
npx directus start
```

### Erreur Foreign Key Children

**Symptome**: "Foreign key constraint violated on children_parentId_fkey"

**Solution**: L'utilisateur doit se deconnecter completement, vider les cookies, et se reconnecter.

### Prisma Client Desynchronise

**Symptome**: PrismaClientValidationError

**Solution**:
```bash
npx prisma generate
rm -rf .next
npm run dev
```

### Port 8055 Occupe

**Solution**:
```bash
pkill -f "directus"
cd ~/directus-mosquee && npx directus start
```

---

## COMMANDES UTILES

```bash
# Demarrer le dev
npm run dev

# Demarrer Directus
cd ~/directus-mosquee && npx directus start

# Regenerer Prisma
npx prisma generate

# Migrations
npx prisma migrate dev --name description

# Prisma Studio
npx prisma studio

# Build production
npm run build

# Tests
npx tsx scripts/test-all-features.ts
```

---

*Document genere automatiquement - Projet Mosquee Madretsch Biel/Bienne*
