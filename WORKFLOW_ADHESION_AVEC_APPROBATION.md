# Workflow d'Adhésion avec Approbation Administrative

**Date :** 2 décembre 2025
**Statut :** SPÉCIFICATION

---

## Vue d'ensemble

Workflow en **5 étapes** pour les demandes d'adhésion avec validation manuelle par l'administration avant paiement.

---

## Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DEMANDE D'ADHÉSION (Utilisateur)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Formulaire rempli
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ENREGISTREMENT EN BASE                                      │
│    - MembershipRequest (status: PENDING)                       │
│    - Email de confirmation de réception                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Admin consulte
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. VALIDATION ADMIN                                            │
│    Interface: /admin/demandes-adhesion                         │
│    Actions: APPROUVER / REJETER                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
              APPROUVÉ                 REJETÉ
                 │                         │
                 ▼                         ▼
┌───────────────────────────┐    ┌──────────────────┐
│ 4. LIEN DE PAIEMENT       │    │ Email de refus   │
│    - Générer token unique │    │ (avec raison)    │
│    - Email avec lien      │    │ Statut: REJECTED │
│    - Lien dans espace     │    └──────────────────┘
│      membre (si compte)   │
└───────────────────────────┘
                 │
                 │ Utilisateur clique
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PAIEMENT STRIPE                                             │
│    - Checkout Session 120 CHF                                  │
│    - Webhook → Créer Membership + User (si besoin)            │
│    - Email de bienvenue                                        │
│    - Statut: COMPLETED                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Formulaire de Demande d'Adhésion

**Page :** `/devenir-membre`

### Champs du formulaire

```typescript
interface MembershipApplicationForm {
  // Type de membre
  membershipType: 'ACTIF' | 'PASSIF'

  // Informations personnelles
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: Date

  // Adresse
  address: string
  city: string
  postalCode: string
  country: string

  // Date souhaitée
  desiredStartDate: Date  // Min: 01/01/année en cours

  // Message optionnel
  motivation?: string  // "Pourquoi souhaitez-vous adhérer ?"
}
```

### Comportement du formulaire

- Validation Zod côté client
- Bouton : **"Soumettre ma demande d'adhésion"** (pas "Payer")
- Message après soumission :
  > "Votre demande a été reçue. Vous recevrez un email dès qu'elle sera examinée par notre équipe."

---

## 2. Nouveau Modèle Prisma : MembershipRequest

```prisma
enum MembershipRequestStatus {
  PENDING        // En attente de validation
  APPROVED       // Approuvé, en attente de paiement
  PAYMENT_SENT   // Lien de paiement envoyé
  COMPLETED      // Payé et membership créé
  REJECTED       // Refusé par admin
  EXPIRED        // Lien de paiement expiré (> 7 jours)
}

model MembershipRequest {
  id                String                   @id @default(uuid()) @db.Uuid

  // Informations du demandeur
  firstName         String
  lastName          String
  email             String
  phone             String
  dateOfBirth       DateTime?

  // Adresse
  address           String
  city              String
  postalCode        String
  country           String                   @default("Suisse")

  // Type et dates
  membershipType    MembershipType           // ACTIF ou PASSIF
  desiredStartDate  DateTime

  // Message optionnel
  motivation        String?

  // Statut et workflow
  status            MembershipRequestStatus  @default(PENDING)

  // Validation admin
  reviewedBy        String?                  @db.Uuid  // Admin user ID
  reviewedAt        DateTime?
  rejectionReason   String?

  // Lien de paiement
  paymentToken      String?                  @unique  // Token unique pour URL
  paymentLinkSentAt DateTime?
  paymentExpiresAt  DateTime?                         // 7 jours après approbation

  // Paiement
  stripeSessionId   String?                  @unique
  paidAt            DateTime?
  membershipId      String?                  @db.Uuid  // Membership créé après paiement
  userId            String?                  @db.Uuid  // User créé/lié après paiement

  // Métadonnées
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt

  // Relations
  membership        Membership?              @relation(fields: [membershipId], references: [id])
  user              User?                    @relation(fields: [userId], references: [id])

  @@map("membership_requests")
  @@index([email])
  @@index([status])
  @@index([paymentToken])
}
```

---

## 3. API Routes

### 3.1 Soumission de la demande

**POST `/api/membership/apply`**

```typescript
// Validation
const schema = z.object({
  membershipType: z.enum(['ACTIF', 'PASSIF']),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default('Suisse'),
  desiredStartDate: z.string().datetime(),
  motivation: z.string().optional(),
})

// Handler
export async function POST(req: Request) {
  const data = schema.parse(await req.json())

  // Vérifier si email existe déjà avec demande en cours
  const existing = await prisma.membershipRequest.findFirst({
    where: {
      email: data.email.toLowerCase(),
      status: { in: ['PENDING', 'APPROVED', 'PAYMENT_SENT'] }
    }
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà une demande en cours' },
      { status: 400 }
    )
  }

  // Créer la demande
  const request = await prisma.membershipRequest.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      status: 'PENDING'
    }
  })

  // Envoyer email de confirmation de réception
  await sendMembershipApplicationReceived({
    email: data.email,
    firstName: data.firstName,
    requestId: request.id
  })

  // Notifier l'admin
  await sendAdminNotification({
    subject: 'Nouvelle demande d\'adhésion',
    message: `${data.firstName} ${data.lastName} (${data.email}) - Type: ${data.membershipType}`
  })

  return NextResponse.json({
    success: true,
    requestId: request.id
  })
}
```

### 3.2 Approbation par admin

**POST `/api/admin/membership-requests/[id]/approve`**

```typescript
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Vérifier auth admin
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'IMAM'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const request = await prisma.membershipRequest.findUnique({
    where: { id: params.id }
  })

  if (!request || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  // Générer token unique pour le lien de paiement
  const paymentToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 jours

  // Mettre à jour la demande
  const updated = await prisma.membershipRequest.update({
    where: { id: params.id },
    data: {
      status: 'APPROVED',
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      paymentToken,
      paymentExpiresAt: expiresAt
    }
  })

  // Générer le lien de paiement
  const paymentUrl = `${process.env.NEXTAUTH_URL}/adhesion/payer/${paymentToken}`

  // Envoyer email avec lien de paiement
  await sendMembershipApprovedEmail({
    email: updated.email,
    firstName: updated.firstName,
    membershipType: updated.membershipType,
    amount: 120,
    paymentUrl,
    expiresAt
  })

  return NextResponse.json({
    success: true,
    paymentUrl
  })
}
```

### 3.3 Rejet de la demande

**POST `/api/admin/membership-requests/[id]/reject`**

```typescript
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'IMAM'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reason } = await req.json()

  const updated = await prisma.membershipRequest.update({
    where: { id: params.id },
    data: {
      status: 'REJECTED',
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason
    }
  })

  // Envoyer email de refus (diplomatique)
  await sendMembershipRejectedEmail({
    email: updated.email,
    firstName: updated.firstName,
    reason
  })

  return NextResponse.json({ success: true })
}
```

### 3.4 Page de paiement

**GET `/adhesion/payer/[token]`**

```typescript
// app/adhesion/payer/[token]/page.tsx
export default async function MembershipPaymentPage({
  params
}: {
  params: { token: string }
}) {
  const request = await prisma.membershipRequest.findUnique({
    where: { paymentToken: params.token }
  })

  // Vérifications
  if (!request) {
    return <ErrorPage message="Lien invalide" />
  }

  if (request.status === 'COMPLETED') {
    return <AlreadyPaidPage />
  }

  if (request.paymentExpiresAt && request.paymentExpiresAt < new Date()) {
    return <ExpiredLinkPage email={request.email} />
  }

  if (!['APPROVED', 'PAYMENT_SENT'].includes(request.status)) {
    return <ErrorPage message="Demande non approuvée" />
  }

  // Afficher page de paiement
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">
          Finaliser votre adhésion
        </h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800 font-medium">
            ✓ Votre demande a été approuvée !
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <InfoRow label="Type de membre" value={request.membershipType} />
          <InfoRow label="Nom" value={`${request.firstName} ${request.lastName}`} />
          <InfoRow label="Email" value={request.email} />
          <InfoRow label="Date de début" value={formatDate(request.desiredStartDate)} />

          <div className="border-t pt-4 mt-4">
            <InfoRow
              label="Montant à payer"
              value="120.00 CHF"
              highlight
            />
          </div>
        </div>

        <form action="/api/stripe/create-membership-payment" method="POST">
          <input type="hidden" name="token" value={params.token} />
          <button
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition"
          >
            Payer 120 CHF et activer mon adhésion
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Paiement sécurisé par Stripe
        </p>
      </div>
    </div>
  )
}
```

### 3.5 Création du paiement Stripe

**POST `/api/stripe/create-membership-payment`**

```typescript
export async function POST(req: Request) {
  const formData = await req.formData()
  const token = formData.get('token') as string

  const request = await prisma.membershipRequest.findUnique({
    where: { paymentToken: token }
  })

  if (!request || !['APPROVED', 'PAYMENT_SENT'].includes(request.status)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  // Créer la session Stripe
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'chf',
          product_data: {
            name: `Cotisation annuelle - Membre ${request.membershipType}`,
            description: `Adhésion du ${formatDate(request.desiredStartDate)} au ${formatDate(addYears(request.desiredStartDate, 1))}`
          },
          unit_amount: 12000, // 120 CHF
        },
        quantity: 1,
      },
    ],
    customer_email: request.email,
    success_url: `${process.env.NEXTAUTH_URL}/adhesion/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/adhesion/payer/${token}`,
    metadata: {
      type: 'MEMBERSHIP',
      requestId: request.id,
      membershipType: request.membershipType,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
    }
  })

  // Mettre à jour le statut
  await prisma.membershipRequest.update({
    where: { id: request.id },
    data: {
      status: 'PAYMENT_SENT',
      paymentLinkSentAt: new Date()
    }
  })

  return NextResponse.redirect(session.url!)
}
```

---

## 4. Webhook Stripe - Traitement du Paiement

**Modification de `/api/stripe/webhook/route.ts`**

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata

  if (metadata.type === 'MEMBERSHIP') {
    await handleMembershipPayment(session, metadata)
  }
  // ... autres types
}

async function handleMembershipPayment(
  session: Stripe.Checkout.Session,
  metadata: any
) {
  const request = await prisma.membershipRequest.findUnique({
    where: { id: metadata.requestId }
  })

  if (!request) {
    console.error('MembershipRequest not found:', metadata.requestId)
    return
  }

  // 1. Rechercher ou créer l'utilisateur
  let user = await prisma.user.findUnique({
    where: { email: request.email.toLowerCase() }
  })

  const isNewUser = !user

  if (!user) {
    const tempPassword = crypto.randomBytes(16).toString('hex')
    const hashedPassword = await hash(tempPassword, 12)

    user = await prisma.user.create({
      data: {
        email: request.email.toLowerCase(),
        password: hashedPassword,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone,
        address: `${request.address}, ${request.postalCode} ${request.city}, ${request.country}`,
        role: 'MEMBER'
      }
    })
  }

  // 2. Créer le Membership
  const startDate = new Date(request.desiredStartDate)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      type: request.membershipType,
      status: 'ACTIVE',
      amount: 120,
      startDate,
      endDate,
      stripeSessionId: session.id
    }
  })

  // 3. Créer le Payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      amount: 120,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      paidAt: new Date(),
      metadata: {
        type: 'MEMBERSHIP',
        membershipType: request.membershipType,
        requestId: request.id
      }
    }
  })

  // 4. Mettre à jour la demande
  await prisma.membershipRequest.update({
    where: { id: request.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      membershipId: membership.id,
      userId: user.id,
      stripeSessionId: session.id
    }
  })

  // 5. Envoyer email de bienvenue
  if (isNewUser) {
    // Générer token de réinitialisation de mot de passe
    const resetToken = await generatePasswordResetToken(user.email)

    await sendMembershipWelcomeEmail({
      email: user.email,
      firstName: user.firstName,
      membershipType: request.membershipType,
      startDate,
      endDate,
      isNewAccount: true,
      setPasswordUrl: `${process.env.NEXTAUTH_URL}/definir-mot-de-passe/${resetToken}`
    })
  } else {
    await sendMembershipConfirmationEmail({
      email: user.email,
      firstName: user.firstName,
      membershipType: request.membershipType,
      startDate,
      endDate
    })
  }
}
```

---

## 5. Interface Admin

**Page `/admin/demandes-adhesion`**

### Fonctionnalités

- Liste des demandes par statut (Tabs)
- Filtres : Type de membre, Date, Recherche
- Actions : Approuver, Rejeter, Voir détails
- Statistiques : En attente, Approuvées, Complétées

### Composant principal

```typescript
export default async function MembershipRequestsPage() {
  const requests = await prisma.membershipRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true } },
      membership: { select: { id: true, status: true } }
    }
  })

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }

  return (
    <div>
      <h1>Demandes d'adhésion</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="En attente" value={stats.pending} color="yellow" />
        <StatCard label="Approuvées" value={stats.approved} color="blue" />
        <StatCard label="Complétées" value={stats.completed} color="green" />
        <StatCard label="Rejetées" value={stats.rejected} color="red" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approuvées ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Complétées ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="all">Toutes</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <RequestsTable
            requests={requests.filter(r => r.status === 'PENDING')}
          />
        </TabsContent>

        {/* ... autres tabs */}
      </Tabs>
    </div>
  )
}
```

### Table des demandes

```typescript
function RequestsTable({ requests }: { requests: MembershipRequest[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Nom</th>
          <th>Email</th>
          <th>Type</th>
          <th>Début souhaité</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {requests.map(request => (
          <tr key={request.id}>
            <td>{formatDate(request.createdAt)}</td>
            <td>{request.firstName} {request.lastName}</td>
            <td>{request.email}</td>
            <td>
              <Badge variant={request.membershipType === 'ACTIF' ? 'default' : 'secondary'}>
                {request.membershipType}
              </Badge>
            </td>
            <td>{formatDate(request.desiredStartDate)}</td>
            <td><StatusBadge status={request.status} /></td>
            <td>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={request.status !== 'PENDING'}
                >
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(request.id)}
                  disabled={request.status !== 'PENDING'}
                >
                  Rejeter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewDetails(request.id)}
                >
                  Détails
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## 6. Templates d'Emails

### 6.1 Email : Demande reçue

```
Sujet : Demande d'adhésion reçue - Mosquée Madretsch

Assalamu alaikum [Prénom],

Nous avons bien reçu votre demande d'adhésion en tant que Membre [ACTIF/PASSIF].

Notre équipe va examiner votre demande et vous recevrez un email dans les 48h.

📋 Récapitulatif :
- Type : Membre [Actif/Passif]
- Date de début souhaitée : [Date]

Barakallahou fikoum pour votre intérêt.

L'équipe de la Mosquée Madretsch
```

### 6.2 Email : Demande approuvée + Lien de paiement

```
Sujet : Votre adhésion est approuvée ! 🎉

Assalamu alaikum [Prénom],

Excellente nouvelle ! Votre demande d'adhésion a été approuvée.

Pour finaliser votre adhésion, veuillez procéder au paiement de la cotisation annuelle :

┌──────────────────────────────────┐
│  COTISATION ANNUELLE              │
│  Membre [ACTIF/PASSIF] : 120 CHF  │
│  Période : [Date] - [Date +1an]   │
└──────────────────────────────────┘

[Bouton CTA : Payer maintenant (120 CHF)]

⚠️ Ce lien est valable pendant 7 jours.

Une fois le paiement effectué, vous recevrez vos accès à l'espace membre.

Qu'Allah vous récompense pour votre soutien.
Barakallahou fikoum.
```

### 6.3 Email : Paiement reçu + Bienvenue

```
Sujet : Bienvenue dans notre communauté ! 🕌

Assalamu alaikum [Prénom],

Votre paiement a été reçu avec succès. Bienvenue en tant que membre de la Mosquée Madretsch !

✅ Votre adhésion est maintenant active

📋 Informations :
- Type : Membre [ACTIF/PASSIF]
- Période : [Date début] - [Date fin]
- Cotisation : 120 CHF ✓ Payé

🔐 Votre compte membre a été créé !

[Bouton : Définir mon mot de passe]

En tant que membre actif, vous bénéficiez du droit de vote lors des assemblées générales.

Avantages membres :
- Accès à l'espace membre
- Priorité pour les événements
- Réductions sur les activités
- Participation aux décisions (membres actifs)

Reçu de paiement en pièce jointe.

Barakallahou fikoum.
```

---

## 7. Espace Membre - Suivi de la demande

**Page `/membre/mon-adhesion`**

Si l'utilisateur a soumis une demande mais n'a pas encore de compte, il peut consulter le statut via un lien dans l'email de confirmation.

**Page publique `/adhesion/statut/[email]/[token]`**

Permet de vérifier le statut sans compte :

```typescript
export default async function MembershipStatusPage({
  params
}: {
  params: { email: string, token: string }
}) {
  // Vérifier token de vérification (généré lors de la demande)
  const request = await prisma.membershipRequest.findFirst({
    where: {
      email: decodeURIComponent(params.email),
      // Vérifier un token de consultation
    }
  })

  return (
    <div className="max-w-2xl mx-auto py-12">
      <StatusTracker request={request} />
    </div>
  )
}
```

---

## 8. Résumé des Modifications

### Nouveautés

✅ Modèle `MembershipRequest` avec workflow complet
✅ Interface admin `/admin/demandes-adhesion`
✅ Page de paiement avec token unique `/adhesion/payer/[token]`
✅ API d'approbation/rejet
✅ Génération de liens de paiement personnalisés
✅ 3 nouveaux emails automatiques
✅ Gestion d'expiration des liens (7 jours)
✅ Tracking du statut de la demande

### Avantages de ce workflow

1. **Contrôle administratif** : Validation manuelle avant acceptation
2. **Filtrage** : Éviter les demandes frauduleuses
3. **Contact humain** : Email personnalisé d'approbation
4. **Flexibilité** : Admin peut demander plus d'infos avant d'approuver
5. **Sécurité** : Lien de paiement unique et à usage unique
6. **Expiration** : Liens expirés après 7 jours (évite les paiements tardifs)

---

## 9. Modifications du Plan Initial

Le plan `PLAN_INSCRIPTIONS_PAIEMENTS.md` reste valable pour :
- **Événements** : Paiement immédiat (pas d'approbation nécessaire)
- **Activités** : Paiement immédiat, validation admin après

**Seulement les cotisations** utilisent le workflow d'approbation avant paiement.

---

## 10. Prochaines Étapes d'Implémentation

1. ✅ Spécification complète (ce document)
2. [ ] Créer le modèle `MembershipRequest` dans Prisma
3. [ ] Créer les API routes
4. [ ] Développer la page `/devenir-membre`
5. [ ] Développer l'interface admin `/admin/demandes-adhesion`
6. [ ] Créer la page de paiement `/adhesion/payer/[token]`
7. [ ] Mettre à jour le webhook Stripe
8. [ ] Créer les templates d'emails
9. [ ] Tests end-to-end

---

**Statut :** Prêt pour implémentation
**Temps estimé :** 2-3 semaines (Phase 2 du plan principal)
