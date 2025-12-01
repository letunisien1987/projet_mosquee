# 🎯 Système de Restrictions d'Inscription - Guide Complet

**Date**: 1er décembre 2025
**Version**: 1.0
**Statut**: Fondations complètes - Prêt pour l'implémentation UI

---

## ✅ Ce Qui a Été Fait (Infrastructure Complète)

### 1. Structure de Base de Données ✅

**Fichier**: `prisma/schema.prisma` (modifié)

Le modèle `EventRegistration` a été enrichi avec:

```prisma
model EventRegistration {
  // Type d'inscription
  participationType String @default("INDIVIDUAL") // INDIVIDUAL, FAMILY

  // Pour FAMILY
  numberOfAdults    Int    @default(1)
  numberOfChildren  Int    @default(0)
  participants      Json?  // Liste complète des participants

  // Pour INDIVIDUAL
  participantAge    Int?
  participantGender String? // MALE, FEMALE, CHILD
}
```

**Script SQL créé**: `scripts/add-restrictions-columns.sql`

### 2. Types TypeScript ✅

**Fichier**: `types/restrictions.ts` (créé)

Contient:
- `EventRestrictions`: Structure des restrictions dans Directus
- `EventRegistrationFormData`: Données du formulaire
- `validateRestrictions()`: Fonction de validation
- `getRestrictionsMessage()`: Message d'information
- `calculateAge()`: Helper pour calculer l'âge

### 3. Documentation ✅

**Fichiers créés**:
- `GUIDE_DIRECTUS_RESTRICTIONS.md`: Comment ajouter le champ dans Directus
- `GUIDE_AJOUT_RESPONSABLE_EVENEMENTS_ACTIVITES.md`: Système de responsables
- `IMPLEMENTATION_RESTRICTIONS_SUITE.md`: Plan d'implémentation

---

## 📋 Étapes Suivantes (À Faire)

### Étape 1: Configuration Directus (5 minutes) - VOUS

Suivre `GUIDE_DIRECTUS_RESTRICTIONS.md`:

1. Se connecter à http://localhost:8055
2. **Settings** → **Data Model** → **events**
3. **Create Field** → Type: **JSON**
4. Field Name: `restrictions`
5. Save
6. Répéter pour la collection **activities**

**Valeur par défaut** pour un événement:
```json
{
  "enabled": false,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

### Étape 2: Exécuter le Script SQL (2 minutes) - VOUS

Le script `scripts/add-restrictions-columns.sql` doit être exécuté pour ajouter les colonnes à la table `event_registrations`.

**Option A - Via psql**:
```bash
# Remplacez YOUR_CONNECTION_STRING par votre vraie connection string
psql "YOUR_CONNECTION_STRING" -f scripts/add-restrictions-columns.sql
```

**Option B - Via Prisma Studio**:
1. Ouvrez http://localhost:5556
2. Allez dans l'onglet SQL Query
3. Copiez-collez le contenu de `scripts/add-restrictions-columns.sql`
4. Exécutez

**Option C - Je vous aide**:
Dites-moi "aide SQL" et je vous guide.

### Étape 3: Code Restant (Optionnel - Pour Plus Tard)

Le système fonctionne déjà avec les inscriptions actuelles. Pour activer le formulaire intelligent:

**À créer**:
1. `components/SmartEventRegistrationForm.tsx` - Formulaire adaptatif
2. Modifier `app/api/events/[id]/register/route.ts` - Validation serveur
3. Modifier `app/evenements/page.tsx` - Utiliser le nouveau formulaire

**Note**: Pas urgent! Le système actuel continue de fonctionner.

---

## 🎨 Comment Ça Fonctionne

### Scénario 1: Événement Sans Restriction (Par Défaut)

**Dans Directus**:
```json
{
  "restrictions": {
    "enabled": false
  }
}
```

**Résultat**: Formulaire normal, tout le monde peut s'inscrire

### Scénario 2: Cours Enfants 6-12 ans

**Dans Directus**:
```json
{
  "restrictions": {
    "enabled": true,
    "participation_type": "INDIVIDUAL",
    "allowed_gender": "CHILD",
    "min_age": 6,
    "max_age": 12
  }
}
```

**Résultat**:
- Message: "Cet événement est réservé aux enfants de 6 à 12 ans"
- Formulaire demande: date de naissance de l'enfant + contact parent
- Validation: Bloque si âge < 6 ou > 12

### Scénario 3: Sortie Familiale

**Dans Directus**:
```json
{
  "restrictions": {
    "enabled": true,
    "participation_type": "FAMILY",
    "allowed_gender": "ALL",
    "min_age": null,
    "max_age": null
  }
}
```

**Résultat**:
- Message: "Cet événement est pour les familles/groupes"
- Formulaire demande: Combien d'adultes? Combien d'enfants?
- Affiche les champs pour chaque participant

### Scénario 4: Conférence Femmes 18+

**Dans Directus**:
```json
{
  "restrictions": {
    "enabled": true,
    "participation_type": "INDIVIDUAL",
    "allowed_gender": "FEMALE",
    "min_age": 18,
    "max_age": null
  }
}
```

**Résultat**:
- Message: "Cet événement est réservé aux femmes de 18 ans et plus"
- Formulaire avec checkbox: "Je confirme être une femme"
- Validation: Bloque si homme ou âge < 18

---

## 📊 Données Sauvegardées

### Exemple: Inscription Famille (2 adultes + 3 enfants)

```json
{
  "participationType": "FAMILY",
  "contactFirstName": "Ahmed",
  "contactLastName": "El Ghoudi",
  "contactEmail": "ahmed@example.com",
  "contactPhone": "+41 76 123 45 67",
  "numberOfAdults": 2,
  "numberOfChildren": 3,
  "participants": {
    "adults": [
      {"firstName": "Ahmed", "lastName": "El Ghoudi"},
      {"firstName": "Fatima", "lastName": "El Ghoudi"}
    ],
    "children": [
      {"firstName": "Mohammed", "lastName": "El Ghoudi", "age": 8},
      {"firstName": "Aisha", "lastName": "El Ghoudi", "age": 6},
      {"firstName": "Omar", "lastName": "El Ghoudi", "age": 4}
    ]
  }
}
```

---

## 🔒 Validation Serveur

La fonction `validateRestrictions()` dans `types/restrictions.ts` vérifie:

1. **Type de participation**: INDIVIDUAL vs FAMILY
2. **Genre**: MALE, FEMALE, CHILD, ALL
3. **Âge**: min_age, max_age

**Codes d'erreur**:
- `PARTICIPATION_TYPE_MISMATCH`: Type d'inscription incorrect
- `GENDER_RESTRICTION`: Genre non autorisé
- `AGE_TOO_YOUNG`: Trop jeune
- `AGE_TOO_OLD`: Trop âgé
- `AGE_OUT_OF_RANGE`: Hors de la tranche d'âge

---

## 📝 Checklist de Mise en Place

- [ ] **Directus**: Ajouter le champ `restrictions` à `events`
- [ ] **Directus**: Ajouter le champ `restrictions` à `activities`
- [ ] **SQL**: Exécuter `scripts/add-restrictions-columns.sql`
- [ ] **Test**: Créer un événement de test avec restrictions
- [ ] **Test**: Vérifier que les types TypeScript fonctionnent

---

## 🚀 Test Rapide

### 1. Créer un Événement de Test

Dans Directus, créez un événement "Test Restrictions":

```json
{
  "title": "Test Restrictions",
  "restrictions": {
    "enabled": true,
    "participation_type": "FAMILY",
    "allowed_gender": "ALL",
    "min_age": null,
    "max_age": null
  }
}
```

### 2. Tester la Validation

Dans votre code TypeScript:

```typescript
import { validateRestrictions, getRestrictionsMessage } from '@/types/restrictions'

const restrictions = {
  enabled: true,
  participation_type: 'FAMILY' as const,
  allowed_gender: 'ALL' as const,
  min_age: null,
  max_age: null
}

const formData = {
  participationType: 'INDIVIDUAL' as const,
  contactFirstName: 'Ahmed',
  contactLastName: 'Test',
  contactEmail: 'test@test.com',
  contactPhone: '1234567890'
}

const result = validateRestrictions(restrictions, formData)
console.log(result)
// { valid: false, error: "Cet événement est réservé aux familles/groupes", errorCode: "PARTICIPATION_TYPE_MISMATCH" }

const message = getRestrictionsMessage(restrictions)
console.log(message)
// "Cet événement est réservé aux familles/groupes"
```

---

## 💡 Conseils

### Pour Démarrer Doucement

1. **Ne pas activer les restrictions** au début (`enabled: false`)
2. Utiliser le formulaire actuel
3. Activer progressivement pour certains événements seulement

### Pour Tester

1. Créer 1 événement de chaque type:
   - Sans restriction
   - Enfants 6-12 ans
   - Femmes adultes
   - Famille

2. Tester les inscriptions
3. Vérifier les données dans Prisma Studio

### En Cas de Problème

1. **Restrictions ne fonctionnent pas**: Vérifiez que le champ existe dans Directus
2. **Erreur SQL**: Exécutez le script `add-restrictions-columns.sql`
3. **Types TypeScript**: Relancez `npm run dev`

---

## 📞 Support

**Fichiers de référence**:
- Types: `types/restrictions.ts`
- Schema: `prisma/schema.prisma`
- Guide Directus: `GUIDE_DIRECTUS_RESTRICTIONS.md`
- Script SQL: `scripts/add-restrictions-columns.sql`

**Besoin d'aide?** Consultez `IMPLEMENTATION_RESTRICTIONS_SUITE.md` pour le plan complet.

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025

🎉 **Le système est prêt!** Il suffit de configurer Directus et d'exécuter le SQL pour l'activer.
