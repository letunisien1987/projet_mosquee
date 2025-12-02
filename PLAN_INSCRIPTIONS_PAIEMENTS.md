# Plan Complet - Inscriptions avec Paiement
**Mosquée Madretsch - Système de Paiement pour Inscriptions**

Date de création : 2 décembre 2025
Statut : **PLANIFICATION**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Types de paiements](#2-types-de-paiements)
3. [Architecture technique](#3-architecture-technique)
4. [Flux de paiement détaillés](#4-flux-de-paiement-détaillés)
5. [Modifications de la base de données](#5-modifications-de-la-base-de-données)
6. [API Routes](#6-api-routes)
7. [Composants UI](#7-composants-ui)
8. [Webhook Stripe](#8-webhook-stripe)
9. [Emails automatiques](#9-emails-automatiques)
10. [Gestion des membres](#10-gestion-des-membres)
11. [Roadmap d'implémentation](#11-roadmap-dimplémentation)
12. [Sécurité et conformité](#12-sécurité-et-conformité)
13. [Budget et coûts](#13-budget-et-coûts)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Mettre en place un système complet de paiement sécurisé pour :
- **Événements** : Tous les événements nécessitant une inscription sont payants
- **Cotisations annuelles** : 120 CHF pour l'adhésion à la mosquée
- **Activités/Cours** : Inscriptions des élèves avec paiement

### 1.2 Exigences clés

- Paiement sécurisé via Stripe
- Confirmation automatique par email avec reçu
- Liaison automatique aux comptes membres
- Gestion des places disponibles
- Historique complet dans l'espace membre
- Support multi-participants (familles)

---

## 2. Types de paiements

### 2.1 Événements payants

**Caractéristiques :**
- Prix défini par événement dans Directus (champ `price`)
- Prix variable selon le type d'événement
- Support INDIVIDUAL et FAMILY (prix × nombre de participants)
- Exemple : Sortie familiale 50 CHF/personne, enfants 25 CHF

**Workflow :**
1. Utilisateur sélectionne un événement
2. Remplit le formulaire d'inscription
3. Voit le montant total à payer
4. Redirigé vers Stripe Checkout
5. Après paiement : inscription confirmée + email

### 2.2 Cotisations annuelles (Memberships)

**Caractéristiques :**
- Montant fixe : **120 CHF par an**
- Deux types de membres :
  - **Membre Actif** : Droit de vote aux assemblées (120 CHF)
  - **Membre Passif** : Soutien sans droit de vote (120 CHF)
- Date de début personnalisable (année en cours)
- Validité : 1 an à partir de la date de début
- Renouvellement annuel

**Informations collectées :**
- Nom et prénom
- Email
- Téléphone
- Adresse complète (rue, ville, code postal, pays)
- Type de membre (Actif / Passif)
- Date de début souhaitée

**Workflow :**
1. Formulaire sur page dédiée `/devenir-membre`
2. Choix du type de membre (Actif/Passif)
3. Saisie des informations personnelles
4. Paiement 120 CHF via Stripe
5. Création automatique du compte membre
6. Email de bienvenue avec statut de membre

### 2.3 Activités/Cours (Enrollments)

**Caractéristiques :**
- Prix défini par activité dans Directus
- Inscriptions possibles pour enfants (via profils enfants)
- Paiement avant validation de l'inscription
- Places limitées avec liste d'attente

**Workflow :**
1. Sélection d'une activité/cours
2. Choix du participant (utilisateur ou enfant)
3. Affichage du prix
4. Paiement via Stripe
5. Inscription enregistrée en statut PENDING
6. Validation manuelle par admin → statut APPROVED

---

## 3. Architecture technique

### 3.1 Stack technologique

**Frontend :**
- Next.js 16 avec App Router
- React 19
- TypeScript
- Tailwind CSS
- Composants de formulaire avec validation (Zod)

**Backend :**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (via Prisma Accelerate)

**CMS :**
- Directus pour la gestion des contenus (événements, activités)

**Paiement :**
- Stripe Checkout (mode payment)
- Webhook pour confirmations automatiques

**Emails :**
- Resend pour l'envoi d'emails
- Templates HTML personnalisés

### 3.2 Diagramme d'architecture

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │
         │ 1. Sélectionne événement/activité
         │    ou demande d'adhésion
         ▼
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 2. Remplit formulaire
         │    + Calcul du montant
         ▼
┌─────────────────┐
│   API Routes    │
│  /api/stripe/   │
│  create-checkout│
└────────┬────────┘
         │
         │ 3. Crée session Stripe
         ▼
┌─────────────────┐
│ Stripe Checkout │
│  (Page sécurisée)│
└────────┬────────┘
         │
         │ 4. Paiement par carte
         ▼
┌─────────────────┐
│  Stripe Webhook │
│  /api/stripe/   │
│  webhook        │
└────────┬────────┘
         │
         │ 5. Enregistre dans PostgreSQL
         │    + Envoie email
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Prisma)      │
└─────────────────┘
         │
         │ 6. Consultation
         ▼
┌─────────────────┐
│ Espace Membre   │
│  /membre/...    │
└─────────────────┘
```

---

## 4. Flux de paiement détaillés

### 4.1 Inscription à un événement payant

**Étape 1 : Page événement**
- Affichage du prix sur la carte de l'événement
- Bouton "S'inscrire" visible si places disponibles
- Si complet : Bouton "Liste d'attente"

**Étape 2 : Modal d'inscription**
- Formulaire avec :
  - Type de participation (INDIVIDUAL / FAMILY)
  - Informations personnelles
  - Nombre de participants (si FAMILY)
- **Affichage dynamique du prix total**
  - Exemple : 2 adultes + 3 enfants = (2 × 50 CHF) + (3 × 25 CHF) = 175 CHF
- Bouton "Payer et s'inscrire"

**Étape 3 : Création du paiement**
- Appel à `/api/stripe/create-event-checkout`
- Données envoyées :
  ```json
  {
    "eventId": "12",
    "participationType": "FAMILY",
    "numberOfAdults": 2,
    "numberOfChildren": 3,
    "totalAmount": 17500, // en centimes
    "contactEmail": "user@example.com",
    "contactName": "Jean Dupont",
    "contactPhone": "+41791234567"
  }
  ```
- Réponse : `{ "url": "https://checkout.stripe.com/..." }`

**Étape 4 : Paiement Stripe**
- Redirection vers Stripe Checkout
- Utilisateur entre ses coordonnées bancaires
- Validation 3D Secure si nécessaire

**Étape 5 : Webhook Stripe**
- Événement `checkout.session.completed`
- Extraction des metadata :
  - `eventId`, `participationType`, `numberOfAdults`, `numberOfChildren`
- **Enregistrement dans `EventRegistration`** :
  ```typescript
  {
    eventId: "12",
    eventTitle: "Sortie familiale",
    participationType: "FAMILY",
    numberOfAdults: 2,
    numberOfChildren: 3,
    firstName: "Jean",
    lastName: "Dupont",
    email: "user@example.com",
    phone: "+41791234567",
    attendees: 5,
    status: "CONFIRMED",
    requiresPayment: true,
    paymentAmount: 175,
    // Lien vers Payment
  }
  ```
- **Enregistrement dans `Payment`** :
  ```typescript
  {
    eventId: "12",
    amount: 175,
    currency: "CHF",
    status: "COMPLETED",
    stripeCheckoutId: "cs_...",
    paidAt: new Date()
  }
  ```
- **Envoi d'email** de confirmation avec reçu

**Étape 6 : Redirection**
- Utilisateur redirigé vers `/event-success?session_id=...`
- Affichage de la confirmation
- Bouton "Voir mes inscriptions"

### 4.2 Cotisation annuelle (Devenir membre)

**Étape 1 : Page adhésion `/devenir-membre`**
- Présentation des avantages
- Explication des types de membres
- Formulaire d'adhésion

**Étape 2 : Formulaire**
Champs à remplir :
- Type de membre (Actif / Passif) - Radio buttons
- Date de début d'adhésion (Sélecteur de date, min = 01/01/année en cours)
- Nom complet
- Téléphone
- Email
- Adresse complète :
  - Rue
  - Ville
  - Code postal
  - Pays (Suisse par défaut)
- Question/Remarque (textarea optionnel)

**Prix affiché** : **120 CHF** (fixe)

**Étape 3 : Soumission**
- Validation côté client (Zod)
- Appel à `/api/stripe/create-membership-checkout`
- Données :
  ```json
  {
    "membershipType": "ACTIF" | "PASSIF",
    "startDate": "2025-01-01",
    "fullName": "Jean Dupont",
    "email": "jean@example.com",
    "phone": "+41791234567",
    "address": "Rue de la Mosquée 12",
    "city": "Bienne",
    "postalCode": "2500",
    "country": "Suisse",
    "notes": "Question ou remarque..."
  }
  ```

**Étape 4 : Paiement Stripe**
- Montant fixe : 120 CHF (12000 centimes)
- Redirection Stripe Checkout

**Étape 5 : Webhook**
- Événement `checkout.session.completed`
- **Actions automatiques** :
  1. **Recherche utilisateur** par email
  2. Si n'existe pas → **Création automatique du compte**
     ```typescript
     const user = await prisma.user.create({
       data: {
         email: metadata.email,
         password: generateRandomPassword(), // Temporaire
         firstName: metadata.firstName,
         lastName: metadata.lastName,
         phone: metadata.phone,
         address: metadata.fullAddress,
         role: 'MEMBER'
       }
     })
     ```
  3. **Envoi email de bienvenue** avec :
     - Lien pour définir le mot de passe
     - Informations de connexion
     - Statut de membre confirmé

  4. **Création du Membership** :
     ```typescript
     await prisma.membership.create({
       data: {
         userId: user.id,
         type: metadata.membershipType, // ACTIF ou PASSIF
         status: 'ACTIVE',
         amount: 120,
         startDate: new Date(metadata.startDate),
         endDate: addYears(new Date(metadata.startDate), 1)
       }
     })
     ```

  5. **Création du Payment** :
     ```typescript
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
           membershipType: metadata.membershipType
         }
       }
     })
     ```

**Étape 6 : Email de bienvenue**
Template incluant :
- Message de remerciement
- Type de membre (Actif/Passif)
- Date de début et fin de l'adhésion
- Lien pour activer le compte (si nouveau)
- Informations pratiques
- Reçu de paiement (120 CHF)

### 4.3 Inscription à une activité/cours

**Étape 1 : Page activités**
- Liste des cours disponibles
- Affichage du prix sur chaque carte
- Indicateur de places disponibles
- Bouton "S'inscrire"

**Étape 2 : Modal d'inscription**
- Sélection du participant :
  - Moi-même
  - Un de mes enfants (liste déroulante)
- Informations de contact (pré-remplies si connecté)
- Niveau souhaité (si applicable)
- Notes / Allergies
- **Affichage du prix** de l'activité
- Bouton "Payer et s'inscrire"

**Étape 3 : Paiement**
- Similaire au flux événement
- Création de la session Stripe
- Redirection

**Étape 4 : Webhook**
- Enregistrement dans `Enrollment` avec statut **PENDING**
- Création du `Payment` lié
- Email de confirmation : "Inscription reçue, en attente de validation"

**Étape 5 : Validation admin**
- Admin consulte les inscriptions
- Approuve ou rejette
- Si approuvé → statut APPROVED + email
- Si rejeté → remboursement automatique Stripe

---

## 5. Modifications de la base de données

### 5.1 Ajouts au schéma Prisma

```prisma
// Dans Directus (CMS)
model DirectusEvent {
  id: string
  title: string
  date: datetime
  price: number?              // NOUVEAU : Prix de l'événement
  child_price: number?        // NOUVEAU : Prix réduit enfants
  max_capacity: number?
  registration_required: boolean
  requires_payment: boolean  // NOUVEAU : true/false
  // ... autres champs existants
}

model DirectusActivity {
  id: string
  title: string
  price: number?              // NOUVEAU : Prix de l'activité
  max_capacity: number?
  // ... autres champs existants
}

// Dans PostgreSQL (Prisma)
enum MembershipType {
  ACTIF   // NOUVEAU : Membre actif avec droit de vote
  PASSIF  // NOUVEAU : Membre passif sans droit de vote
  // Anciens types conservés pour compatibilité
  INDIVIDUAL
  FAMILY
  STUDENT
  SENIOR
}

model EventRegistration {
  // ... champs existants

  // NOUVEAUX CHAMPS
  requiresPayment   Boolean   @default(false)
  paymentAmount     Float?
  paymentId         String?   @db.Uuid
  payment           Payment?  @relation(fields: [paymentId], references: [id])
}

model Enrollment {
  // ... champs existants

  // NOUVEAUX CHAMPS
  requiresPayment   Boolean   @default(false)
  paymentAmount     Float?
  paymentId         String?   @db.Uuid
  payment           Payment?  @relation(fields: [paymentId], references: [id])
}

model Membership {
  // ... champs existants modifiés
  type   MembershipType  // Accepte maintenant ACTIF/PASSIF

  // NOUVEAUX CHAMPS
  stripeSessionId   String?  @unique
  receiptSent       Boolean  @default(false)
  receiptSentAt     DateTime?
}

model Payment {
  // ... champs existants

  // NOUVELLES RELATIONS
  eventRegistrations  EventRegistration[]
  enrollments         Enrollment[]        // NOUVEAU
  memberships         Membership[]        // NOUVEAU
}
```

### 5.2 Migration Prisma

```bash
# Commande à exécuter
npx prisma db push --accept-data-loss

# Génération du client
npx prisma generate
```

---

## 6. API Routes

### 6.1 Nouvelles routes à créer

**`/api/stripe/create-event-checkout` (POST)**
```typescript
// Créer une session Stripe pour inscription événement
interface RequestBody {
  eventId: string
  participationType: 'INDIVIDUAL' | 'FAMILY'
  numberOfAdults?: number
  numberOfChildren?: number
  contactName: string
  contactEmail: string
  contactPhone: string
}

// Logique :
// 1. Récupérer l'événement de Directus
// 2. Calculer le montant total (prix adulte × nb adultes + prix enfant × nb enfants)
// 3. Créer session Stripe avec metadata
// 4. Retourner URL de checkout
```

**`/api/stripe/create-membership-checkout` (POST)**
```typescript
// Créer une session Stripe pour cotisation
interface RequestBody {
  membershipType: 'ACTIF' | 'PASSIF'
  startDate: string
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  notes?: string
}

// Montant fixe : 120 CHF
```

**`/api/stripe/create-enrollment-checkout` (POST)**
```typescript
// Créer une session Stripe pour inscription activité
interface RequestBody {
  activityId: string
  userId?: string
  childId?: string
  levelId?: string
  contactEmail: string
  contactName: string
}
```

### 6.2 Routes existantes à modifier

**`/api/events/[id]/register` (POST)**
- Conserver pour les événements GRATUITS
- Rediriger vers paiement si `event.requires_payment === true`

**`/api/enrollments` (POST)**
- Idem : redirection vers paiement si activité payante

---

## 7. Composants UI

### 7.1 Composants à créer

**`<EventRegistrationWithPayment />`**
- Modal d'inscription avec calcul dynamique du prix
- Affichage du total
- Bouton "Payer X CHF et s'inscrire"

**`<MembershipForm />`**
- Formulaire complet d'adhésion
- Sélection type de membre (Radio)
- Date picker pour date de début
- Formulaire adresse
- Affichage "120 CHF" bien visible
- Bouton "Devenir membre (120 CHF)"

**`<EnrollmentWithPayment />`**
- Modal d'inscription avec prix de l'activité
- Sélection participant (self/child)
- Total affiché
- Bouton "Payer X CHF et s'inscrire"

**`<PriceDisplay />`**
- Composant réutilisable pour afficher un prix
- Format : "50.00 CHF"
- Variant : card, inline, large

**`<PaymentStatusBadge />`**
- Badge de statut de paiement
- COMPLETED → Vert "Payé"
- PENDING → Jaune "En attente"
- FAILED → Rouge "Échoué"

### 7.2 Pages à créer

**`/devenir-membre` (page.tsx)**
- Hero section avec appel à l'action
- Explication des types de membres
- Avantages de l'adhésion
- Formulaire d'adhésion
- Section FAQ

**`/membership-success` (page.tsx)**
- Page de confirmation après paiement cotisation
- Message de bienvenue
- Prochaines étapes
- Lien vers espace membre

---

## 8. Webhook Stripe

### 8.1 Gestion des événements

Mise à jour de `/api/stripe/webhook/route.ts` pour gérer :

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata

  // Identifier le type de paiement
  if (metadata.type === 'EVENT_REGISTRATION') {
    await handleEventRegistrationPayment(session, metadata)
  }
  else if (metadata.type === 'MEMBERSHIP') {
    await handleMembershipPayment(session, metadata)
  }
  else if (metadata.type === 'ENROLLMENT') {
    await handleEnrollmentPayment(session, metadata)
  }
  else if (metadata.type === 'DONATION') {
    await handleDonationPayment(session, metadata)
  }
}
```

### 8.2 Fonctions de traitement

**`handleEventRegistrationPayment()`**
```typescript
async function handleEventRegistrationPayment(
  session: Stripe.Checkout.Session,
  metadata: any
) {
  // 1. Rechercher utilisateur par email
  const user = await findOrCreateUser(metadata.contactEmail, {
    firstName: metadata.contactName.split(' ')[0],
    lastName: metadata.contactName.split(' ')[1],
    phone: metadata.contactPhone
  })

  // 2. Créer le Payment
  const payment = await prisma.payment.create({
    data: {
      userId: user?.id,
      eventId: metadata.eventId,
      amount: session.amount_total / 100,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      paidAt: new Date()
    }
  })

  // 3. Créer l'EventRegistration
  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: metadata.eventId,
      eventTitle: metadata.eventTitle,
      participationType: metadata.participationType,
      numberOfAdults: parseInt(metadata.numberOfAdults || '1'),
      numberOfChildren: parseInt(metadata.numberOfChildren || '0'),
      firstName: metadata.contactName.split(' ')[0],
      lastName: metadata.contactName.split(' ')[1],
      email: metadata.contactEmail,
      phone: metadata.contactPhone,
      attendees: parseInt(metadata.totalAttendees),
      status: 'CONFIRMED',
      requiresPayment: true,
      paymentAmount: payment.amount,
      paymentId: payment.id
    }
  })

  // 4. Envoyer email de confirmation
  await sendEventRegistrationConfirmation({
    email: metadata.contactEmail,
    name: metadata.contactName,
    eventTitle: metadata.eventTitle,
    eventDate: metadata.eventDate,
    amount: payment.amount,
    registrationId: registration.id
  })
}
```

**`handleMembershipPayment()`**
```typescript
async function handleMembershipPayment(
  session: Stripe.Checkout.Session,
  metadata: any
) {
  const email = metadata.email.toLowerCase()

  // 1. Rechercher ou créer utilisateur
  let user = await prisma.user.findUnique({ where: { email } })

  const isNewUser = !user

  if (!user) {
    const tempPassword = generateSecurePassword()
    const hashedPassword = await hash(tempPassword, 12)

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        phone: metadata.phone,
        address: `${metadata.address}, ${metadata.postalCode} ${metadata.city}, ${metadata.country}`,
        role: 'MEMBER'
      }
    })
  }

  // 2. Créer le Payment
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      amount: 120,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      paidAt: new Date(),
      metadata: {
        type: 'MEMBERSHIP',
        membershipType: metadata.membershipType
      }
    }
  })

  // 3. Créer le Membership
  const startDate = new Date(metadata.startDate)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      type: metadata.membershipType, // ACTIF ou PASSIF
      status: 'ACTIVE',
      amount: 120,
      startDate,
      endDate,
      stripeSessionId: session.id,
      receiptSent: false
    }
  })

  // 4. Envoyer email de bienvenue
  if (isNewUser) {
    await sendMembershipWelcomeEmail({
      email: user.email,
      firstName: user.firstName,
      membershipType: metadata.membershipType,
      startDate,
      endDate,
      isNewAccount: true
    })
  } else {
    await sendMembershipRenewalEmail({
      email: user.email,
      firstName: user.firstName,
      membershipType: metadata.membershipType,
      startDate,
      endDate
    })
  }

  // 5. Marquer le reçu comme envoyé
  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      receiptSent: true,
      receiptSentAt: new Date()
    }
  })
}
```

---

## 9. Emails automatiques

### 9.1 Templates à créer

**Email : Confirmation inscription événement payant**
```
Sujet : Inscription confirmée - [Titre événement]

Assalamu alaikum [Prénom],

Votre inscription à l'événement "[Titre]" a été confirmée.

📅 Date : [Date formatée]
📍 Lieu : [Lieu]
👥 Participants : [Nb adultes] adultes, [Nb enfants] enfants

💰 Montant payé : [X] CHF

[Bouton : Voir mes inscriptions]

Reçu de paiement en pièce jointe.

Barakallahou fikoum.
```

**Email : Bienvenue nouveau membre**
```
Sujet : Bienvenue à la Mosquée Madretsch !

Assalamu alaikum [Prénom],

Bienvenue dans notre communauté !

Votre adhésion en tant que Membre [ACTIF/PASSIF] a été confirmée.

📋 Informations :
- Type : Membre [Actif/Passif]
- Début : [Date]
- Fin : [Date + 1 an]
- Cotisation : 120 CHF

🔐 Votre compte membre a été créé !

[Bouton : Activer mon compte]

En tant que membre actif, vous disposez du droit de vote lors des assemblées générales.

[Liste des avantages membres]

Reçu de paiement en pièce jointe.

Qu'Allah vous récompense pour votre soutien.
Barakallahou fikoum.
```

**Email : Renouvellement cotisation**
```
Sujet : Cotisation renouvelée - Mosquée Madretsch

Assalamu alaikum [Prénom],

Votre cotisation annuelle a été renouvelée avec succès.

📋 Période : [Date début] - [Date fin]
💰 Montant : 120 CHF

[Bouton : Voir mon espace membre]

Reçu de paiement en pièce jointe.
```

### 9.2 Génération de reçus PDF

Utiliser une librairie comme `@react-pdf/renderer` ou `pdfkit` :

**Structure du reçu :**
```
┌────────────────────────────────┐
│   MOSQUÉE MADRETSCH            │
│   Association Musulmane        │
│   2503 Bienne                  │
├────────────────────────────────┤
│   REÇU DE PAIEMENT             │
│                                │
│   N° : [ID unique]             │
│   Date : [Date]                │
├────────────────────────────────┤
│   Client :                     │
│   [Nom Prénom]                 │
│   [Email]                      │
├────────────────────────────────┤
│   Détails :                    │
│   [Description paiement]       │
│   Montant : [X] CHF            │
│                                │
│   Mode de paiement : Carte     │
│   Statut : Payé                │
├────────────────────────────────┤
│   Merci pour votre confiance. │
│                                │
│   [QR Code ou Code-barres]     │
└────────────────────────────────┘
```

---

## 10. Gestion des membres

### 10.1 Espace membre amélioré

**Page `/membre/cotisation`**
- Affichage du statut actuel
- Type de membre (Actif/Passif)
- Date de fin d'adhésion
- Indicateur de validité
- Historique des cotisations
- Bouton "Renouveler" si proche de l'expiration

**Page `/membre/inscriptions`**
- Liste des inscriptions aux événements
- Filtres : À venir / Passés / Payés
- Statut de paiement
- Téléchargement des reçus

**Page `/membre/activites`**
- Inscriptions aux activités/cours
- Statut (PENDING / APPROVED)
- Paiements associés
- Calendrier des cours

### 10.2 Notifications automatiques

**Rappel expiration cotisation :**
- 30 jours avant : "Votre adhésion expire bientôt"
- 7 jours avant : "Dernière chance de renouveler"
- Le jour J : "Votre adhésion a expiré"

**Confirmation paiements :**
- Immédiat après paiement
- Avec reçu PDF en pièce jointe

---

## 11. Roadmap d'implémentation

### Phase 1 : Base (2-3 semaines)
**Objectif :** Paiements pour événements fonctionnels

- [ ] Ajouter champs `price` et `child_price` dans Directus events
- [ ] Modifier schéma Prisma (EventRegistration + Payment link)
- [ ] Créer `/api/stripe/create-event-checkout`
- [ ] Modifier composant EventRegistrationModal
- [ ] Mettre à jour le webhook pour gérer les paiements d'événements
- [ ] Créer templates email confirmation événement payant
- [ ] Tests end-to-end

**Livrables :**
- Inscription aux événements payants fonctionnelle
- Emails de confirmation automatiques
- Reçus en PDF

### Phase 2 : Cotisations (2 semaines)
**Objectif :** Système d'adhésion complet

- [ ] Créer page `/devenir-membre`
- [ ] Développer composant MembershipForm
- [ ] Créer `/api/stripe/create-membership-checkout`
- [ ] Mettre à jour webhook pour cotisations
- [ ] Créer email de bienvenue nouveaux membres
- [ ] Page `/membre/cotisation` avec statut
- [ ] Système de rappels automatiques (cron job)
- [ ] Tests

**Livrables :**
- Formulaire d'adhésion fonctionnel
- Création automatique de comptes membres
- Gestion du cycle de vie des adhésions

### Phase 3 : Activités (1-2 semaines)
**Objectif :** Paiements pour cours et activités

- [ ] Ajouter champ `price` dans Directus activities
- [ ] Modifier schéma Prisma (Enrollment + Payment link)
- [ ] Créer `/api/stripe/create-enrollment-checkout`
- [ ] Modifier composant EnrollmentForm
- [ ] Mettre à jour webhook pour enrollments
- [ ] Email confirmation inscription cours
- [ ] Workflow d'approbation admin
- [ ] Tests

**Livrables :**
- Inscriptions aux cours avec paiement
- Validation manuelle par admin
- Remboursement automatique si rejet

### Phase 4 : Améliorations (1 semaine)
**Objectif :** UX et fonctionnalités avancées

- [ ] Dashboard membre avec résumé
- [ ] Historique complet des paiements
- [ ] Téléchargement centralisé des reçus
- [ ] Notifications in-app
- [ ] Système de newsletter membres
- [ ] Analytics et reporting admin
- [ ] Optimisations performances

**Livrables :**
- Espace membre enrichi
- Reporting pour admin
- Notifications améliorées

---

## 12. Sécurité et conformité

### 12.1 Sécurité des paiements

✅ **PCI-DSS Compliance**
- Aucune donnée bancaire stockée localement
- Tout traité par Stripe (certifié PCI Level 1)
- Webhooks signés et vérifiés

✅ **Validation des données**
- Zod pour validation côté client et serveur
- Sanitisation des entrées
- Protection XSS et injection SQL (via Prisma)

✅ **Protection des API**
- Rate limiting sur les endpoints de paiement
- Vérification des montants côté serveur
- Logs de toutes les transactions

### 12.2 RGPD et données personnelles

✅ **Consentement**
- Case à cocher explicite sur formulaire adhésion
- Politique de confidentialité accessible
- Droit de retrait

✅ **Stockage des données**
- Chiffrement en transit (HTTPS)
- Chiffrement au repos (PostgreSQL)
- Rétention limitée (7 ans pour comptabilité)

✅ **Droits des utilisateurs**
- Accès aux données (espace membre)
- Modification (profil)
- Suppression (sur demande)
- Export des données

### 12.3 Conformité légale Suisse

✅ **Fiscalité**
- Reçus conformes pour déductibilité fiscale
- Mention du statut d'association à but non lucratif
- Conservation des justificatifs 10 ans

✅ **Protection des consommateurs**
- Informations claires sur les prix
- Conditions générales accessibles
- Politique de remboursement définie

---

## 13. Budget et coûts

### 13.1 Coûts de développement

**Phase 1 : Événements payants**
- Développement backend : 8-12h × 80 CHF = 640 - 960 CHF
- Développement frontend : 6-8h × 80 CHF = 480 - 640 CHF
- Tests et débogage : 4h × 80 CHF = 320 CHF
**Sous-total Phase 1 : 1'440 - 1'920 CHF**

**Phase 2 : Cotisations**
- Backend + Webhook : 8h × 80 CHF = 640 CHF
- Frontend formulaire : 8h × 80 CHF = 640 CHF
- Emails et templates : 4h × 80 CHF = 320 CHF
**Sous-total Phase 2 : 1'600 CHF**

**Phase 3 : Activités**
- Backend : 6h × 80 CHF = 480 CHF
- Frontend : 4h × 80 CHF = 320 CHF
- Workflow admin : 4h × 80 CHF = 320 CHF
**Sous-total Phase 3 : 1'120 CHF**

**Phase 4 : Améliorations**
- Dashboard et UX : 8h × 80 CHF = 640 CHF
- Analytics : 4h × 80 CHF = 320 CHF
**Sous-total Phase 4 : 960 CHF**

**TOTAL DÉVELOPPEMENT : 5'120 - 5'600 CHF**

### 13.2 Frais Stripe

**Tarification Stripe en Suisse :**
- Cartes européennes : **2.9% + 0.30 CHF** par transaction
- 3D Secure : inclus sans frais supplémentaires

**Exemples de coûts :**
- Événement 50 CHF : (50 × 0.029) + 0.30 = **1.75 CHF** de frais
- Cotisation 120 CHF : (120 × 0.029) + 0.30 = **3.78 CHF** de frais
- Cours 200 CHF : (200 × 0.029) + 0.30 = **6.10 CHF** de frais

**Projection annuelle (estimée) :**
- 100 cotisations × 120 CHF = 12'000 CHF → Frais : **378 CHF**
- 200 inscriptions événements (moy. 40 CHF) = 8'000 CHF → Frais : **262 CHF**
- 150 inscriptions cours (moy. 150 CHF) = 22'500 CHF → Frais : **683 CHF**

**Total frais Stripe estimé/an : ~1'323 CHF**

### 13.3 Autres coûts

**Resend (Emails) :**
- Gratuit jusqu'à 3'000 emails/mois
- Pro : 20$/mois (18 CHF) pour 50'000 emails/mois
**Estimation : Gratuit (faible volume)**

**Prisma Accelerate (Base de données) :**
- Starter : Gratuit
- Pro : 29$/mois (26 CHF) si besoin plus de perfs
**Estimation : Gratuit au début, ~300 CHF/an si upgrade**

---

## Récapitulatif des coûts

| Poste | Montant |
|-------|---------|
| **Développement initial** | 5'120 - 5'600 CHF |
| **Frais Stripe (annuel)** | ~1'323 CHF |
| **Infrastructure (annuel)** | ~300 CHF (si upgrade nécessaire) |
| **TOTAL PREMIÈRE ANNÉE** | **6'743 - 7'223 CHF** |
| **COÛT ANNUEL RÉCURRENT** | **1'623 CHF** |

---

## Conclusion

Ce plan fournit une roadmap complète pour implémenter un système de paiement sécurisé et professionnel pour la Mosquée Madretsch.

**Points clés :**
- Approche progressive en 4 phases
- Sécurité et conformité maximales
- Expérience utilisateur fluide
- Automatisation complète (webhooks, emails)
- Coûts prévisibles et maîtrisés

**Prochaines étapes :**
1. Validation du plan par l'équipe
2. Priorisation des phases
3. Lancement de la Phase 1

---

**Statut :** Prêt pour implémentation
**Dernière mise à jour :** 2 décembre 2025
