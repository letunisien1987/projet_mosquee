# 👨‍👩‍👧 INFORMATIONS PARENT OBLIGATOIRES POUR LES ENFANTS

**Date** : 1er décembre 2025
**Statut** : ✅ TERMINÉ pour les Événements | 🔄 En cours pour les Activités

---

## 🎯 OBJECTIF

Pour toute inscription d'**enfant** (genre = CHILD), le système demande **obligatoirement** :
1. Les coordonnées du parent/tuteur légal
2. La relation avec l'enfant (Père, Mère, Tuteur légal, Autre)

Cela garantit que chaque enfant inscrit est lié à un adulte responsable.

---

## ✅ ÉVÉNEMENTS - IMPLÉMENTÉ

### 📋 Ce qui a été fait

1. **Formulaire Intelligent** (`components/SmartEventRegistrationModal.tsx`)
   - ✅ Titre change selon le contexte :
     - Si **CHILD** → "👨‍👩‍👧 Informations du parent/tuteur légal"
     - Si **FAMILY** → "👨‍👩‍👧‍👦 Informations du responsable du groupe"
     - Sinon → "Coordonnées du contact principal"

   - ✅ Message d'information pour les enfants :
     ```
     ℹ️ Pour les inscriptions d'enfants, les coordonnées d'un parent
        ou tuteur légal sont obligatoires.
     ```

   - ✅ Nouveau champ **"Relation avec l'enfant"** (obligatoire si CHILD) :
     - Père
     - Mère
     - Tuteur légal
     - Autre (oncle, tante, etc.)

2. **API de Validation** (`app/api/events/[id]/register/route.ts`)
   - ✅ Valide que `parentRelation` est présent si `participantGender === 'CHILD'`
   - ✅ Message d'erreur clair :
     ```
     "Pour les inscriptions d'enfants, la relation avec le parent/tuteur
      est obligatoire"
     ```
   - ✅ Stocke la relation parent dans le champ `notes` :
     ```
     [Relation parent: Père]
     Notes additionnelles de l'utilisateur...
     ```

### 🧪 Comment Tester (Événements)

#### Test 1 : Camp Enfants 8-14 ans

1. Allez sur **http://localhost:3000/evenements**
2. Cliquez sur **"🧒 DÉMO: Camp d'Été Enfants 8-14 ans"**
3. Cliquez sur **"S'inscrire"**

**Vous devriez voir** :
```
┌────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 Informations du parent/tuteur légal          │
├────────────────────────────────────────────────────────┤
│ ℹ️  Pour les inscriptions d'enfants, les coordonnées  │
│    d'un parent ou tuteur légal sont obligatoires.     │
├────────────────────────────────────────────────────────┤
│ Prénom *         │ Nom *                               │
│ [Ahmed        ]  │ [Benali                     ]       │
├──────────────────┼─────────────────────────────────────┤
│ Email *          │ Téléphone *                         │
│ [ahmed@mail.com] │ [+41 79 123 45 67        ]          │
├────────────────────────────────────────────────────────┤
│ Relation avec l'enfant *                               │
│ ┌──────────────────────────────────────────────┐       │
│ │ Sélectionnez                             ▼  │       │
│ │  - Père                                      │       │
│ │  - Mère                                      │       │
│ │  - Tuteur légal                              │       │
│ │  - Autre (oncle, tante, etc.)                │       │
│ └──────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Informations participant                               │
├────────────────────────────────────────────────────────┤
│ Genre *                 │ Date de naissance *          │
│ [Enfant] 🔒 GRISÉ       │ [2015-03-15          ]       │
│ ℹ️  Genre imposé        │ ℹ️  Âge requis: 8-14 ans     │
└────────────────────────────────────────────────────────┘
```

4. **Remplissez le formulaire** :
   - Prénom parent : Ahmed
   - Nom parent : Benali
   - Email : ahmed@example.com
   - Téléphone : +41 79 123 45 67
   - **Relation** : Père ← **OBLIGATOIRE**
   - Genre : Enfant (pré-rempli et grisé)
   - Date de naissance : 2015-03-15 (9 ans)

5. Cliquez **"Confirmer l'inscription"**
6. ✅ **Succès !** Inscription créée

#### Test 2 : Essayer d'inscrire sans relation parent

1. Même événement (Camp Enfants)
2. Remplissez TOUT **sauf** la relation avec l'enfant
3. Essayez de soumettre
4. ❌ **Erreur** : Le champ est requis (validation HTML5 du navigateur)

#### Test 3 : Vérifier dans la base de données

1. Ouvrez **Prisma Studio** : http://localhost:5556
2. Cliquez sur **EventRegistration**
3. Trouvez votre inscription
4. Regardez le champ **notes** :
   ```
   [Relation parent: Père]
   ```

---

## 🎨 INTERFACE VISUELLE

### Avant (Sans restriction enfant)
```
┌────────────────────────────────────────────────────────┐
│ Coordonnées du contact principal                       │
├────────────────────────────────────────────────────────┤
│ Prénom *         │ Nom *                               │
│ Email *          │ Téléphone *                         │
└────────────────────────────────────────────────────────┘
```

### Après (Avec restriction CHILD)
```
┌────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 Informations du parent/tuteur légal          │
├────────────────────────────────────────────────────────┤
│ ℹ️  Pour les inscriptions d'enfants, les coordonnées  │
│    d'un parent ou tuteur légal sont obligatoires.     │
├────────────────────────────────────────────────────────┤
│ Prénom *         │ Nom *                               │
│ Email *          │ Téléphone *                         │
├────────────────────────────────────────────────────────┤
│ Relation avec l'enfant *                               │
│ [Père ▼]  <- NOUVEAU CHAMP OBLIGATOIRE                │
└────────────────────────────────────────────────────────┘
```

---

## 📊 VALIDATION API

### Flux de Validation

1. **Client soumet** le formulaire avec :
   ```json
   {
     "participationType": "INDIVIDUAL",
     "participantGender": "CHILD",
     "participantBirthDate": "2015-03-15",
     "parentRelation": "PERE",
     "contactFirstName": "Ahmed",
     "contactLastName": "Benali",
     "contactEmail": "ahmed@example.com",
     "contactPhone": "+41791234567"
   }
   ```

2. **API valide** :
   ```typescript
   if (participantGender === 'CHILD' && !parentRelation) {
     return { error: 'La relation parent est obligatoire' }
   }
   ```

3. **Si valide**, stocke :
   ```
   EventRegistration {
     firstName: "Ahmed"  // Parent
     lastName: "Benali"  // Parent
     email: "ahmed@example.com"  // Parent
     phone: "+41791234567"  // Parent
     notes: "[Relation parent: Père]"  // Relation stockée ici
   }
   ```

### Codes d'Erreur

| Erreur | Message | Code HTTP |
|--------|---------|-----------|
| Relation manquante | "Pour les inscriptions d'enfants, la relation avec le parent/tuteur est obligatoire" | 400 |
| Âge invalide | "Vous devez avoir au moins 8 ans (vous avez 5 ans)" | 400 |
| Genre invalide | "Cet événement est réservé aux enfants" | 400 |

---

## 🔄 ACTIVITÉS - À IMPLÉMENTER

### Fichier à modifier

- `components/EnrollmentForm.tsx` (formulaire d'inscription aux activités)
- `app/api/enrollments/route.ts` (ou similaire - à vérifier)

### Modifications nécessaires

1. Ajouter le champ `parentRelation` au formulaire
2. Changer les labels si inscription enfant
3. Ajouter la validation API
4. Stocker la relation dans les notes

**La même logique que les événements s'appliquera.**

---

## 📂 FICHIERS MODIFIÉS

### Événements ✅
- ✅ `components/SmartEventRegistrationModal.tsx` (lignes 47-62, 315-422, 153-167)
- ✅ `app/api/events/[id]/register/route.ts` (lignes 8-31, 56-64, 163-174)

### Activités 🔄
- 🔄 `components/EnrollmentForm.tsx` (à modifier)
- 🔄 `app/api/enrollments/route.ts` (à vérifier et modifier)

---

## 🎯 AVANTAGES

### Pour l'Administration
1. **Traçabilité** : Chaque enfant est lié à un adulte responsable
2. **Contact d'urgence** : Coordonnées du parent toujours disponibles
3. **Conformité RGPD** : Consentement parental pour les mineurs
4. **Sécurité** : Aucun enfant ne peut s'inscrire seul

### Pour les Utilisateurs
1. **Clarté** : Le formulaire indique clairement qu'il faut les infos du parent
2. **Guidage** : Le titre change automatiquement ("Informations du parent")
3. **Validation** : Impossible de soumettre sans les informations requises
4. **Transparence** : Message explicite sur l'obligation

---

## 📝 EXEMPLES DE DONNÉES

### Inscription Enfant (Camp 8-14 ans)
```json
{
  "eventTitle": "Camp d'Été Enfants 8-14 ans",
  "participationType": "INDIVIDUAL",
  "participantGender": "CHILD",
  "participantBirthDate": "2015-03-15",
  "firstName": "Ahmed",      // Parent
  "lastName": "Benali",      // Parent
  "email": "ahmed@example.com",   // Parent
  "phone": "+41791234567",   // Parent
  "notes": "[Relation parent: Père]\nAllergies: arachides",
  "status": "CONFIRMED"
}
```

### Inscription Famille (Sortie Familiale)
```json
{
  "eventTitle": "Sortie Familiale au Parc",
  "participationType": "FAMILY",
  "numberOfAdults": 2,
  "numberOfChildren": 3,
  "firstName": "Ahmed",      // Responsable du groupe
  "lastName": "Benali",      // Responsable du groupe
  "email": "ahmed@example.com",
  "phone": "+41791234567",
  "notes": "3 enfants (7, 10, 12 ans)",
  "status": "CONFIRMED"
}
```

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ **Événements** : Terminé et testé
2. 🔄 **Activités** : Appliquer la même logique
3. 📊 **Admin** : Afficher la relation parent dans l'interface admin
4. 📧 **Emails** : Inclure les infos parent dans les emails de confirmation
5. 📄 **Export** : Ajouter la relation parent aux exports CSV/Excel

---

## 🧪 CHECKLIST DE TEST

### Événements
- [x] Formulaire enfant affiche "Informations du parent/tuteur légal"
- [x] Champ "Relation avec l'enfant" apparaît si CHILD
- [x] Champ "Relation" est obligatoire
- [x] Genre est pré-rempli et grisé
- [x] Validation d'âge fonctionne (8-14 ans)
- [x] API bloque si relation manquante
- [x] Relation est stockée dans les notes
- [x] Message d'info s'affiche pour les enfants

### Activités
- [ ] Formulaire enfant affiche "Informations du parent/tuteur légal"
- [ ] Champ "Relation avec l'enfant" apparaît
- [ ] Validation API fonctionne
- [ ] Relation est stockée dans les notes

---

**Créé par** : Claude Code
**Date** : 1er décembre 2025

🎊 **Les inscriptions d'enfants sont maintenant sécurisées avec les informations parentales !**
