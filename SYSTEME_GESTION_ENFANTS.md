# 👨‍👩‍👧‍👦 SYSTÈME DE GESTION D'ENFANTS - PLAN COMPLET

**Date** : 1er décembre 2025
**Statut** : 📋 Planification

---

## 🎯 OBJECTIF

Permettre aux **parents** de :
1. **Créer des profils** pour leurs enfants dans leur compte
2. **Inscrire leurs enfants** à des événements et activités
3. **Voir toutes les inscriptions** de leurs enfants (tableau de bord)
4. **Désinscrire** leurs enfants facilement
5. **Gérer les informations** de leurs enfants (nom, âge, allergies, etc.)

---

## 📊 ARCHITECTURE DU SYSTÈME

### 1. Base de Données (Prisma)

#### Nouveau Modèle : `Child`

```prisma
model Child {
  id                String             @id @default(uuid()) @db.Uuid
  userId            String             @db.Uuid  // Parent (User)
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Informations de l'enfant
  firstName         String
  lastName          String
  birthDate         DateTime
  gender            ChildGender        // MALE, FEMALE

  // Informations médicales/spéciales
  allergies         String?            // Allergies alimentaires ou médicales
  medicalConditions String?            // Conditions médicales importantes
  notes             String?            // Notes additionnelles

  // Relations
  eventRegistrations EventRegistration[] @relation("ChildRegistrations")
  enrollments        Enrollment[]        @relation("ChildEnrollments")

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([userId])
}

enum ChildGender {
  MALE
  FEMALE
}
```

#### Modifications des Modèles Existants

**EventRegistration** :
```prisma
model EventRegistration {
  // ... champs existants ...

  // Nouveau : Si inscription pour un enfant
  childId           String?            @db.Uuid
  child             Child?             @relation("ChildRegistrations", fields: [childId], references: [id], onDelete: SetNull)

  @@index([childId])
}
```

**Enrollment** :
```prisma
model Enrollment {
  // ... champs existants ...

  // Nouveau : Si inscription pour un enfant
  childId           String?            @db.Uuid
  child             Child?             @relation("ChildEnrollments", fields: [childId], references: [id], onDelete: SetNull)

  @@index([childId])
}
```

**User** :
```prisma
model User {
  // ... champs existants ...

  // Nouveau : Relation avec les enfants
  children          Child[]
}
```

---

### 2. API Routes

#### Gestion des Enfants

**`/api/account/children` (GET, POST)**
- **GET** : Liste les enfants du parent connecté
- **POST** : Crée un nouvel enfant

**`/api/account/children/[id]` (GET, PATCH, DELETE)**
- **GET** : Détails d'un enfant
- **PATCH** : Modifie les informations d'un enfant
- **DELETE** : Supprime un enfant (si aucune inscription active)

#### Gestion des Inscriptions

**`/api/account/registrations` (GET)**
- **GET** : Liste toutes les inscriptions (événements + activités) du parent et de ses enfants
- **Query params** :
  - `?type=events` - Seulement les événements
  - `?type=activities` - Seulement les activités
  - `?childId=xxx` - Seulement pour un enfant spécifique

**`/api/account/registrations/[id]` (DELETE)**
- **DELETE** : Annule une inscription (événement ou activité)

#### Modifications des Routes Existantes

**`/api/events/[id]/register`** - Ajouter support `childId`
```json
{
  "childId": "uuid-de-l-enfant",  // Optionnel
  "participationType": "INDIVIDUAL",
  // ... autres champs
}
```

**`/api/enrollments`** - Ajouter support `childId`
```json
{
  "childId": "uuid-de-l-enfant",  // Optionnel
  // ... autres champs
}
```

---

### 3. Pages Frontend (Dashboard Membre)

#### Page : `/membre/dashboard/enfants`

**Fonctionnalités** :
- ✅ Liste des enfants du parent
- ✅ Bouton "Ajouter un enfant"
- ✅ Carte pour chaque enfant avec :
  - Photo (optionnel)
  - Nom complet
  - Âge (calculé depuis birthDate)
  - Genre
  - Allergies/conditions (si renseignées)
  - Nombre d'inscriptions actives
  - Boutons : "Modifier" | "Voir inscriptions" | "Supprimer"
- ✅ Modal "Ajouter/Modifier un enfant"
- ✅ Confirmation avant suppression

**Exemple de carte enfant** :
```
┌─────────────────────────────────────────────────┐
│ 👦 Ahmed Benali                          [···] │
│ ────────────────────────────────────────────── │
│ 🎂 9 ans (né le 15/03/2015)                    │
│ 📚 2 inscriptions actives                      │
│ ⚠️  Allergies: Arachides                        │
│ ────────────────────────────────────────────── │
│ [Modifier]  [Inscriptions]  [Supprimer]       │
└─────────────────────────────────────────────────┘
```

#### Page : `/membre/dashboard/inscriptions`

**Fonctionnalités** :
- ✅ Onglets :
  - "Toutes" | "Événements" | "Activités"
- ✅ Filtre par enfant (dropdown)
- ✅ Liste des inscriptions avec :
  - Type (Événement ou Activité)
  - Titre
  - Date
  - Pour qui (Moi ou Nom de l'enfant)
  - Statut (Confirmé, En attente, Annulé)
  - Bouton "Annuler l'inscription"
- ✅ Pagination
- ✅ Confirmation avant annulation

**Exemple de tableau** :
```
┌────────┬───────────────────────┬────────────┬───────────┬─────────────┬─────────┐
│ Type   │ Titre                 │ Date       │ Pour      │ Statut      │ Actions │
├────────┼───────────────────────┼────────────┼───────────┼─────────────┼─────────┤
│ 🎉     │ Camp d'Été 8-14 ans   │ 15/07/2025 │ Ahmed     │ ✅ Confirmé │ [Annuler]│
│ 📚     │ Cours d'Arabe         │ En cours   │ Ahmed     │ ✅ Actif    │ [Annuler]│
│ 🎉     │ Sortie Familiale      │ 22/06/2025 │ Moi + 3   │ ✅ Confirmé │ [Annuler]│
│ 📚     │ Cours de Coran        │ En cours   │ Fatima    │ ✅ Actif    │ [Annuler]│
└────────┴───────────────────────┴────────────┴───────────┴─────────────┴─────────┘
```

#### Modification : Page `/evenements`

Quand l'utilisateur est connecté et a des enfants :

```
┌─────────────────────────────────────────────────┐
│ Inscrire à : Camp d'Été Enfants 8-14 ans       │
├─────────────────────────────────────────────────┤
│ Pour qui souhaitez-vous vous inscrire ?        │
│ ○ Pour moi                                      │
│ ○ Pour un enfant ▼                              │
│   ┌────────────────────────────────────┐        │
│   │ Ahmed (9 ans)                      │        │
│   │ Fatima (12 ans)                    │        │
│   └────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

Si "Pour un enfant" sélectionné :
- ✅ Infos pré-remplies (nom, date de naissance)
- ✅ Infos parent pré-remplies (email, téléphone)
- ✅ Genre pré-rempli selon le profil enfant
- ✅ Validation âge automatique

#### Modification : Page `/activites`

Même logique que les événements.

---

### 4. Composants

#### `<ChildCard>`
Affiche une carte enfant avec ses informations.

#### `<AddEditChildModal>`
Modal pour ajouter/modifier un enfant.

#### `<RegistrationsList>`
Tableau des inscriptions avec filtres.

#### `<CancelRegistrationModal>`
Confirmation d'annulation d'inscription.

#### `<ChildSelectorRadio>`
Radio buttons pour choisir "Moi" ou "Enfant" dans les formulaires.

---

## 🔒 SÉCURITÉ

### Validations API

1. **Enfants** :
   - ✅ Un parent ne peut gérer QUE ses propres enfants
   - ✅ Vérification `userId === session.user.id`
   - ✅ Pas de suppression si inscriptions actives

2. **Inscriptions** :
   - ✅ Un parent ne peut annuler QUE les inscriptions de ses enfants ou les siennes
   - ✅ Vérification de la propriété avant annulation
   - ✅ Respect des délais d'annulation (si configurés)

3. **Authentification** :
   - ✅ Toutes les routes `/api/account/*` nécessitent une session valide
   - ✅ Middleware NextAuth

---

## 📋 FLUX UTILISATEUR

### Flux 1 : Ajouter un Enfant

1. Parent se connecte
2. Va sur `/membre/dashboard/enfants`
3. Clique "Ajouter un enfant"
4. Remplit le formulaire :
   - Prénom *
   - Nom *
   - Date de naissance *
   - Genre *
   - Allergies (optionnel)
   - Conditions médicales (optionnel)
   - Notes (optionnel)
5. Clique "Enregistrer"
6. ✅ Enfant créé et affiché dans la liste

### Flux 2 : Inscrire un Enfant à un Événement

1. Parent va sur `/evenements`
2. Clique "S'inscrire" sur "Camp d'Été 8-14 ans"
3. Sélectionne "Pour un enfant" → Choisit "Ahmed"
4. Le formulaire se pré-remplit :
   - Nom enfant : Ahmed Benali
   - Genre : Enfant (grisé)
   - Date de naissance : 2015-03-15 (grisée)
   - Email parent : ahmed.parent@email.com (grisé)
   - Téléphone parent : +41791234567 (grisé)
5. Ajoute des notes si besoin
6. Clique "Confirmer l'inscription"
7. ✅ Inscription créée et liée à l'enfant

### Flux 3 : Voir et Annuler une Inscription

1. Parent va sur `/membre/dashboard/inscriptions`
2. Voit toutes les inscriptions (siennes + enfants)
3. Filtre par enfant "Ahmed"
4. Voit "Camp d'Été 8-14 ans" - 15/07/2025
5. Clique "Annuler"
6. Confirme l'annulation
7. ✅ Statut passe à "CANCELLED"
8. Email de confirmation d'annulation envoyé

---

## 🗄️ MIGRATION DATABASE

### Étapes

1. **Créer le fichier de migration Prisma** :
```bash
npx prisma migrate dev --name add_children_system
```

2. **Générer le client Prisma** :
```bash
npx prisma generate
```

3. **Note** : Avec Prisma Accelerate, on ne peut pas faire `migrate deploy` directement.
   - Option 1 : Utiliser Prisma Studio pour vérifier
   - Option 2 : Demander à l'admin DB de faire l'ALTER TABLE manuellement

---

## 📁 STRUCTURE DES FICHIERS

```
prisma/
  schema.prisma (modifié)

app/
  api/
    account/
      children/
        route.ts          (GET, POST)
        [id]/
          route.ts        (GET, PATCH, DELETE)
      registrations/
        route.ts          (GET)
        [id]/
          route.ts        (DELETE)
    events/
      [id]/
        register/
          route.ts        (modifié - support childId)
    enrollments/
      route.ts            (modifié - support childId)

  membre/
    dashboard/
      enfants/
        page.tsx          (liste des enfants)
      inscriptions/
        page.tsx          (liste des inscriptions)

components/
  dashboard/
    ChildCard.tsx
    AddEditChildModal.tsx
    RegistrationsList.tsx
    CancelRegistrationModal.tsx
    ChildSelectorRadio.tsx

lib/
  children.ts             (fonctions utilitaires)
```

---

## 🎨 DESIGN UI

### Couleurs

- **Enfant** : Bleu ciel (#3B82F6)
- **Événement** : Vert (#10B981)
- **Activité** : Violet (#8B5CF6)
- **Annulé** : Rouge (#EF4444)
- **Confirmé** : Vert (#22C55E)

### Icônes

- 👦 / 👧 : Enfant (selon genre)
- 🎂 : Âge / Date de naissance
- ⚠️ : Allergies / Conditions
- 🎉 : Événement
- 📚 : Activité
- ✅ : Confirmé
- ⏳ : En attente
- ❌ : Annulé

---

## 📊 ÉTAPES D'IMPLÉMENTATION

### Phase 1 : Base de Données (1-2h)
1. ✅ Modifier `prisma/schema.prisma`
2. ✅ Créer la migration
3. ✅ Générer le client Prisma
4. ✅ Tester avec Prisma Studio

### Phase 2 : API Enfants (2-3h)
1. ✅ `/api/account/children` (CRUD)
2. ✅ Validation et sécurité
3. ✅ Tests avec Postman/curl

### Phase 3 : API Inscriptions (1-2h)
1. ✅ `/api/account/registrations` (GET, DELETE)
2. ✅ Modification routes événements/activités
3. ✅ Tests

### Phase 4 : Frontend - Gestion Enfants (3-4h)
1. ✅ Page `/membre/dashboard/enfants`
2. ✅ Composant `ChildCard`
3. ✅ Modal ajout/modification
4. ✅ Tests utilisateur

### Phase 5 : Frontend - Inscriptions (2-3h)
1. ✅ Page `/membre/dashboard/inscriptions`
2. ✅ Composant `RegistrationsList`
3. ✅ Filtres et pagination
4. ✅ Annulation inscriptions

### Phase 6 : Modification Formulaires (2-3h)
1. ✅ Ajouter sélecteur enfant dans `SmartEventRegistrationModal`
2. ✅ Ajouter sélecteur enfant dans `EnrollmentForm`
3. ✅ Pré-remplissage automatique
4. ✅ Tests complets

### Phase 7 : Documentation (1h)
1. ✅ Guide utilisateur
2. ✅ Guide développeur
3. ✅ Diagrammes

**TOTAL ESTIMÉ : 12-18 heures de développement**

---

## 🧪 TESTS À EFFECTUER

### Tests Fonctionnels

1. **Gestion enfants** :
   - [ ] Créer un enfant
   - [ ] Modifier un enfant
   - [ ] Supprimer un enfant (sans inscription)
   - [ ] Impossible de supprimer si inscriptions actives

2. **Inscriptions événements** :
   - [ ] Inscrire un enfant à un événement
   - [ ] Vérifier validation âge/genre
   - [ ] Annuler une inscription
   - [ ] Voir l'inscription dans le dashboard

3. **Inscriptions activités** :
   - [ ] Inscrire un enfant à une activité
   - [ ] Annuler une inscription
   - [ ] Voir toutes les inscriptions enfant

4. **Sécurité** :
   - [ ] Parent A ne peut pas voir les enfants du parent B
   - [ ] Parent A ne peut pas annuler inscription du parent B
   - [ ] Routes protégées nécessitent authentification

---

## 📚 DOCUMENTATION UTILISATEUR

### Pour les Parents

**Comment ajouter mon enfant ?**
1. Connectez-vous à votre compte
2. Allez dans "Mon Espace" → "Mes Enfants"
3. Cliquez sur "Ajouter un enfant"
4. Remplissez le formulaire
5. Cliquez "Enregistrer"

**Comment inscrire mon enfant à un événement ?**
1. Allez sur la page "Événements"
2. Cliquez "S'inscrire" sur l'événement souhaité
3. Sélectionnez "Pour un enfant"
4. Choisissez l'enfant dans la liste
5. Validez l'inscription

**Comment voir toutes les inscriptions de mes enfants ?**
1. Allez dans "Mon Espace" → "Inscriptions"
2. Utilisez le filtre pour voir par enfant

**Comment annuler une inscription ?**
1. Allez dans "Mon Espace" → "Inscriptions"
2. Trouvez l'inscription
3. Cliquez "Annuler"
4. Confirmez

---

## 🎯 BÉNÉFICES

### Pour les Parents
- ✅ Gestion centralisée de tous les enfants
- ✅ Vue d'ensemble des inscriptions
- ✅ Inscription rapide (infos pré-remplies)
- ✅ Annulation facile
- ✅ Historique des participations

### Pour la Mosquée
- ✅ Meilleure traçabilité
- ✅ Données structurées
- ✅ Contact parent toujours disponible
- ✅ Statistiques par enfant possibles
- ✅ Gestion des allergies/conditions médicales

---

**Date de création** : 1er décembre 2025
**Prêt pour implémentation** : OUI
**Complexité** : Moyenne-Élevée
**Impact** : Très élevé

🎉 **Ce système va révolutionner la gestion des inscriptions pour les familles !**
