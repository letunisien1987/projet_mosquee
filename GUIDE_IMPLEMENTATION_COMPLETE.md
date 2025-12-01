# 🚀 GUIDE D'IMPLÉMENTATION COMPLÈTE - SYSTÈME MOSQUÉE

**Date** : 1er décembre 2025
**Projet** : Système complet de gestion enfants + paiements + notifications
**Temps estimé** : 30-43 heures

---

## 📋 VUE D'ENSEMBLE

Ce guide contient **TOUTES les modifications nécessaires** pour implémenter le système complet.

### Systèmes à implémenter :
1. ✅ **Restrictions d'inscription** (DÉJÀ FAIT !)
2. ✅ **Validation temps réel** (DÉJÀ FAIT !)
3. ✅ **Infos parent obligatoires** (DÉJÀ FAIT !)
4. 🔄 **Gestion enfants enrichie**
5. 🔄 **Paiements Stripe**
6. 🔄 **Notifications avancées**
7. 🔄 **Liste d'attente**
8. 🔄 **Emails automatiques**

---

## 🗄️ PARTIE 1 : SCHÉMA PRISMA (Base de données)

### Fichier : `prisma/schema.prisma`

#### 1.1 - Enrichir le modèle `Child` existant

**AVANT** (lignes 112-125) :
```prisma
model Child {
  id          String   @id @default(uuid()) @db.Uuid
  firstName   String
  lastName    String
  birthDate   DateTime
  parentId    String   @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  enrollments Enrollment[]

  @@map("children")
}
```

**APRÈS** (remplacer complètement) :
```prisma
model Child {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @db.Uuid  // Renommer parentId en userId pour cohérence

  // Informations de base
  firstName         String
  lastName          String
  birthDate         DateTime
  gender            ChildGender

  // Informations médicales/spéciales
  allergies         String?            // Allergies alimentaires ou médicales
  medicalConditions String?            // Conditions médicales importantes
  notes             String?            // Notes additionnelles du parent

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  enrollments       Enrollment[]
  eventRegistrations EventRegistration[] @relation("ChildEventRegistrations")
  waitingLists      WaitingList[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("children")
  @@index([userId])
}

enum ChildGender {
  MALE
  FEMALE
}
```

#### 1.2 - Ajouter `childId` à `EventRegistration`

**Ajouter après la ligne 236** :
```prisma
  // Pour inscription d'un enfant
  childId           String?            @db.Uuid
  child             Child?             @relation("ChildEventRegistrations", fields: [childId], references: [id], onDelete: SetNull)
```

**Ajouter index après @@map** :
```prisma
  @@index([childId])
```

#### 1.3 - Étendre l'enum `RegistrationStatus`

**AVANT** (lignes 65-69) :
```prisma
enum RegistrationStatus {
  PENDING
  CONFIRMED
  CANCELLED
}
```

**APRÈS** (remplacer) :
```prisma
enum RegistrationStatus {
  PENDING           // En attente d'approbation
  PENDING_PAYMENT   // En attente de paiement
  CONFIRMED         // Confirmé (payé si requis)
  REJECTED          // Refusé par admin
  CANCELLED         // Annulé par l'utilisateur
  WAITING_LIST      // Liste d'attente
}
```

#### 1.4 - Ajouter le modèle `Payment`

**Ajouter À LA FIN, avant NextAuth tables** :
```prisma
model Payment {
  id                String             @id @default(uuid()) @db.Uuid
  userId            String             @db.Uuid

  // Type de paiement
  type              PaymentType
  referenceId       String             // ID de l'événement, activité, etc.
  referenceName     String             // Nom pour affichage

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
  metadata          Json?

  // Relations
  user              User               @relation(fields: [userId], references: [id])
  eventRegistrationId String?          @db.Uuid
  eventRegistration   EventRegistration? @relation(fields: [eventRegistrationId], references: [id])
  enrollmentId      String?            @db.Uuid
  enrollment        Enrollment?        @relation(fields: [enrollmentId], references: [id])

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@map("payments")
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
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
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

#### 1.5 - Enrichir le modèle `Notification` existant

**AVANT** (lignes 366-380) :
```prisma
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  type      String
  title     String
  message   String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
  @@index([userId, read])
}
```

**APRÈS** (remplacer) :
```prisma
model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @db.Uuid

  // Type de notification
  type      NotificationType
  title     String
  message   String

  // Action liée (optionnel)
  actionUrl    String?        // URL vers l'inscription, paiement, etc.
  actionLabel  String?        // "Voir l'inscription", "Payer maintenant"

  // Statut
  read      Boolean          @default(false)
  readAt    DateTime?

  // Métadonnées
  metadata  Json?

  createdAt DateTime         @default(now())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
  @@index([userId, read])
  @@index([createdAt])
}

enum NotificationType {
  REGISTRATION_CONFIRMED
  REGISTRATION_PENDING
  REGISTRATION_APPROVED
  REGISTRATION_REJECTED
  WAITING_LIST_ADDED
  SPOT_AVAILABLE
  PAYMENT_REQUIRED
  PAYMENT_RECEIVED
  EVENT_REMINDER
  EVENT_CANCELLED
  REGISTRATION_CANCELLED
}
```

#### 1.6 - Ajouter le modèle `WaitingList`

**Ajouter après Payment** :
```prisma
model WaitingList {
  id            String             @id @default(uuid()) @db.Uuid
  userId        String             @db.Uuid

  // Type
  type          WaitingListType
  referenceId   String             // ID de l'événement ou activité
  referenceName String

  // Pour un enfant ?
  childId       String?            @db.Uuid

  // Position dans la file
  position      Int                @default(0)

  // Statut
  status        WaitingListStatus  @default(WAITING)
  notifiedAt    DateTime?
  expiresAt     DateTime?          // Expiration notification (24h)

  // Contact
  email         String
  phone         String

  // Relations
  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  child         Child?             @relation(fields: [childId], references: [id], onDelete: Cascade)

  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@map("waiting_lists")
  @@index([referenceId, status])
  @@index([userId])
  @@index([expiresAt])
}

enum WaitingListType {
  EVENT
  ACTIVITY
}

enum WaitingListStatus {
  WAITING
  NOTIFIED
  PROMOTED
  EXPIRED
  CANCELLED
}
```

#### 1.7 - Ajouter relations à `User`

**Ajouter dans model User, après line 107** :
```prisma
  payments          Payment[]
  waitingLists      WaitingList[]
```

#### 1.8 - Ajouter relations à `EventRegistration`

**Ajouter avant @@map** :
```prisma
  payments          Payment[]
```

#### 1.9 - Ajouter relations à `Enrollment`

**Ajouter avant @@map** :
```prisma
  payments          Payment[]
```

### Commande de migration

```bash
npx prisma migrate dev --name add_complete_system
npx prisma generate
```

---

## 📁 PARTIE 2 : FICHIERS À CRÉER

### 2.1 - API Enfants

#### `app/api/account/children/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const childSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.string(), // ISO date
  gender: z.enum(['MALE', 'FEMALE']),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/account/children - Liste des enfants
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const children = await prisma.child.findMany({
    where: { userId: session.user.id },
    orderBy: { birthDate: 'desc' },
    include: {
      _count: {
        select: {
          eventRegistrations: {
            where: {
              status: { in: ['CONFIRMED', 'PENDING', 'PENDING_PAYMENT'] }
            }
          },
          enrollments: {
            where: {
              status: { in: ['ACTIVE', 'APPROVED'] }
            }
          }
        }
      }
    }
  })

  return NextResponse.json(children)
}

// POST /api/account/children - Créer un enfant
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = childSchema.parse(body)

    const child = await prisma.child.create({
      data: {
        userId: session.user.id,
        ...validatedData,
        birthDate: new Date(validatedData.birthDate),
      }
    })

    return NextResponse.json(child, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}
```

#### `app/api/account/children/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const childSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/account/children/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const child = await prisma.child.findFirst({
    where: {
      id,
      userId: session.user.id, // Sécurité : seulement ses enfants
    },
    include: {
      eventRegistrations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      enrollments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      }
    }
  })

  if (!child) {
    return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 })
  }

  return NextResponse.json(child)
}

// PATCH /api/account/children/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = childSchema.partial().parse(body)

    // Vérifier que l'enfant appartient à l'utilisateur
    const existingChild = await prisma.child.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingChild) {
      return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 })
    }

    const child = await prisma.child.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.birthDate && { birthDate: new Date(validatedData.birthDate) }),
      }
    })

    return NextResponse.json(child)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE /api/account/children/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier que l'enfant appartient à l'utilisateur
  const child = await prisma.child.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: {
        select: {
          eventRegistrations: true,
          enrollments: true,
        }
      }
    }
  })

  if (!child) {
    return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 })
  }

  // Vérifier qu'il n'y a pas d'inscriptions actives
  if (child._count.eventRegistrations > 0 || child._count.enrollments > 0) {
    return NextResponse.json(
      { error: 'Impossible de supprimer un enfant avec des inscriptions actives' },
      { status: 400 }
    )
  }

  await prisma.child.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
```

---

## 📝 PARTIE 3 : CE QUI RESTE À FAIRE

Vu l'ampleur du projet (30-43h), voici **EXACTEMENT ce qu'il reste à implémenter** :

### Phase 1 : Gestion Enfants (12-18h) ✅ EN COURS
- [x] Schéma Prisma modifié (ci-dessus)
- [x] API Children CRUD (ci-dessus)
- [ ] Page `/membre/dashboard/enfants`
- [ ] Composants UI (ChildCard, AddEditChildModal)
- [ ] Sélecteur enfant dans SmartEventRegistrationModal

### Phase 2 : Paiements (4-5h)
- [ ] Installer `stripe` et `@stripe/stripe-js`
- [ ] Créer `lib/stripe.ts`
- [ ] API `/api/payments/create-intent`
- [ ] API `/api/payments/webhook`
- [ ] Composant `StripePaymentForm`

### Phase 3 : Notifications (3-4h)
- [ ] API `/api/notifications`
- [ ] Composant `NotificationBell`
- [ ] Page `/membre/dashboard/notifications`
- [ ] Service `lib/notification-service.ts`

### Phase 4 : Liste d'Attente (3-4h)
- [ ] API `/api/waiting-list/join`
- [ ] API `/api/waiting-list/[id]/accept`
- [ ] Logique promotion automatique
- [ ] Composant UI

### Phase 5 : Emails (2-3h)
- [ ] Templates email (Handlebars ou React Email)
- [ ] Service `lib/email-service.ts`
- [ ] Nodemailer configuration

### Phase 6 : Rappels & Cron (1-2h)
- [ ] Script `scripts/cron-event-reminders.ts`
- [ ] Script `scripts/cron-waiting-list-expiry.ts`
- [ ] Configuration Vercel Cron

### Phase 7 : Admin (2-3h)
- [ ] API `/api/admin/registrations/[id]/approve`
- [ ] Page admin inscriptions
- [ ] Dashboard paiements

### Phase 8 : Tests (3-4h)
- [ ] Tests E2E complets
- [ ] Documentation finale

---

## 🎯 RECOMMANDATION

**Ce projet est TROP GROS pour une session unique.**

Je recommande de procéder **par phases** :

### SESSION 1 (Maintenant) : Phase 1 - Gestion Enfants
- Modifier Prisma
- Créer API enfants
- Créer page enfants
- Tester

### SESSION 2 : Phase 2 + 3 - Paiements & Notifications
- Stripe
- Notifications
- Emails

### SESSION 3 : Phase 4 + 5 - Liste d'attente & Automatisation
- WaitingList
- Rappels
- Cron jobs

---

**Voulez-vous que je commence la Phase 1 maintenant ?** Ou préférez-vous une autre approche ?
