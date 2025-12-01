# ✅ Système de Restrictions - PRÊT À TESTER!

**Date**: 1er décembre 2025
**Statut**: Implémentation terminée

---

## 🎉 Ce Qui a Été Fait

### 1. Infrastructure Complète ✅

**Fichiers créés/modifiés**:
- ✅ `types/restrictions.ts` - Types TypeScript + fonctions de validation
- ✅ `lib/directus.ts` - Interfaces DirectusEvent et DirectusActivity avec `restrictions`
- ✅ `prisma/schema.prisma` - EventRegistration avec nouveaux champs
- ✅ `scripts/run-restrictions-migration.ts` - Script de migration (optionnel)

### 2. Formulaire Intelligent ✅

**Créé**:
- ✅ `components/SmartEventRegistrationModal.tsx` - Formulaire adaptatif

**Fonctionnalités**:
- S'adapte automatiquement selon le type de participation (INDIVIDUAL/FAMILY/MIXED)
- Affiche/cache les champs selon les restrictions
- Montre un message d'information sur les restrictions
- Validation côté client

### 3. API avec Validation ✅

**Modifié**:
- ✅ `app/api/events/[id]/register/route.ts` - Validation serveur complète

**Fonctionnalités**:
- Valide les restrictions côté serveur
- Retourne des messages d'erreur clairs
- Compatible avec l'ancienne API (rétrocompatibilité)
- Bloque les inscriptions non conformes

### 4. Intégration Pages ✅

**Modifié**:
- ✅ `app/evenements/page.tsx` - Utilise SmartEventRegistrationModal

### 5. Documentation Complète ✅

**Guides créés**:
- ✅ `GUIDE_COMPLET_DEMARRAGE_RESTRICTIONS.md` - Guide de démarrage
- ✅ `EXEMPLES_RESTRICTIONS_COMPLETS.md` - Tous les scénarios
- ✅ `SYSTEME_RESTRICTIONS_COMPLET.md` - Vue d'ensemble technique
- ✅ `scripts/add-demo-restrictions.ts` - Script pour créer données de démo

---

## 🧪 Comment Tester MAINTENANT

### Option 1: Test Rapide (Sans Directus)

Le système fonctionne déjà! Les événements sans restrictions fonctionnent normalement.

1. Allez sur http://localhost:3000/evenements
2. Cliquez sur "S'inscrire" pour un événement
3. Le nouveau formulaire intelligent s'affiche
4. Remplissez et testez

### Option 2: Test Complet (Avec Restrictions)

Pour tester toutes les fonctionnalités de restrictions:

#### Étape 1: Ajouter le Champ dans Directus (5 min)

1. Allez sur http://localhost:8055
2. Connectez-vous:
   - Email: `admin@mosquee.ch`
   - Mot de passe: `mosquee2024!`

3. **Settings** → **Data Model** → **events**
4. **Create Field** → Type: **JSON**
5. Field Name: `restrictions`
6. Cochez **Nullable**
7. Save

#### Étape 2: Créer un Événement de Test (3 min)

1. Dans Directus: **Content** → **events** → **Create New**
2. Remplissez:
   - Title: "Test - Sortie Familiale"
   - Slug: "test-sortie-familiale"
   - Description: "Test du système de restrictions"
   - Category: "communaute"
   - Date: (une date future)
   - Start time: "10:00"
   - End time: "16:00"
   - Registration required: ✅
   - Published: ✅

3. Dans le champ **restrictions**, copiez-collez:
```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

4. Save

#### Étape 3: Tester le Formulaire (2 min)

1. Allez sur http://localhost:3000/evenements
2. Trouvez "Test - Sortie Familiale"
3. Cliquez sur "S'inscrire"
4. **Vous devriez voir**:
   - Message bleu: "Cet événement est réservé aux familles/groupes"
   - Le formulaire demande: Nombre d'adultes, Nombre d'enfants
   - PAS de choix "Individuel" (car FAMILY seulement)

5. Testez l'inscription avec:
   - 2 adultes
   - 3 enfants
   - Vos coordonnées

6. L'inscription devrait fonctionner!

---

## 🎨 Scénarios à Tester

### Scénario 1: Événement Famille

**Dans Directus** (`restrictions`):
```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

**Attendu**:
- Message: "Cet événement est réservé aux familles/groupes"
- Champs: Nombre d'adultes, Nombre d'enfants
- Pas de choix individuel

### Scénario 2: Conférence Femmes 18+

**Dans Directus** (`restrictions`):
```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "FEMALE",
  "min_age": 18,
  "max_age": null
}
```

**Attendu**:
- Message: "Cet événement est réservé aux femmes de 18 ans et plus"
- Champs: Genre (dropdown), Date de naissance
- Si homme ou < 18 ans: ❌ Bloqué par l'API

### Scénario 3: Camp Enfants 8-14 ans

**Dans Directus** (`restrictions`):
```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "CHILD",
  "min_age": 8,
  "max_age": 14
}
```

**Attendu**:
- Message: "Cet événement est réservé aux enfants de 8 à 14 ans"
- Champs: Genre (CHILD), Date de naissance
- Info: "Âge requis: 8-14 ans"
- Si < 8 ou > 14 ans: ❌ Bloqué par l'API

### Scénario 4: Événement MIXED

**Dans Directus** (`restrictions`):
```json
{
  "enabled": true,
  "participation_type": "MIXED",
  "allowed_gender": "ALL",
  "min_age": 18,
  "max_age": null
}
```

**Attendu**:
- Choix radio: "Individuel" ou "Famille/Groupe"
- Si Individuel: Demande date de naissance
- Si Famille: Demande nombre adultes/enfants
- Tous doivent avoir 18+ ans

### Scénario 5: Sans Restriction

**Dans Directus** (`restrictions`):
```json
{
  "enabled": false
}
```

**Attendu**:
- Pas de message bleu
- Formulaire normal
- Tout le monde peut s'inscrire

---

## 🔍 Vérification de l'Inscription

### Dans Prisma Studio

1. Ouvrez http://localhost:5556
2. Cliquez sur **EventRegistration**
3. Vérifiez la dernière inscription
4. Vous devriez voir:
   - `firstName`, `lastName`, `email`, `phone`
   - `attendees` = nombre total de participants
   - `status` = CONFIRMED ou PENDING

### Dans l'Admin

1. Allez sur http://localhost:3000/admin/evenements
2. Cliquez sur l'événement de test
3. Vous devriez voir les inscriptions

---

## 📊 Validation des Erreurs

### Test 1: Homme essaie de s'inscrire à Conférence Femmes

**Restrictions**: FEMALE, 18+

**Action**: Sélectionner "Homme" dans le genre

**Attendu**: ❌ Erreur API: "Cet événement est réservé aux femmes"

### Test 2: Enfant de 7 ans pour Camp 8-14 ans

**Restrictions**: CHILD, 8-14 ans

**Action**: Date de naissance = 7 ans

**Attendu**: ❌ Erreur API: "Cet événement est réservé aux enfants de 8 à 14 ans"

### Test 3: Inscription individuelle pour événement FAMILY

**Restrictions**: FAMILY

**Action**: (Le formulaire ne propose même pas INDIVIDUAL)

**Attendu**: Le type est forcé à FAMILY

---

## 🚀 Prochaines Étapes (Optionnel)

### Si Vous Voulez les Données de Démo

1. Générez un token Directus (voir guide)
2. Exécutez:
```bash
DIRECTUS_ADMIN_TOKEN="your_token" npx tsx scripts/add-demo-restrictions.ts
```

Cela créera:
- 8 événements de démo avec restrictions variées
- 10 activités de démo (pour plus tard)

### Pour les Activités

Le même système peut être appliqué aux activités:
- Modifier `app/api/activities/[id]/enroll/route.ts`
- Créer un formulaire similaire pour les activités

---

## ✅ Checklist de Test

- [ ] Le formulaire s'affiche sur `/evenements`
- [ ] Le message d'information apparaît si restrictions actives
- [ ] Type FAMILY: demande nombre adultes/enfants
- [ ] Type INDIVIDUAL: demande genre et/ou date de naissance
- [ ] Type MIXED: propose le choix radio
- [ ] Validation API bloque les inscriptions non conformes
- [ ] Email de confirmation envoyé
- [ ] Inscription visible dans Prisma Studio
- [ ] Inscription visible dans l'admin

---

## 🎯 Résumé Technique

### Flux de Données

1. **Utilisateur** clique "S'inscrire" sur `/evenements`
2. **Formulaire Smart** lit `event.restrictions` depuis Directus
3. **Formulaire** s'adapte (affiche/cache champs selon restrictions)
4. **Utilisateur** remplit et soumet
5. **API** `/api/events/[id]/register` valide avec `validateRestrictions()`
6. **Si valide**: Inscription créée dans PostgreSQL via Prisma
7. **Si invalide**: Erreur retournée au client
8. **Email** de confirmation envoyé

### Validation en Double

1. **Client** (SmartEventRegistrationModal): Affiche seulement les bons champs
2. **Serveur** (API route.ts): Valide avec `validateRestrictions()` - **SÉCURISÉ**

### Compatibilité

- Ancien formulaire: Fonctionne toujours (rétrocompatibilité)
- Événements sans restrictions: Fonctionnent normalement
- Nouveau formulaire: S'adapte automatiquement

---

## 📞 Support

**Fichiers de référence**:
- `types/restrictions.ts` - Types et validation
- `components/SmartEventRegistrationModal.tsx` - Formulaire
- `app/api/events/[id]/register/route.ts` - API
- `GUIDE_COMPLET_DEMARRAGE_RESTRICTIONS.md` - Guide complet

**En cas de problème**:
1. Vérifiez que Next.js tourne: `npm run dev`
2. Vérifiez que Directus tourne: http://localhost:8055
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez les logs du serveur

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025

🎉 **Le système est PRÊT!** Testez-le maintenant sur http://localhost:3000/evenements
