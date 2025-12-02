# Implémentation Complète - Système de Paiements

**Date :** 2 décembre 2025
**Statut :** Phase 1 & 2 Backend Terminées

---

## ✅ CE QUI EST TERMINÉ

### Phase 1 : Événements Payants (Backend)

#### Fichiers Créés
1. **`/app/api/stripe/create-event-checkout/route.ts`** ✅
   - Récupère événement depuis Directus
   - Calcule prix total (adultes + enfants)
   - Crée session Stripe
   - Validation Zod

2. **`/IMPLEMENTATION_EVENEMENTS_PAYANTS.md`** ✅
   - Guide complet
   - Instructions Directus
   - Plan de tests

#### Fichiers Modifiés
1. **`/app/api/stripe/webhook/route.ts`** ✅
   - Router par type : EVENT_REGISTRATION, MEMBERSHIP, DONATION
   - `handleEventRegistrationPayment()` - Crée Payment + EventRegistration
   - `handleMembershipPayment()` - Crée User + Membership + Payment
   - `handleDonationPayment()` - Existant refactorisé

2. **`/lib/email.ts`** ✅
   - `sendEventRegistrationConfirmation()` - Email inscription événement

3. **`/prisma/schema.prisma`** ✅
   - Enum `MembershipRequestStatus`
   - Modèle `MembershipRequest` complet
   - Modèle `Membership` avec champs Stripe
   - Relations User ↔ MembershipRequest

### Phase 2 : Cotisations (Backend)

#### API Routes Créées ✅
1. **`/app/api/membership/apply/route.ts`**
   - Soumission demande d'adhésion
   - Validation Zod
   - Vérifie doublons
   - Envoie email confirmation

2. **`/app/api/admin/membership-requests/[id]/approve/route.ts`**
   - Authentification admin requise
   - Génère token unique (32 bytes)
   - Expiration 7 jours
   - Envoie email avec lien de paiement

3. **`/app/api/admin/membership-requests/[id]/reject/route.ts`**
   - Authentification admin
   - Raison de rejet obligatoire
   - Email diplomatique

4. **`/app/api/stripe/create-membership-payment/route.ts`**
   - Valide token
   - Vérifie expiration
   - Crée session Stripe 120 CHF
   - Metadata complet

#### Webhook Mis à Jour ✅
- **Imports ajoutés** : `bcryptjs`, `crypto`
- **Fonction `handleMembershipPayment()`** :
  - Recherche/crée utilisateur
  - Crée Membership (ACTIVE, 120 CHF, 1 an)
  - Crée Payment
  - Met à jour MembershipRequest (COMPLETED)
  - Envoie email bienvenue

---

## ⏳ CE QUI RESTE À FAIRE

### 1. Templates Emails (À ajouter dans `/lib/email.ts`)

#### Template 1 : Demande Reçue
```typescript
export async function sendMembershipApplicationReceived(data: {
  email: string
  firstName: string
  requestId: string
}) {
  const content = `
    <h2 style="color: #059669;">Demande d'adhésion reçue</h2>
    <p>Assalamu alaikum ${data.firstName},</p>
    <p>Nous avons bien reçu votre demande d'adhésion.</p>
    <p>Notre équipe va l'examiner et vous recevrez un email dans les 48h.</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <p><strong>📋 Référence :</strong> ${data.requestId.slice(0, 8).toUpperCase()}</p>
    </div>
    <p>Barakallahou fikoum pour votre intérêt.</p>
  `
  return sendEmail({
    to: data.email,
    subject: 'Demande d\'adhésion reçue - Mosquée Madretsch',
    html: getEmailTemplate(content),
  })
}
```

#### Template 2 : Demande Approuvée
```typescript
export async function sendMembershipApproved(data: {
  email: string
  firstName: string
  membershipType: string
  amount: number
  paymentUrl: string
  expiresAt: Date
}) {
  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 6px;">
      <h3 style="color: #047857;">✅ Votre adhésion est approuvée !</h3>
    </div>
    <h2 style="color: #059669;">Excellente nouvelle !</h2>
    <p>Assalamu alaikum ${data.firstName},</p>
    <p>Votre demande d'adhésion a été approuvée.</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>💰 Cotisation annuelle</strong></p>
      <p style="font-size: 24px; color: #059669; font-weight: bold; margin: 10px 0;">
        ${data.amount}.00 CHF
      </p>
      <p><strong>Type :</strong> Membre ${data.membershipType}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.paymentUrl}"
         style="background-color: #059669; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
        Payer maintenant (${data.amount} CHF)
      </a>
    </div>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px;">
      <p style="color: #92400e; margin: 0;">
        ⚠️ Ce lien est valable jusqu'au <strong>${data.expiresAt.toLocaleDateString('fr-FR')}</strong>
      </p>
    </div>
    <p>Qu'Allah vous récompense pour votre soutien.<br>Barakallahou fikoum.</p>
  `
  return sendEmail({
    to: data.email,
    subject: '🎉 Votre adhésion est approuvée !',
    html: getEmailTemplate(content),
  })
}
```

#### Template 3 : Demande Rejetée
```typescript
export async function sendMembershipRejected(data: {
  email: string
  firstName: string
  reason: string
}) {
  const content = `
    <h2 style="color: #6b7280;">Concernant votre demande d'adhésion</h2>
    <p>Assalamu alaikum ${data.firstName},</p>
    <p>Après examen de votre demande, nous ne sommes malheureusement pas en mesure de l'approuver pour le moment.</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Raison :</strong></p>
      <p>${data.reason}</p>
    </div>
    <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
    <p>Barakallahou fikoum.</p>
  `
  return sendEmail({
    to: data.email,
    subject: 'Concernant votre demande d\'adhésion',
    html: getEmailTemplate(content),
  })
}
```

#### Template 4 : Bienvenue Membre
```typescript
export async function sendMembershipWelcome(data: {
  email: string
  firstName: string
  membershipType: string
  startDate: Date
  endDate: Date
  isNewAccount: boolean
}) {
  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 6px;">
      <h3 style="color: #047857;">🎉 Bienvenue dans notre communauté !</h3>
    </div>
    <h2 style="color: #059669;">Assalamu alaikum ${data.firstName},</h2>
    <p>Votre paiement a été reçu avec succès. Bienvenue en tant que membre de la Mosquée Madretsch !</p>
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">📋 Informations</h3>
      <p><strong>Type :</strong> Membre ${data.membershipType}</p>
      <p><strong>Période :</strong> ${data.startDate.toLocaleDateString('fr-FR')} - ${data.endDate.toLocaleDateString('fr-FR')}</p>
      <p><strong>Cotisation :</strong> 120 CHF ✓ Payé</p>
    </div>
    ${data.isNewAccount ? `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #1e40af; margin: 0 0 10px 0; font-weight: 600;">🔐 Votre compte membre a été créé !</p>
        <p style="color: #1e40af; margin: 0;">Vous recevrez un email séparé pour définir votre mot de passe.</p>
      </div>
    ` : ''}
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
      <h3>Avantages membres :</h3>
      <ul>
        <li>Accès à l'espace membre en ligne</li>
        <li>Priorité pour les événements</li>
        <li>Réductions sur les activités</li>
        ${data.membershipType === 'ACTIF' ? '<li><strong>Droit de vote aux assemblées générales</strong></li>' : ''}
      </ul>
    </div>
    <p>Qu'Allah vous récompense pour votre soutien.<br>Barakallahou fikoum.</p>
  `
  return sendEmail({
    to: data.email,
    subject: '🎉 Bienvenue à la Mosquée Madretsch !',
    html: getEmailTemplate(content),
  })
}
```

#### Template 5 : Notification Admin
```typescript
export async function sendAdminNotification(data: {
  subject: string
  message: string
  link?: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mosquee.ch'
  const content = `
    <h2 style="color: #059669;">${data.subject}</h2>
    <p>${data.message}</p>
    ${data.link ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.link}"
           style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Voir dans l'admin
        </a>
      </div>
    ` : ''}
  `
  return sendEmail({
    to: adminEmail,
    subject: `[Admin] ${data.subject}`,
    html: getEmailTemplate(content),
  })
}
```

### 2. Pages Frontend

Ces templates sont fournis comme référence - vous devrez les adapter au style de votre application.

#### Page `/devenir-membre` (Formulaire Public)

**Fichier :** `/app/devenir-membre/page.tsx`

Composants nécessaires :
- Formulaire avec tous les champs (prénom, nom, email, phone, adresse, etc.)
- Sélection type de membre (Radio: ACTIF / PASSIF)
- Date picker pour date de début
- Bouton "Soumettre ma demande"
- Affichage "120 CHF/an"

Code de soumission :
```typescript
const handleSubmit = async (data) => {
  const res = await fetch('/api/membership/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (res.ok) {
    // Afficher message de succès
    // "Votre demande a été soumise ! Vous recevrez un email dans les 48h."
  }
}
```

#### Page `/adhesion/payer/[token]` (Paiement)

**Fichier :** `/app/adhesion/payer/[token]/page.tsx`

```typescript
export default async function MembershipPaymentPage({
  params
}: {
  params: { token: string }
}) {
  const request = await prisma.membershipRequest.findUnique({
    where: { paymentToken: params.token }
  })

  // Vérifications
  if (!request) return <ErrorPage message="Lien invalide" />
  if (request.status === 'COMPLETED') return <AlreadyPaidPage />
  if (request.paymentExpiresAt && request.paymentExpiresAt < new Date()) {
    return <ExpiredLinkPage />
  }

  const handlePayment = async () => {
    const res = await fetch('/api/stripe/create-membership-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1>Finaliser votre adhésion</h1>
      <div className="bg-green-50 p-4 rounded">
        ✓ Votre demande a été approuvée !
      </div>
      <div className="mt-6">
        <p>Type : Membre {request.membershipType}</p>
        <p>Nom : {request.firstName} {request.lastName}</p>
        <p>Montant : <strong>120.00 CHF</strong></p>
      </div>
      <button onClick={handlePayment} className="...">
        Payer 120 CHF et activer mon adhésion
      </button>
    </div>
  )
}
```

#### Page `/adhesion/success` (Confirmation)

**Fichier :** `/app/adhesion/success/page.tsx`

Page de succès après paiement (similaire à `/evenements/inscription-success`).

### 3. Interface Admin

#### Page `/admin/demandes-adhesion`

**Fichier :** `/app/admin/demandes-adhesion/page.tsx`

Fonctionnalités :
- Liste des demandes avec filtres par statut (Tabs: PENDING, APPROVED, COMPLETED, REJECTED)
- Pour chaque demande PENDING :
  - Bouton "Approuver" → Appelle `/api/admin/membership-requests/[id]/approve`
  - Bouton "Rejeter" → Modal avec textarea pour la raison → Appelle `/api/admin/membership-requests/[id]/reject`
- Affichage des informations : nom, email, type, date souhaitée, statut
- Statistiques en haut de page

Code de base :
```typescript
export default async function MembershipRequestsPage() {
  const requests = await prisma.membershipRequest.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/membership-requests/${id}/approve`, {
      method: 'POST'
    })
    if (res.ok) {
      router.refresh()
    }
  }

  const handleReject = async (id: string, reason: string) => {
    const res = await fetch(`/api/admin/membership-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <div>
      {/* Stats Cards */}
      {/* Tabs pour filtrer par statut */}
      {/* Table avec actions */}
    </div>
  )
}
```

---

## 🧪 Plan de Tests

### Test Complet - Workflow Cotisation

1. **Soumission** :
   - Aller sur `/devenir-membre`
   - Remplir le formulaire (type ACTIF, email test)
   - Soumettre → Vérifier email "Demande reçue"

2. **Approbation Admin** :
   - Aller sur `/admin/demandes-adhesion`
   - Voir la demande en statut PENDING
   - Cliquer "Approuver"
   - Vérifier email "Demande approuvée" avec lien de paiement

3. **Paiement** :
   - Cliquer sur le lien dans l'email (ou copier token)
   - Page `/adhesion/payer/[token]` doit s'afficher
   - Cliquer "Payer 120 CHF"
   - Redirection vers Stripe
   - Payer avec carte test : `4242 4242 4242 4242`

4. **Webhook** :
   - Vérifier dans les logs :
     ```
     📥 Webhook reçu - Type: MEMBERSHIP
     💳 Traitement cotisation: [requestId]
     ✅ Nouvel utilisateur créé: [email]
     ✅ Membership créé: [id] - ACTIF
     ✅ MembershipRequest mise à jour: COMPLETED
     📧 Email de bienvenue envoyé
     ```

5. **Vérifications Base de Données** (Prisma Studio) :
   - Table `users` : nouvel utilisateur créé (si n'existait pas)
   - Table `memberships` : nouveau membership ACTIVE, 120 CHF, dates correctes
   - Table `payments` : paiement COMPLETED, 120 CHF
   - Table `membership_requests` : statut COMPLETED, userId et membershipId remplis

6. **Email Final** :
   - Vérifier réception email "Bienvenue"
   - Doit contenir : type de membre, dates, mention compte créé si nouveau

---

## 📦 Variables d'Environnement Requises

```bash
# Déjà configurées
DATABASE_URL=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...

# À ajouter (optionnel)
ADMIN_EMAIL=admin@mosquee.ch  # Pour notifications admin
```

---

## 📝 Checklist Finale

### Backend ✅
- [x] Modèle Prisma `MembershipRequest`
- [x] API `/api/membership/apply`
- [x] API `/api/admin/membership-requests/[id]/approve`
- [x] API `/api/admin/membership-requests/[id]/reject`
- [x] API `/api/stripe/create-membership-payment`
- [x] Webhook handler `handleMembershipPayment()`

### Emails ⏳
- [ ] `sendMembershipApplicationReceived()` - Copier template ci-dessus
- [ ] `sendMembershipApproved()` - Copier template ci-dessus
- [ ] `sendMembershipRejected()` - Copier template ci-dessus
- [ ] `sendMembershipWelcome()` - Copier template ci-dessus
- [ ] `sendAdminNotification()` - Copier template ci-dessus

### Frontend ⏳
- [ ] Page `/devenir-membre` (formulaire public)
- [ ] Page `/adhesion/payer/[token]` (paiement)
- [ ] Page `/adhesion/success` (confirmation)
- [ ] Interface admin `/admin/demandes-adhesion`

### Phase 1 (Événements) ⏳
- [ ] Modifier `/components/EventRegistrationModal.tsx`
- [ ] Créer `/app/evenements/inscription-success/page.tsx`
- [ ] Configurer Directus (champs price, child_price, requires_payment)

---

## 🎯 Priorités

**HAUTE** (Critique pour tester) :
1. Ajouter les templates emails dans `/lib/email.ts`
2. Créer page `/devenir-membre`
3. Créer page `/adhesion/payer/[token]`
4. Créer interface admin `/admin/demandes-adhesion`

**MOYENNE** (Phase 1 événements) :
5. Modifier modal d'inscription événements
6. Créer page succès événements
7. Configurer Directus

---

## 🔗 Documents de Référence

- **Plan global** : `/PLAN_INSCRIPTIONS_PAIEMENTS.md`
- **Workflow cotisations** : `/WORKFLOW_ADHESION_AVEC_APPROBATION.md`
- **Guide événements** : `/IMPLEMENTATION_EVENEMENTS_PAYANTS.md`
- **Ce document** : `/IMPLEMENTATION_COMPLETE.md`

---

**Dernière mise à jour :** 2 décembre 2025
**Statut :** Backend Phase 1 & 2 terminé - Frontend en attente
