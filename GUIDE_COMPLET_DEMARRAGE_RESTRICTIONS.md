# 🚀 Guide Complet - Démarrage avec le Système de Restrictions

**Date**: 1er décembre 2025
**Durée totale**: 20-30 minutes

---

## 📋 Checklist Rapide

- [ ] Ajouter le champ `restrictions` dans Directus (events + activities)
- [ ] Exécuter le script SQL pour PostgreSQL
- [ ] Générer un token d'admin Directus
- [ ] Exécuter le script de démo
- [ ] Tester les formulaires

---

## ÉTAPE 1: Accéder à Directus (2 minutes)

### 1.1. Vérifier que Directus tourne

Ouvrez http://localhost:8055

Si Directus ne tourne pas:
```bash
cd /Users/elghoudi/directus-mosquee
npx directus start
```

### 1.2. Se Connecter

**Email**: `admin@mosquee.ch`

**Mot de passe**: `mosquee2024!`

---

## ÉTAPE 2: Ajouter le Champ `restrictions` (5 minutes)

### 2.1. Pour la Collection `events`

1. Cliquez sur **Settings** (⚙️) en bas à gauche
2. Cliquez sur **Data Model**
3. Trouvez et cliquez sur **events**
4. Cliquez sur **"+ Create Field"** (en haut à droite)
5. Choisissez le type: **JSON**
6. Configurez:
   - **Field Name**: `restrictions`
   - **Display Label**: `Restrictions d'inscription`
   - **Note**: `Conditions pour s'inscrire (genre, âge, type)`
7. Onglet **Schema**:
   - ✅ Cochez **"Nullable"** (important!)
8. Onglet **Interface**:
   - Choisissez **"Input (JSON)"** ou **"Code Editor"**
9. Cliquez sur **"Save"** (💾)

### 2.2. Pour la Collection `activities`

Répétez EXACTEMENT les mêmes étapes pour **activities**:

1. Settings → Data Model → **activities**
2. Create Field → **JSON**
3. Field Name: `restrictions`
4. Nullable: ✅
5. Save

---

## ÉTAPE 3: Exécuter le Script SQL PostgreSQL (3 minutes)

Le script ajoute les colonnes nécessaires à la table `event_registrations` dans PostgreSQL.

### Option A: Via psql (Recommandé)

```bash
# Récupérez votre DATABASE_URL depuis .env
cat .env | grep DATABASE_URL

# Ensuite exécutez (remplacez YOUR_URL par votre vraie URL):
psql "YOUR_DATABASE_URL" -f scripts/add-restrictions-columns.sql
```

### Option B: Via Prisma Studio

1. Ouvrez Prisma Studio: http://localhost:5556
2. Cliquez sur l'onglet **SQL Query** (si disponible)
3. Copiez-collez le contenu de `scripts/add-restrictions-columns.sql`
4. Exécutez

### Option C: Manuellement dans un client SQL

Ouvrez `scripts/add-restrictions-columns.sql` et exécutez les commandes dans votre client SQL préféré.

---

## ÉTAPE 4: Générer un Token d'Admin Directus (5 minutes)

Pour utiliser le script de démo, vous avez besoin d'un token d'API.

### 4.1. Créer un Token Permanent

1. Dans Directus, allez dans **User Menu** (en haut à droite, votre nom)
2. Cliquez sur **"User Directory"**
3. Trouvez votre utilisateur admin (`admin@mosquee.ch`)
4. Cliquez dessus
5. Scrollez jusqu'à **"Token"** ou **"Admin Token"**
6. Cliquez sur **"Generate Token"** ou **"Create Token"**
7. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après!)

### 4.2. Alternative: Utiliser un Token Statique

Créez un fichier `.env.local` dans le dossier `directus-mosquee`:

```bash
cd /Users/elghoudi/directus-mosquee
echo 'ADMIN_TOKEN=your_token_here' >> .env.local
```

---

## ÉTAPE 5: Exécuter le Script de Démo (2 minutes)

Ce script va créer **8 événements** et **10 activités** avec TOUTES les variantes de restrictions.

```bash
# Retournez dans le dossier du projet
cd /Users/elghoudi/mosquee

# Exécutez le script (remplacez YOUR_TOKEN par le token généré)
DIRECTUS_ADMIN_TOKEN="YOUR_TOKEN" npx tsx scripts/add-demo-restrictions.ts
```

**Exemple**:
```bash
DIRECTUS_ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." npx tsx scripts/add-demo-restrictions.ts
```

### Ce qui sera créé:

**8 Événements de Démo**:
1. Sortie Familiale (FAMILY, ALL, tous âges)
2. Conférence Femmes (INDIVIDUAL, FEMALE, 18+)
3. Discussion Hommes (INDIVIDUAL, MALE, 16+)
4. Camp Enfants (INDIVIDUAL, CHILD, 8-14 ans)
5. Hajj (MIXED, ALL, 18+)
6. Sortie Seniors (INDIVIDUAL, ALL, 60+)
7. Iftar Ouvert (SANS restriction)
8. Préparation Mariage (FAMILY, ALL, 18+)

**10 Activités de Démo**:
1. Arabe Enfants (INDIVIDUAL, ALL, 6-10 ans)
2. Coran Enfants (INDIVIDUAL, CHILD, 7-12 ans)
3. Fiqh Femmes (INDIVIDUAL, FEMALE, 18+)
4. Tajwid Hommes (INDIVIDUAL, MALE, 15+)
5. École Dimanche (INDIVIDUAL, CHILD, 5-8 ans)
6. Arabe Adultes (INDIVIDUAL, ALL, 18+)
7. Sport Jeunes Hommes (INDIVIDUAL, MALE, 12-25 ans)
8. Cuisine Familles (FAMILY, ALL, tous âges)
9. Ramadan Intensif (MIXED, ALL, 10+)
10. Halaqat Ouvert (SANS restriction)

---

## ÉTAPE 6: Vérifier dans Directus (3 minutes)

1. Allez sur http://localhost:8055
2. Cliquez sur **Content** → **events**
3. Vous devriez voir les 8 événements de démo (commencent par "🎉 DÉMO:")
4. Cliquez sur un événement
5. Scrollez jusqu'au champ **"restrictions"**
6. Vérifiez qu'il contient du JSON

Exemple pour "Sortie Familiale":
```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

7. Répétez pour **Content** → **activities**

---

## ÉTAPE 7: Tester sur le Site (Optionnel - Pas encore implémenté)

**Note**: Le formulaire intelligent n'est pas encore créé. Pour l'instant, vous pouvez:

1. Vérifier que les événements s'affichent: http://localhost:3000/evenements
2. Vérifier que les activités s'affichent: http://localhost:3000/activites

Les restrictions ne seront appliquées qu'après la création du formulaire intelligent (prochaine étape).

---

## 🎯 Résumé de Ce Qui Est Prêt

### ✅ Infrastructure Complète

1. **Types TypeScript** (`types/restrictions.ts`)
   - `EventRestrictions` interface
   - `validateRestrictions()` fonction
   - `getRestrictionsMessage()` fonction
   - `calculateAge()` helper

2. **Base de Données**
   - Schema Prisma modifié (`EventRegistration`)
   - Script SQL créé (`scripts/add-restrictions-columns.sql`)
   - Interfaces Directus mises à jour (`lib/directus.ts`)

3. **Documentation**
   - `SYSTEME_RESTRICTIONS_COMPLET.md` - Vue d'ensemble
   - `GUIDE_DIRECTUS_RESTRICTIONS.md` - Guide Directus
   - `EXEMPLES_RESTRICTIONS_COMPLETS.md` - Tous les exemples
   - `IMPLEMENTATION_RESTRICTIONS_SUITE.md` - Plan d'implémentation

4. **Données de Démo**
   - Script de création (`scripts/add-demo-restrictions.ts`)
   - 8 événements variés
   - 10 activités variées

### ⏳ À Créer (Prochaine Étape)

1. **Formulaire Intelligent** (`components/SmartEventRegistrationForm.tsx`)
   - S'adapte selon les restrictions
   - Validation côté client
   - Champs dynamiques

2. **API avec Validation** (modification de `app/api/events/[id]/register/route.ts`)
   - Lecture des restrictions depuis Directus
   - Validation serveur
   - Blocage si non conforme

3. **Intégration Pages**
   - `/evenements` utilise le nouveau formulaire
   - `/activites` utilise le nouveau formulaire

---

## 📊 État des Collections Directus

### Collection `events`

**Champs requis pour restrictions**:
- ✅ `id` (auto)
- ✅ `title`
- ✅ `slug`
- ✅ `category`
- ✅ `date`
- ✅ `start_time`
- ✅ `end_time`
- ✅ `registration_required`
- ✅ `published`
- ⚠️ **`restrictions`** (à ajouter manuellement)

### Collection `activities`

**Champs requis pour restrictions**:
- ✅ `id` (auto)
- ✅ `title`
- ✅ `slug`
- ✅ `category`
- ✅ `active`
- ✅ `enrollment_open`
- ⚠️ **`restrictions`** (à ajouter manuellement)

---

## 🔍 Dépannage

### Problème: Token Expiré

Si vous voyez "Token expired":
1. Générez un nouveau token dans Directus
2. Utilisez-le immédiatement dans le script

### Problème: Champ `restrictions` N'existe Pas

Erreur: `Field "restrictions" doesn't exist in collection "events"`

**Solution**: Vous avez oublié l'ÉTAPE 2. Ajoutez le champ manuellement dans Directus.

### Problème: Script SQL Échoue

Erreur: `column "participation_type" already exists`

**Solution**: Le script a déjà été exécuté. Ignorez l'erreur ou vérifiez avec:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;
```

### Problème: Directus N'est Pas Accessible

**Solution**:
```bash
cd /Users/elghoudi/directus-mosquee
npx directus start
```

Attendez que vous voyez:
```
✨ Server started at http://localhost:8055
```

---

## 📞 Prochaines Étapes

Une fois ces étapes complétées, dites-moi:

**"continue avec le formulaire"**

Et je créerai:
1. Le formulaire intelligent adaptatif
2. La validation API serveur
3. L'intégration dans les pages

**Temps estimé**: 30-40 minutes de développement.

---

## 📚 Fichiers de Référence

**Code**:
- `types/restrictions.ts` - Types et validation
- `lib/directus.ts` - Client Directus avec types
- `prisma/schema.prisma` - Schema EventRegistration
- `scripts/add-restrictions-columns.sql` - Migration SQL
- `scripts/add-demo-restrictions.ts` - Créer données de démo

**Documentation**:
- `SYSTEME_RESTRICTIONS_COMPLET.md` - Master guide
- `EXEMPLES_RESTRICTIONS_COMPLETS.md` - Tous les exemples
- `GUIDE_DIRECTUS_RESTRICTIONS.md` - Guide Directus simple
- `GUIDE_COMPLET_DEMARRAGE_RESTRICTIONS.md` - CE FICHIER

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025

🎉 Vous êtes prêt à démarrer! Suivez les étapes dans l'ordre et tout fonctionnera parfaitement.
