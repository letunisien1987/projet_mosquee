# 🚀 Implémentation Restrictions - Suite

**Date**: 1er décembre 2025
**Statut**: En cours (50% complété)

---

## ✅ Déjà Fait

1. ✅ Guide Directus créé (`GUIDE_DIRECTUS_RESTRICTIONS.md`)
2. ✅ Schema Prisma modifié (EventRegistration avec nouveaux champs)
3. ✅ Script SQL de migration créé (`scripts/add-restrictions-columns.sql`)
4. ✅ Client Prisma généré

---

## 🔄 À Faire Maintenant

### Étape 1: Exécuter le Script SQL

Vous devez exécuter le script SQL pour ajouter les colonnes à la base de données:

```bash
# Option 1: Via psql (si vous avez accès)
psql "votre_connection_string" -f scripts/add-restrictions-columns.sql

# Option 2: Via Prisma Studio SQL Query
# Ouvrez Prisma Studio et exécutez le contenu du fichier scripts/add-restrictions-columns.sql
```

### Étape 2: Ajouter le Champ dans Directus

Suivez le guide `GUIDE_DIRECTUS_RESTRICTIONS.md` pour:
1. Ajouter le champ JSON `restrictions` à la collection `events`
2. Ajouter le même champ à la collection `activities`

### Étape 3: Code Restant à Implémenter

Je vais créer les fichiers suivants dès que vous me dites "continue":

#### 1. Types TypeScript (`types/restrictions.ts`)
```typescript
export interface EventRestrictions {
  enabled: boolean
  participation_type: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
  allowed_gender: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
  min_age: number | null
  max_age: number | null
}

export interface RegistrationParticipant {
  firstName: string
  lastName: string
  age?: number
}

export interface FamilyRegistration {
  adults: RegistrationParticipant[]
  children: RegistrationParticipant[]
}
```

#### 2. Composant Formulaire Intelligent (`components/SmartEventRegistrationForm.tsx`)
- Formulaire qui s'adapte selon les restrictions
- Validation côté client
- Calcul automatique de l'âge
- Champs dynamiques pour famille

#### 3. API Mise à Jour (`app/api/events/[id]/register/route.ts`)
- Lire les restrictions de l'événement depuis Directus
- Valider les données côté serveur
- Bloquer si les conditions ne sont pas remplies
- Enregistrer les participants dans le bon format

#### 4. Même Chose pour Activités
- API: `app/api/activities/[id]/enroll/route.ts`
- Formulaire adapté

---

## 📝 Exemple d'Utilisation

### Dans Directus

Créer un événement "Sortie Familiale" avec:

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

### Formulaire Affiché

Le formulaire s'adaptera automatiquement:
- Demande: Combien d'adultes? (1, 2, 3, 4, 5+)
- Demande: Combien d'enfants? (0, 1, 2, 3, 4, 5+)
- Affiche les champs pour chaque participant
- Contact principal pré-rempli si connecté

### Données Sauvegardées

```json
{
  "participationType": "FAMILY",
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

L'API validera:

1. **Genre**: Si restricted à FEMALE, bloque les hommes
2. **Âge**: Si min/max défini, calcule l'âge et vérifie
3. **Type**: Si FAMILY requis, vérifie que numberOfAdults > 1 ou numberOfChildren > 0

Exemple de réponse d'erreur:

```json
{
  "error": "Cet événement est réservé aux enfants de 6 à 12 ans",
  "code": "AGE_RESTRICTION"
}
```

---

## 📊 Progression

```
[████████████████░░░░] 50% Complété

✅ Structure base de données
✅ Guide utilisateur
⏳ Types TypeScript
⏳ Composant formulaire
⏳ API validation
⏳ Integration pages
⏳ Tests
```

---

## 🎯 Prochaine Étape

**Dites-moi "continue"** et je crée TOUS les fichiers restants en one-shot:

1. Types TypeScript
2. Composant formulaire intelligent
3. API avec validation
4. Intégration dans les pages
5. Documentation de test

**Temps estimé**: 30-40 minutes de développement

---

**Note**: Avant que je continue, assurez-vous d'avoir:
- [ ] Exécuté le script SQL (ou je peux vous aider)
- [ ] Ajouté le champ `restrictions` dans Directus (ou faites-le après)

**Prêt?** Dites "continue" ! 🚀
