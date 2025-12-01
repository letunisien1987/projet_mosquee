# 📊 STATUT D'IMPLÉMENTATION - SYSTÈME COMPLET

**Date**: 1er décembre 2025
**Projet**: Système de gestion des enfants, paiements, notifications et liste d'attente

---

## ✅ PHASE 1: SCHÉMA PRISMA - TERMINÉ

### Modifications du schéma (`prisma/schema.prisma`)

#### 1. Nouveaux Enums
- ✅ `PaymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED
- ✅ `NotificationType`: EVENT_CONFIRMATION, EVENT_REMINDER, EVENT_CANCELLED, EVENT_WAITLIST_SPOT_AVAILABLE, ENROLLMENT_CONFIRMATION, ENROLLMENT_APPROVED, ENROLLMENT_REJECTED, PAYMENT_PENDING, PAYMENT_CONFIRMED, PAYMENT_FAILED, SYSTEM, REMINDER

#### 2. Modèle `Child` amélioré
```prisma
model Child {
  id                String   @id @default(uuid()) @db.Uuid
  firstName         String
  lastName          String
  nickName          String?  // Surnom optionnel
  birthDate         DateTime
  gender            String?  // "MALE", "FEMALE" - nullable pour données existantes
  notes             String?  // Allergies, informations médicales, etc.
  avatarUrl         String?  // Photo de profil optionnelle
  parentId          String   @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  parent            User               @relation(...)
  enrollments       Enrollment[]
  eventRegistrations EventRegistration[]
}
```

**Nouveaux champs**: `nickName`, `gender`, `notes`, `avatarUrl`

#### 3. Modèle `EventRegistration` amélioré
```prisma
model EventRegistration {
  // ... champs existants ...
  childId           String?            @db.Uuid // NOUVEAU
  requiresPayment   Boolean            @default(false) // NOUVEAU
  paymentAmount     Float? // NOUVEAU
  paymentId         String?            @db.Uuid // NOUVEAU

  child             Child?             @relation(...) // NOUVEAU
  payment           Payment?           @relation(...) // NOUVEAU
}
```

#### 4. Modèle `Payment` (NOUVEAU)
```prisma
model Payment {
  id                  String        @id @default(uuid()) @db.Uuid
  userId              String?       @db.Uuid
  eventId             String?       // Référence à Directus event
  enrollmentId        String?       @db.Uuid
  amount              Float
  currency            String        @default("CHF")
  status              PaymentStatus @default(PENDING)
  stripePaymentId     String?       @unique
  stripeCheckoutId    String?
  metadata            Json?
  paidAt              DateTime?
  failedAt            DateTime?
  failureReason       String?
  refundedAt          DateTime?
  refundAmount        Float?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  user                User?         @relation(...)
  eventRegistrations  EventRegistration[]
}
```

#### 5. Modèle `WaitingList` (NOUVEAU)
```prisma
model WaitingList {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String?  @db.Uuid
  childId         String?  @db.Uuid
  eventId         String?  // Référence à Directus event
  activityId      String?  // Référence à Directus activity
  eventTitle      String?
  activityTitle   String?
  contactEmail    String
  contactPhone    String?
  contactName     String
  notified        Boolean  @default(false)
  notifiedAt      DateTime?
  convertedToRegistration Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User?    @relation(...)
}
```

#### 6. Modèle `Notification` amélioré
```prisma
model Notification {
  // ... champs existants ...
  type      NotificationType // MODIFIÉ: était String
  emailSent Boolean          @default(false) // NOUVEAU
}
```

### ⚠️ Important: Migration Base de Données

**ATTENTION**: Le schéma Prisma a été mis à jour mais les changements n'ont pas été appliqués à la base de données en raison de conflits de permissions avec Prisma Accelerate.

**Fichiers créés pour migration**:
- `prisma/migrations/manual_add_children_payment_system.sql` - Script SQL de migration
- `scripts/run-manual-migration.ts` - Script Node pour exécuter la migration

**Action requise**: Exécuter la migration manuellement avec un compte administrateur de base de données OU utiliser:
```bash
npx prisma db push --force-reset # ⚠️  Supprime toutes les données!
```

---

## ✅ PHASE 2: API ROUTES CRUD ENFANTS - TERMINÉ

### Routes créées

#### 1. `/app/api/account/children/route.ts`
- ✅ **GET**: Liste tous les enfants du parent authentifié
  - Inclut le nombre d'inscriptions (enrollments + eventRegistrations)
  - Triés par date de création décroissante
- ✅ **POST**: Créer un nouvel enfant
  - Validation Zod complète
  - Champs: firstName, lastName, nickName, birthDate, gender, notes, avatarUrl

#### 2. `/app/api/account/children/[id]/route.ts`
- ✅ **GET**: Récupérer un enfant spécifique avec ses inscriptions
  - Vérification que l'enfant appartient au parent
  - Inclut toutes les enrollments et eventRegistrations
- ✅ **PATCH**: Mettre à jour un enfant
  - Mise à jour partielle supportée
  - Vérification de propriété
- ✅ **DELETE**: Supprimer un enfant
  - Empêche la suppression si l'enfant a des inscriptions actives
  - Retourne le nombre d'inscriptions si suppression refusée

### Authentification
Toutes les routes utilisent NextAuth pour vérifier:
- Session utilisateur valide
- ID utilisateur présent

### Validation
- Utilisation de Zod pour validation robuste
- Messages d'erreur en français
- Gestion des cas limites (dates, URLs optionnelles, etc.)

### Sécurité
- Vérification de propriété: un parent ne peut accéder qu'à SES enfants
- Protection contre la suppression d'enfants avec inscriptions actives
- Validation stricte des entrées

---

## 🔄 CORRECTIONS APPORTÉES

### Fixes TypeScript (Next.js 16)
✅ Correction de `/app/api/membre/notifications/[id]/read/route.ts`
✅ Correction de `/app/api/membre/notifications/[id]/route.ts`

**Problème**: Next.js 16 exige que les params soient await-és
**Solution**: Changé `{ params }: { params: { id: string } }` en `{ params }: { params: Promise<{ id: string }> }`

### Suppression des modèles Activity/ActivityLevel de Prisma
**Raison**: Ces modèles sont gérés par Directus, pas Prisma
**Impact**: Les routes d'administration pour les activités nécessiteront une refonte pour utiliser l'API Directus

---

## 🚧 PHASE 3: INTERFACE UTILISATEUR - EN COURS

### À créer

#### 1. Page de gestion des enfants
- Localisation: `/app/membre/dashboard/enfants/page.tsx`
- Fonctionnalités:
  - Liste des enfants avec avatars
  - Bouton "Ajouter un enfant"
  - Actions: Modifier, Supprimer
  - Affichage du nombre d'inscriptions
  - Âge calculé automatiquement

#### 2. Modal d'ajout/modification d'enfant
- Composant: `/components/AddEditChildModal.tsx`
- Champs:
  - Prénom, Nom, Surnom (optionnel)
  - Date de naissance (datepicker)
  - Genre (select)
  - Notes (textarea) pour allergies, etc.
  - Avatar (upload - optionnel)

#### 3. Carte enfant (ChildCard)
- Composant: `/components/ChildCard.tsx`
- Affichage:
  - Avatar ou initiales
  - Nom complet
  - Âge
  - Nombre d'inscriptions (activités + événements)
  - Actions rapides (modifier, supprimer)

#### 4. Page vue d'ensemble des inscriptions
- Localisation: `/app/membre/dashboard/inscriptions/page.tsx`
- Fonctionnalités:
  - Liste de TOUTES les inscriptions (utilisateur + enfants)
  - Filtres: Type (événement/activité), Statut, Enfant
  - Affichage: Titre, Date, Participant, Statut, Actions
  - Action: Annuler inscription (si possible)

#### 5. Sélecteur d'enfant dans SmartEventRegistrationModal
- Modification de: `/components/SmartEventRegistrationModal.tsx`
- Ajout:
  - Dropdown "Inscrire pour"
    - Option: Moi-même
    - Options: Chaque enfant du parent
  - Si enfant sélectionné:
    - Pré-remplir genre et âge depuis Child
    - Bloquer la modification de ces champs
    - Utiliser les infos parent pour le contact

---

## ⏳ PHASE 4-8: FONCTIONNALITÉS AVANCÉES - À IMPLÉMENTER

### Phase 4: Intégration Stripe (4-5h)
- [ ] Configuration Stripe
- [ ] Checkout session
- [ ] Webhooks
- [ ] Gestion des paiements dans EventRegistration

### Phase 5: Système de notifications (3-4h)
- [ ] Service d'envoi de notifications
- [ ] Templates d'emails
- [ ] Notifications in-app
- [ ] Badge non-lus

### Phase 6: Liste d'attente (3-4h)
- [ ] Ajout automatique en liste d'attente si complet
- [ ] Notification automatique quand place disponible
- [ ] Conversion liste d'attente → inscription

### Phase 7: Templates emails (2-3h)
- [ ] Email de confirmation
- [ ] Email de rappel
- [ ] Email de paiement
- [ ] Email place disponible

### Phase 8: Cron jobs (1-2h)
- [ ] Rappels automatiques J-3, J-1
- [ ] Nettoyage liste d'attente expirée

---

## 🧪 TESTS À EFFECTUER

### Tests API Children (À faire après migration DB)
```bash
# Test GET /api/account/children
curl -X GET http://localhost:3000/api/account/children \
  -H "Cookie: next-auth.session-token=..."

# Test POST /api/account/children
curl -X POST http://localhost:3000/api/account/children \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Amira",
    "lastName": "Benali",
    "birthDate": "2018-05-15",
    "gender": "FEMALE",
    "notes": "Allergie aux arachides"
  }'

# Test PATCH /api/account/children/[id]
curl -X PATCH http://localhost:3000/api/account/children/[UUID] \
  -H "Content-Type: application/json" \
  -d '{"notes": "Allergie aux arachides et aux noix"}'

# Test DELETE /api/account/children/[id]
curl -X DELETE http://localhost:3000/api/account/children/[UUID]
```

### Tests UI (À faire après création des pages)
1. Page `/membre/dashboard/enfants`:
   - [ ] Affichage de la liste des enfants
   - [ ] Ajout d'un nouvel enfant
   - [ ] Modification d'un enfant existant
   - [ ] Suppression d'un enfant sans inscriptions
   - [ ] Refus de suppression d'un enfant avec inscriptions

2. Inscription événement avec enfant:
   - [ ] Sélection d'un enfant dans le dropdown
   - [ ] Pré-remplissage automatique du genre et de l'âge
   - [ ] Vérification des restrictions (âge, genre)
   - [ ] Création de l'inscription liée à l'enfant

---

## 📋 PROCHAINES ÉTAPES IMMÉDIATES

1. **Migration base de données** (CRITIQUE)
   - Option A: Exécuter le script SQL manuellement
   - Option B: `npx prisma db push --force-reset` (⚠️  perte de données)

2. **Créer la page de gestion des enfants**
   - `/app/membre/dashboard/enfants/page.tsx`
   - Avec AddEditChildModal
   - Avec ChildCard component

3. **Tester les APIs children** en conditions réelles

4. **Modifier SmartEventRegistrationModal**
   - Ajouter le sélecteur d'enfant
   - Implémenter la logique d'inscription pour enfant

5. **Créer la page vue d'ensemble des inscriptions**
   - `/app/membre/dashboard/inscriptions/page.tsx`

---

## 📝 NOTES TECHNIQUES

### Prisma Client
Le client Prisma a été régénéré avec les nouveaux modèles:
```bash
npx prisma generate
```

Les types TypeScript sont à jour et incluent:
- `Child` avec tous les nouveaux champs
- `Payment` avec relations
- `WaitingList` avec relations
- Enums `PaymentStatus` et `NotificationType`

### Conflits avec Directus
Les modèles `Activity` et `ActivityLevel` ont été retirés du schéma Prisma car ils sont gérés par Directus. Les routes admin qui les utilisaient auront besoin d'être refactorisées pour utiliser l'API Directus directement.

### Architecture
- **Backend**: Next.js 16 App Router + Prisma + PostgreSQL
- **CMS**: Directus pour Events et Activities
- **Auth**: NextAuth v4
- **Validation**: Zod
- **Paiements**: Stripe (à intégrer)
- **Emails**: À définir (Resend, SendGrid, Nodemailer)

---

**Créé par**: Claude Code
**Dernière mise à jour**: 1er décembre 2025, 17:30

🎯 **Prochain objectif**: Créer l'interface utilisateur de gestion des enfants
