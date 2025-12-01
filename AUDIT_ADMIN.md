# 📊 AUDIT ADMIN FRONT-END - Mosquée Madretsch

Date: 30 Novembre 2025

---

## 🎯 RÉSUMÉ EXÉCUTIF

Votre admin Next.js est **très bien conçu** ! La majorité des pages gèrent des **données transactionnelles** (inscriptions, dons, messages) qui doivent **rester dans Prisma**.

### Statistiques Clés
- ✅ **9 pages à conserver** (données transactionnelles)
- ⚠️ **3 pages à modifier** (interaction avec CMS)
- ❌ **1 page à supprimer** (redirection Sanity Studio)

### Impact Migration Directus
**Très faible impact sur l'admin !** La plupart des pages restent inchangées.

---

## ✅ PAGES À CONSERVER (Données Transactionnelles)

Ces pages gèrent des **données utilisateurs** stockées dans **PostgreSQL/Prisma**. Elles sont **essentielles** et ne changent **PAS** avec Directus.

| Page | Chemin | Données | Raison |
|------|--------|---------|--------|
| **Dashboard** | `/admin/page.tsx` | Stats agrégées | Affiche statistiques des inscriptions, dons, etc. - **ESSENTIEL** |
| **Événements** | `/admin/evenements/page.tsx` | `EventRegistration` | Liste des inscriptions aux événements - **CONSERVER** |
| **Dons** | `/admin/dons/page.tsx` | `Donation` | Suivi des dons effectués - **CONSERVER** |
| **Inscriptions** | `/admin/inscriptions/page.tsx` | `Enrollment` | Inscriptions aux activités/cours - **CONSERVER** |
| **Messages** | `/admin/messages/page.tsx` | `ContactMessage` | Boîte de réception contact - **CONSERVER** |
| **Services** | `/admin/services/page.tsx` | `ServiceRequest` | Demandes de services (mariage, etc.) - **CONSERVER** |
| **Membres** | `/admin/membres/page.tsx` | `User` | Gestion des comptes utilisateurs - **CONSERVER** |
| **Cotisations** | `/admin/cotisations/page.tsx` | `Membership` | Adhésions et cotisations - **CONSERVER** |
| **Login** | `/admin/login/page.tsx` | NextAuth | Authentification admin - **CONSERVER** |

---

## ⚠️ PAGES À MODIFIER (Interaction CMS)

Ces pages interagissent avec le CMS (Sanity → Directus).

### 1. Horaires de Prière (`/admin/horaires/page.tsx`)

**Problème :**
- Import des horaires depuis Mawaqit
- **Écrit dans Sanity** via `writeClient`

**Solution :**
```typescript
// AVANT (Sanity)
import { writeClient } from '@/lib/sanity'
await writeClient.create({ ... })

// APRÈS (Directus)
import { directusClient } from '@/lib/directus'
await directusClient.request(updateItem('prayer_settings', ...))
```

**Fichier à modifier :**
- `/app/api/admin/import-prayer-times/route.ts`

---

### 2. Paramètres (`/admin/parametres/page.tsx`)

**Situation actuelle :**
- Stocke le "message Jumua" dans Prisma `MosqueSettings`
- Table : `mosque_settings` avec clé `jumua_message`

**Problème :**
- Le message Jumua existe aussi dans Sanity (`jumuaMessage.ts`)
- **Doublon** entre Prisma et Sanity

**Décision à prendre :**

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **A. Tout dans Directus** | Centralise tous les paramètres CMS | Migration de la table Prisma |
| **B. Garder Prisma** | Aucune migration nécessaire | Paramètres éparpillés |

**Ma recommandation : Option A**
- Migrer tous les paramètres vers Directus `mosque_settings`
- Supprimer la table Prisma `MosqueSettings`
- Tout gérer via l'admin Directus

---

### 3. Studio (`/admin/studio/page.tsx`)

**Code actuel :**
```typescript
redirect('/studio')
```

**Problème :**
- Redirige vers Sanity Studio
- Plus nécessaire avec Directus

**Solution :**

**Option A : Supprimer**
```bash
rm /app/admin/studio/page.tsx
```

**Option B : Rediriger vers Directus**
```typescript
redirect('http://localhost:8055')
```

**Ma recommandation : Option A**
- Les admins peuvent accéder directement à Directus
- Pas besoin de bouton dans l'admin Next.js

---

## ❌ ROUTES API À SUPPRIMER/MODIFIER

### À Supprimer
- Aucune ! Toutes sont utiles.

### À Modifier

#### 1. `/api/admin/import-prayer-times/route.ts`

**Problème :**
```typescript
import { writeClient } from '@/lib/sanity'

// Écrit dans Sanity
await writeClient.patch(settingsId).set({
  annualPrayerTimes: JSON.stringify(allPrayerTimes),
  lastImportDate: new Date().toISOString()
}).commit()
```

**Solution :**
```typescript
import { directusClient } from '@/lib/directus'
import { updateItem } from '@directus/sdk'

// Écrire dans Directus
await directusClient.request(
  updateItem('prayer_settings', settingsId, {
    annual_prayer_times: JSON.stringify(allPrayerTimes),
    last_import_date: new Date().toISOString()
  })
)
```

#### 2. `/api/admin/settings/route.ts` (si Option A choisie)

**Si vous choisissez de migrer vers Directus :**
```typescript
// AVANT (Prisma)
await prisma.mosqueSettings.upsert({
  where: { key: 'jumua_message' },
  update: { value: message },
  create: { key: 'jumua_message', value: message }
})

// APRÈS (Directus)
await directusClient.request(
  updateItem('mosque_settings', '1', {
    jumua_message: message
  })
)
```

---

## 🔍 DÉCOUVERTES IMPORTANTES

### 1. 🚨 Doublon Activity (Sanity vs Prisma)

**Constat CRITIQUE :**

Le modèle `Activity` existe à la fois dans :
- ✅ **Prisma** : `Activity` + `ActivityLevel` (lignes 138-175 du schema.prisma)
- ❌ **Sanity** : `activity.ts` dans `/sanity/schemas/`

**Preuve :**
```typescript
// Dans Prisma (UTILISÉ)
model Activity {
  id          String           @id @default(uuid())
  title       String
  category    ActivityCategory
  // ...
}

// Dans Sanity (OBSOLÈTE)
// sanity/schemas/activity.ts existe aussi !
```

**Impact :**
- Les routes `/api/admin/activities/*` utilisent **PRISMA uniquement**
- Le schéma Sanity est **probablement obsolète**
- Risque de confusion

**Action URGENTE :**
```bash
# Supprimer le schéma Sanity obsolète
rm /Users/elghoudi/mosquee/sanity/schemas/activity.ts

# Mettre à jour index.ts
# Retirer activity de l'export
```

---

### 2. 🔗 Références Sanity dans Prisma

**Ces tables Prisma stockent des ID Sanity :**

```typescript
// EventRegistration.eventId → Pointe vers Sanity event._id
model EventRegistration {
  eventId String // ID Sanity
  eventTitle String // Titre dénormalisé
}

// Donation.projectId → Pointe vers Sanity project._id
model Donation {
  projectId String? // ID Sanity optionnel
  projectName String?
}

// Enrollment.activityIdOld → Ancien ID Sanity
model Enrollment {
  activityIdOld String? // Old Sanity reference
  activityTitle String
}
```

**Impact Migration Directus :**
1. Ces champs devront pointer vers **Directus** au lieu de Sanity
2. Migration nécessaire :
   ```
   Sanity event._id="abc123" → Directus event.id="1"
   ```
3. Mise à jour de **TOUTES** les inscriptions existantes

**Plan de migration :**
```typescript
// 1. Créer mapping Sanity → Directus
const mapping = {
  "sanity_event_abc123": "directus_event_1",
  "sanity_event_def456": "directus_event_2",
  // ...
}

// 2. Mettre à jour Prisma
await prisma.eventRegistration.updateMany({
  where: { eventId: "sanity_event_abc123" },
  data: { eventId: "directus_event_1" }
})
```

---

### 3. 📝 Une seule route écrit dans Sanity

**Bonne nouvelle !**

L'admin Next.js **n'écrit presque jamais** dans Sanity.

**Seule exception :**
- `/api/admin/import-prayer-times/route.ts`

**Toutes les autres routes :**
- ✅ Lisent depuis Sanity (events, projects)
- ✅ Écrivent dans Prisma (inscriptions, dons)

**Impact :**
- Migration facile : 1 seule route à modifier !
- Le reste de l'admin continue à fonctionner

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### ✅ Phase 1 : Nettoyage (MAINTENANT)

```bash
# 1. Supprimer la page Studio
rm /Users/elghoudi/mosquee/app/admin/studio/page.tsx

# 2. Supprimer le schéma Activity Sanity (doublon)
rm /Users/elghoudi/mosquee/sanity/schemas/activity.ts

# 3. Mettre à jour l'index des schémas
# Éditer /sanity/schemas/index.ts et retirer activity
```

### 🔄 Phase 2 : Migrer Prayer Settings

**Modifier** `/api/admin/import-prayer-times/route.ts` :

```typescript
// Remplacer writeClient Sanity par Directus
import { directusClient } from '@/lib/directus'
import { updateItem } from '@directus/sdk'

await directusClient.request(
  updateItem('prayer_settings', settingsId, {
    annual_prayer_times: JSON.stringify(allPrayerTimes),
    last_import_date: new Date().toISOString()
  })
)
```

### ⚠️ Phase 3 : Décider pour MosqueSettings

**Choix à faire :**

**Option A : Migrer vers Directus** (recommandé)
- Supprimer table Prisma `MosqueSettings`
- Tout gérer dans Directus `mosque_settings`
- Modifier `/api/admin/settings`

**Option B : Garder Prisma**
- Ne rien changer
- Paramètres restent en Prisma

**Ma recommandation : Option A** pour centraliser.

### 🔗 Phase 4 : Migrer les références ID

**Après avoir migré le contenu Sanity → Directus :**

1. **Créer un mapping** :
```typescript
const idMapping = {
  // Events
  "sanity_event_1": "directus_event_uuid_1",
  "sanity_event_2": "directus_event_uuid_2",

  // Projects
  "sanity_project_1": "directus_project_uuid_1",
}
```

2. **Mettre à jour Prisma** :
```typescript
// Script de migration
for (const [oldId, newId] of Object.entries(idMapping)) {
  await prisma.eventRegistration.updateMany({
    where: { eventId: oldId },
    data: { eventId: newId }
  })
}
```

---

## 🎯 PRIORITÉS

### 🔴 URGENT (À faire maintenant)
1. Supprimer `/app/admin/studio/page.tsx`
2. Supprimer `/sanity/schemas/activity.ts`
3. Vérifier qu'il n'y a pas d'activités orphelines dans Sanity

### 🟡 MOYEN (Après migration Directus)
1. Modifier `/api/admin/import-prayer-times`
2. Décider pour `MosqueSettings` (Prisma ou Directus)
3. Mettre à jour les ID de référence

### 🟢 BAS (Optimisations)
1. Ajouter un lien vers Directus admin dans la navigation
2. Documenter les différences Sanity → Directus pour les admins
3. Créer un guide utilisateur pour Directus

---

## 📊 RÉSUMÉ VISUEL

```
┌─────────────────────────────────────────────────────┐
│            ADMIN NEXT.JS (/admin)                   │
│                                                     │
│  ✅ CONSERVER (9 pages)                             │
│     - Dashboard, Événements, Dons, Inscriptions    │
│     - Messages, Services, Membres, Cotisations     │
│     → Données transactionnelles (Prisma)           │
│                                                     │
│  ⚠️  MODIFIER (3 pages)                             │
│     - Horaires → Écrire dans Directus             │
│     - Paramètres → À décider                       │
│     - Studio → À supprimer                         │
│                                                     │
│  ❌ SUPPRIMER (1 page)                              │
│     - /admin/studio (redirection Sanity)           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               DIRECTUS ADMIN                        │
│            (http://localhost:8055)                  │
│                                                     │
│  📝 Gérer le contenu CMS :                          │
│     - Événements (titre, description, date)        │
│     - Articles, Projets, Équipe                    │
│     - Paramètres mosquée                           │
│     - Horaires de prière                           │
│     - Galeries, Messages Jumua                     │
└─────────────────────────────────────────────────────┘
```

---

## 💡 RECOMMANDATIONS FINALES

### Ce qui fonctionne bien
- ✅ Séparation claire CMS vs Transactionnel
- ✅ Architecture propre et maintenable
- ✅ Peu de dépendances à Sanity dans l'admin

### Points d'attention
- ⚠️ Schéma Activity en doublon (Sanity + Prisma)
- ⚠️ Message Jumua en doublon (Sanity + Prisma)
- ⚠️ Références ID à migrer lors du passage à Directus

### Conseil
**Votre admin est bien fait !** La migration vers Directus sera **simple** car :
- La plupart des pages restent inchangées
- Une seule route écrit dans Sanity
- Architecture déjà prête pour la séparation

---

## 📞 PROCHAINES ÉTAPES

1. **Commencer par le nettoyage** (supprimer studio, activity.ts)
2. **Terminer la migration Directus** du contenu
3. **Adapter la route import-prayer-times**
4. **Tester l'admin** avec Directus
5. **Former les admins** à utiliser Directus

---

**Audit réalisé le 30 Novembre 2025 par Claude Code**
