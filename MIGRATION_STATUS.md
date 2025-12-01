# 📋 État de la Migration Sanity → Directus

Date: 30 Novembre 2025

## ✅ COMPLÉTÉ

### 1. Installation Directus
- ✅ Serveur Directus installé et fonctionnel sur http://localhost:8055
- ✅ Base PostgreSQL configurée (schéma `directus` séparé de Prisma)
- ✅ Admin créé : admin@mosquee.ch / mosquee2024!

### 2. Collections Directus Créées
Toutes les 8 collections ont été créées avec succès :
- ✅ `events` - Événements
- ✅ `activities` - Activités/Cours
- ✅ `articles` - Articles et actualités
- ✅ `projects` - Projets de dons
- ✅ `team_members` - Équipe
- ✅ `mosque_settings` - Paramètres (singleton)
- ✅ `galleries` - Galeries photos
- ✅ `jumua_messages` - Messages Joumou'a

### 3. SDK et Helpers
- ✅ Package `@directus/sdk` installé
- ✅ Fichier `lib/directus.ts` créé avec tous les helpers
- ✅ Variables d'environnement configurées (DIRECTUS_URL, DIRECTUS_TOKEN)

### 4. Code Mis à Jour
- ✅ Page d'accueil (`app/page.tsx`) - utilise Directus pour messages Joumou'a
- ✅ API route `/api/events/route.ts` créée
- 🔄 Page événements (`app/evenements/page.tsx`) - en cours

### 5. Données de Démo
- ✅ Script de seed créé (`scripts/seed-directus-demo.ts`)
- ⚠️ Données partiellement créées (team_members, events)
- 📝 Vous pouvez ajouter plus de données via l'admin: http://localhost:8055

---

## 🚧 EN COURS / À FAIRE

### Fichiers à Mettre à Jour

#### Pages Front-End à Migrer

| Page | Status | Changements Nécessaires |
|------|--------|------------------------|
| `/app/page.tsx` | ✅ Fait | Messages Joumou'a migrés |
| `/app/evenements/page.tsx` | 🔄 En cours | Remplacer `_id` → `id`, `startTime` → `start_time`, etc. |
| `/app/activites/page.tsx` | ❌ À faire | Utiliser `/api/activities` au lieu de Sanity |
| `/app/about/page.tsx` | ❌ À faire | Récupérer team_members depuis Directus |
| `/app/dons/page.tsx` | ❌ À faire | Récupérer projects depuis Directus |

#### API Routes à Créer/Mettre à Jour

| Route | Status | Description |
|-------|--------|-------------|
| `/api/events/route.ts` | ✅ Créé | Liste des événements |
| `/api/events/[id]/availability/route.ts` | ❌ À faire | Vérifier disponibilité (lié à Prisma) |
| `/api/events/[id]/register/route.ts` | ❌ À faire | Inscription (lié à Prisma) |
| `/api/activities/route.ts` | ❌ À créer | Liste des activités |
| `/api/articles/route.ts` | ❌ À créer | Liste des articles |
| `/api/projects/route.ts` | ❌ À créer | Liste des projets |
| `/api/team-members/route.ts` | ❌ À créer | Membres de l'équipe |

#### Composants à Vérifier

| Composant | Status | Notes |
|-----------|--------|-------|
| `EventRegistrationModal` | ❌ À vérifier | Vérifier les champs `_id` → `id` |
| `HeroWithAnnouncements` | ✅ OK | Déjà compatible |
| Autres composants | ❌ À vérifier | Parcourir `/components` |

---

## 📝 DIFFÉRENCES DE NOMMAGE SANITY vs DIRECTUS

### Champs Modifiés

| Collection | Sanity | Directus |
|------------|--------|----------|
| Toutes | `_id` | `id` |
| events | `startTime` | `start_time` |
| events | `endTime` | `end_time` |
| events | `registrationRequired` | `registration_required` |
| events | `maxCapacity` | `max_capacity` |
| events | `requiresApproval` | `requires_approval` |
| events | `registrationDeadline` | `registration_deadline` |
| activities | `maxParticipants` | `max_participants` |
| activities | `requiresApproval` | `requires_approval` |
| activities | `enrollmentOpen` | `enrollment_open` |
| activities | `ageGroup` | `age_group` |
| articles | `publishedAt` | `published_at` |
| projects | `goalAmount` | `goal_amount` |
| projects | `currentAmount` | `current_amount` |
| projects | `startDate` | `start_date` |
| projects | `endDate` | `end_date` |
| mosque_settings | *objet imbriqué* | *champs plats* (ex: `address_street`) |
| jumua_messages | `isActive` | `is_active` |
| jumua_messages | `validFrom` | `valid_from` |
| jumua_messages | `validUntil` | `valid_until` |

### Images

**Sanity:**
```typescript
image?.asset?.url
```

**Directus:**
```typescript
`${DIRECTUS_URL}/assets/${imageId}`
// OU utiliser le helper:
getDirectusImageUrl(imageId)
```

---

## 🔧 COMMANDES UTILES

### Directus

```bash
# Démarrer Directus
cd /Users/elghoudi/directus-mosquee
npx directus start

# Accéder à l'admin
http://localhost:8055
# Email: admin@mosquee.ch
# Mot de passe: mosquee2024!

# Seed données de démo
cd /Users/elghoudi/mosquee
npx tsx scripts/seed-directus-demo.ts
```

### Next.js

```bash
# Développement
npm run dev

# Build
npm run build
```

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Étape 1: Terminer la page événements
1. Corriger tous les `_id` → `id`
2. Corriger `startTime` → `start_time` et `endTime` → `end_time`
3. Mettre à jour les événements de démo
4. Tester la page

### Étape 2: Créer les API routes manquantes
```typescript
// /app/api/activities/route.ts
import { getActivities } from '@/lib/directus'

export async function GET() {
  const activities = await getActivities()
  return NextResponse.json(activities)
}
```

### Étape 3: Mettre à jour les pages restantes
- `/app/activites/page.tsx`
- `/app/about/page.tsx`
- `/app/dons/page.tsx`

### Étape 4: Mettre à jour les références Prisma
Les tables Prisma qui référencent Sanity doivent être mises à jour :
- `EventRegistration.eventId` → pointe maintenant vers IDs Directus
- `Enrollment.activityIdOld` → pointe maintenant vers IDs Directus
- `Donation.projectId` → pointe maintenant vers IDs Directus

**⚠️ IMPORTANT:** Si vous avez des données en production, vous devrez :
1. Mapper les anciens IDs Sanity vers les nouveaux IDs Directus
2. Mettre à jour les enregistrements Prisma

### Étape 5: Ajouter des données via l'admin
1. Aller sur http://localhost:8055
2. Se connecter
3. Ajouter événements, activités, articles, etc.
4. Uploader des images

### Étape 6: Tests complets
- Tester toutes les pages
- Tester les formulaires d'inscription
- Vérifier les images
- Tester le responsive

### Étape 7: Nettoyage final
```bash
# Supprimer les packages Sanity
npm uninstall sanity @sanity/client @sanity/image-url @sanity/vision next-sanity

# Supprimer les dossiers
rm -rf sanity/
rm -rf app/studio/
rm -rf app/admin/studio/

# Supprimer lib/sanity.ts
rm lib/sanity.ts

# Nettoyer .env
# Supprimer NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN
```

---

## ❓ QUESTIONS / PROBLÈMES

### Problème: Les IDs ne sont pas des UUIDs
**Solution actuelle:** Les relations instructor/author sont commentées dans le script de seed. Vous pouvez les lier manuellement dans l'admin Directus.

### Problème: Données de démo incomplètes
**Solution:** Allez dans l'admin Directus et ajoutez manuellement plus de contenu.

### Problème: Images manquantes
**Solution:** Uploadez des images via l'admin Directus (Content → Files).

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. **Directus ne démarre pas:**
   - Vérifiez que PostgreSQL est accessible
   - Vérifiez les logs : `cd /Users/elghoudi/directus-mosquee && npx directus start`

2. **Erreur de connexion dans Next.js:**
   - Vérifiez que `DIRECTUS_URL` et `DIRECTUS_TOKEN` sont dans `/Users/elghoudi/mosquee/.env`
   - Redémarrez le serveur Next.js

3. **Collections vides:**
   - Allez dans l'admin et ajoutez du contenu manuellement
   - Ou relancez le script de seed (après avoir supprimé les données existantes)

---

**Bon courage pour la suite de la migration ! 🚀**
