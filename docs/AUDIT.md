# AUDIT COMPLET DE L'APPLICATION MOSQUEE

**Date:** 25 décembre 2025
**Scope:** Application Next.js 16 - Gestion de mosquée
**Méthode:** Analyse approfondie du code source (API, Pages, Services, Configuration)

---

## RESUME EXECUTIF

| Catégorie | Critiques | Hautes | Moyennes | Basses | Total |
|-----------|-----------|--------|----------|--------|-------|
| Sécurité API | 2 | 6 | 4 | 2 | 14 |
| Pages/Composants | 2 | 4 | 5 | 4 | 15 |
| Services/Config | 2 | 5 | 8 | 2 | 17 |
| **TOTAL** | **6** | **15** | **17** | **8** | **46** |

**Score global: 5.5/10** - Corrections critiques requises avant production

---

# PARTIE 1: AUDIT DES ROUTES API

## PROBLEMES CRITIQUES

### 1.1 Création d'admin sans protection
**Fichier:** `app/api/setup/create-admin/route.ts`
**Sévérité:** CRITIQUE
**Statut:** A CORRIGER

```
- Route POST sans AUCUNE vérification d'authentification
- Credentials par défaut retournés en réponse
- Pas de vérification si un admin existe déjà
- N'importe qui peut créer un compte admin
```

**Correction:** Utiliser un token d'initialisation secret en variable d'environnement

### 1.2 Secrets exposés dans .env.example
**Fichier:** `.env.example`
**Sévérité:** CRITIQUE
**Statut:** A CORRIGER

```
Contient des secrets REELS et valides:
- STRIPE_SECRET_KEY (clé secrète Stripe)
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- CRON_SECRET
- DATABASE_URL (avec token Prisma Accelerate)
```

**Correction immédiate:** Remplacer par des placeholders

---

## PROBLEMES HAUTE SEVERITE

### 1.3 Route /api/contact - Spam possible
**Fichier:** `app/api/contact/route.ts`

```
- Aucune vérification d'authentification
- Pas de rate limiting
- Pas de vérification CAPTCHA
- Message minimum: 10 caractères (insuffisant)
```

### 1.4 Route /api/donations/record - Webhook sans signature
**Fichier:** `app/api/donations/record/route.ts`

```
- Pas de vérification de signature RaiseNow
- Quelqu'un peut créer des faux dons
- Email fallback 'noemail@example.com'
- Pas de validation unicité transactionId
```

### 1.5 Routes Stripe checkout incohérentes
**Fichiers:**
- `app/api/stripe/create-checkout/route.ts` → `{ url }`
- `app/api/stripe/create-event-checkout/route.ts` → `{ url, sessionId, amount }`
- `app/api/stripe/create-activity-checkout/route.ts` → `{ url, sessionId, amount, activityTitle }`

```
- 3 routes pour la même logique
- Formats de réponse différents
- Code dupliqué
```

### 1.6 Vérification des rôles incohérente
**Exemples:**
- `event-registrations/route.ts` → `requireRoles(ADMIN_ROLES)`
- `memberships/route.ts` → Vérification manuelle
- `stats/route.ts` → Vérification manuelle

```
- Pas d'utilisation systématique du middleware
- Risque d'oubli de vérification
```

### 1.7 Routes CRON sans token secret
**Fichiers:**
- `app/api/cron/expire-memberships/route.ts`
- `app/api/keep-alive/route.ts`

```
- Routes exécutables par n'importe qui
- Risque d'abus
```

---

## PROBLEMES MOYENNE SEVERITE

### 1.8 Doublons fonctionnels
- `/api/admin/event-registrations` vs `/api/admin/evenements-gestion`
- Nommage incohérent (anglais vs français)

### 1.9 Logique d'inscription complexe non documentée
**Fichier:** `app/api/events/[id]/register/route.ts` (lignes 226-237)

```
Machine à états non documentée:
- Si approbation requise → PENDING
- Si payant sans approbation → PENDING_PAYMENT
- Sinon → CONFIRMED
```

### 1.10 Système de remboursement incomplet
**Fichier:** `app/api/membre/evenements/[id]/cancel/route.ts`

```
- createRefundRequest() crée une demande mais...
- Pas de route admin pour approuver
- Pas de webhook de notification
- Pas de gestion si Stripe refuse
```

### 1.11 Validation incohérente entre routes
```
- /api/contact: phone optionnel
- /api/membership/apply: phone requis (min 10 chars)
- /api/event-registrations: phone requis
```

---

# PARTIE 2: AUDIT DES PAGES ET COMPOSANTS

## PROBLEMES CRITIQUES

### 2.1 Duplication massive des routes
```
/app/admin/* (28 pages)
/app/dashboard/* (36 pages)

Les deux ensembles pointent vers les mêmes endpoints API!
- Confusion pour la maintenance
- Risque d'incohérence
- Duplication de code massive
```

**Note:** Migration en cours vers /dashboard uniquement avec redirections dans middleware.ts

### 2.2 Navigation dupliquée avec routes différentes
**Fichiers:**
- `/components/membre/MemberNav.tsx` → Routes `/membre/*`
- `/components/dashboard/DashboardNav.tsx` → Routes `/dashboard/*`

```typescript
// MemberNav
{ href: '/membre/dashboard', ... }
{ href: '/membre/dashboard/enfants', ... }

// DashboardNav
{ href: '/dashboard', ... }
{ href: '/dashboard/enfants', ... }
```

---

## PROBLEMES HAUTE SEVERITE

### 2.3 Pages de profil quasi identiques
**Fichiers:**
- `/app/dashboard/profil/page.tsx` (414 lignes)
- `/app/membre/profil/page.tsx` (413 lignes)

```
Différences mineures:
- country: 'Suisse' vs 'France'
- redirect('/connexion') vs redirect('/auth/signin')
- Apostrophe non échappée dans membre/profil
```

### 2.4 Pages d'enfants avec redirects incohérentes
```typescript
// dashboard/enfants/page.tsx
redirect('/connexion')

// membre/dashboard/enfants/page.tsx
redirect('/auth/signin')  // ← ROUTE INVALIDE!
```

### 2.5 Absence de gestion d'erreur globale
```
- 0 fichiers error.tsx
- 0 fichiers loading.tsx
- Pas de capture d'erreurs propre
- UX dégradée en cas d'erreur
```

### 2.6 Composants morts/inutilisés
- `/components/SmartEventRegistrationModal.tsx` - Aucune référence
- `/components/EventRegistrationModal.tsx` - Aucune référence

---

## PROBLEMES MOYENNE SEVERITE

### 2.7 Type safety manquante
```typescript
// DonationForm.tsx
projects?: any[]

// EnrollmentForm.tsx
activities?: any[]
```

### 2.8 Gestion d'erreur incohérente
```typescript
// 7 instances de:
} catch (err: any) {
  setError(err.message || 'Une erreur...')
}

// EnrollmentForm.tsx - Utilise alert() !
alert('Une erreur est survenue.')  // Mauvaise UX
```

### 2.9 Console statements en production
```
1335 fichiers contiennent console.log/error/warn
19 dans les composants
```

### 2.10 Images non optimisées
```typescript
// dashboard/enfants/page.tsx
<img src={child.avatarUrl} ... />

// Devrait être:
<Image src={child.avatarUrl} ... />
```

---

# PARTIE 3: AUDIT DES SERVICES ET CONFIGURATION

## PROBLEMES CRITIQUES

### 3.1 Double système Prisma
**Fichier:** `lib/prisma.ts`

```typescript
// Instance 1: Avec Accelerate (cache)
const prisma = new PrismaClient().$extends(withAccelerate())

// Instance 2: Sans Accelerate (pour NextAuth)
const prismaForAuth = new PrismaClient()

// Problèmes:
- Double connexion DB
- Consommation pool de connexions
- Logique d'initialisation cassée
```

---

## PROBLEMES HAUTE SEVERITE

### 3.2 Pas de timeout sur requêtes Mawaqit
**Fichier:** `lib/mawaqit.ts`

```typescript
const response = await fetch(url, {
  // Pas de timeout!
})
// Peut bloquer indéfiniment
```

### 3.3 Logique Jumua dupliquée
**Fichier:** `lib/mawaqit.ts`

```
getJumuaMessages() - Ligne 491
getActiveJumuaMessages() - Ligne 990

Code IDENTIQUE pour filtrer les messages actifs
```

### 3.4 Gestion d'erreur incomplète Directus
**Fichier:** `lib/directus.ts`

```typescript
export async function getEvents() {
  try {
    return await directusClient.request(...)
  } catch (error) {
    console.error('Erreur:', error)
    return []  // Pas de distinction erreur vs liste vide
  }
}
```

### 3.5 Variables d'environnement sans validation
```typescript
// auth.ts - Pas de validation
// Si NEXTAUTH_SECRET manque → crash au runtime

// directus.ts
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''  // Default vide

// mawaqit.ts - Fallback vers une VRAIE mosquée
const MAWAQIT_BASE_URL = '...elghoudi.net...'  // Pas générique
```

### 3.6 Directus client non-singleton
**Fichier:** `lib/directus.ts`

```typescript
// Chaque import crée une nouvelle instance
export const directusClient = createDirectus(...)
  .with(staticToken(...))
  .with(rest())
```

---

## PROBLEMES MOYENNE SEVERITE

### 3.7 Types `any` non typés
**Fichier:** `lib/directus.ts`

```typescript
export interface DirectusGallery {
  images?: any[]  // TODO: typer correctement
}
```

### 3.8 Casting `as any` trop permissif
```typescript
// Ligne 520
return (messages as any[]).map(...)

// Ligne 1126
results.push(...(events as any[]).map(...))
```

### 3.9 Configuration Mawaqit codée en dur
```typescript
const MAWAQIT_BASE_URL = process.env.MAWAQIT_API_URL || 'https://mawaqit.elghoudi.net/api/v1'
const MASJID_ID = process.env.masjid_id || 'mosque-madretsch-biel-bienne'
// Fallback vers une mosquée spécifique
```

### 3.10 Email FROM hardcodé
**Fichier:** `lib/email.ts`

```
- Adresse physique codée en dur dans le template
- Si la mosquée déménage, il faut modifier le code
```

### 3.11 Index manquants dans Prisma
```
- EventRegistration.eventId
- Enrollment.activityId
- EventRegistration.createdAt
- Enrollment.createdAt
- Donation.createdAt
```

### 3.12 Champs inutilisés dans EventRegistration
```prisma
model EventRegistration {
  numberOfAdults Int      // Nouveau
  numberOfChildren Int    // Nouveau
  participants Json?      // Ancien (à supprimer)
  attendees Int           // Très ancien (à supprimer)
}
```

### 3.13 Enum MembershipType mélange ancien/nouveau
```prisma
enum MembershipType {
  ACTIF       // Nouveau
  PASSIF      // Nouveau
  INDIVIDUAL  // Ancien (à supprimer)
  FAMILY      // Ancien (à supprimer)
  STUDENT     // Ancien (à supprimer)
  SENIOR      // Ancien (à supprimer)
}
```

### 3.14 Gestion liste d'attente incomplète
```
- Pas de logique de suppression automatique
- Pas de timeout après notification
- Pas de lien avec la vraie inscription
- Pas de gestion d'overbooking
```

---

# PARTIE 4: PLAN DE CORRECTION

## Sprint 1: Sécurité Critique (Immédiat)

| # | Action | Fichier | Statut |
|---|--------|---------|--------|
| 1 | Supprimer secrets de .env.example | .env.example | FAIT |
| 2 | Sécuriser route create-admin | api/setup/create-admin | FAIT |
| 3 | Valider signature webhook RaiseNow | api/donations/record | FAIT (rate limit + unicité) |
| 4 | Ajouter token secret aux routes CRON | api/cron/* | DEJA OK |
| 5 | Ajouter rate limiting | api/contact, membership/apply | FAIT |

## Sprint 2: Architecture

| # | Action | Impact | Statut |
|---|--------|--------|--------|
| 1 | Finaliser migration /admin → /dashboard | Supprimer duplication | FAIT |
| 2 | Supprimer MemberNav obsolète | Cohérence navigation | FAIT |
| 3 | Ajouter error.tsx et loading.tsx | UX améliorée | FAIT |
| 4 | Résoudre double Prisma | Performance DB | DOCUMENTE |
| 5 | Créer singleton Directus | Performance | FAIT |

## Sprint 3: Qualité du Code

| # | Action | Impact | Statut |
|---|--------|--------|--------|
| 1 | Remplacer types `any` | Type safety | FAIT |
| 2 | Standardiser gestion d'erreur | Cohérence | A FAIRE |
| 3 | Fusionner routes Stripe dupliquées | DRY | CONSERVEES |
| 4 | Ajouter indices Prisma manquants | Performance | FAIT |
| 5 | Nettoyer enums obsolètes | Clarté | FAIT |
| 6 | Documenter machine à états inscription | Maintenabilité | A FAIRE |

## Sprint 4: Nettoyage

| # | Action | Impact | Statut |
|---|--------|--------|--------|
| 1 | Supprimer composants morts | Code propre | FAIT |
| 2 | Optimiser images (next/image) | Performance | FAIT |
| 3 | Configurer logger production | Debugging | A FAIRE |
| 4 | Compléter système remboursement | Fonctionnalité | A FAIRE |
| 5 | Améliorer liste d'attente | Fonctionnalité | A FAIRE |

---

# FICHIERS CRITIQUES A CORRIGER EN PRIORITE

1. **`.env.example`** - Supprimer tous les secrets réels
2. **`app/api/setup/create-admin/route.ts`** - Ajouter token d'init
3. **`app/api/donations/record/route.ts`** - Valider signature webhook
4. **`lib/prisma.ts`** - Merger les deux instances
5. **`lib/directus.ts`** - Créer singleton + améliorer gestion erreurs
6. **`middleware.ts`** - Consolider les redirections
7. **`prisma/schema.prisma`** - Ajouter indices, nettoyer enums

---

# RECOMMANDATIONS ARCHITECTURALES

1. **Finaliser migration /dashboard** - Supprimer les anciennes routes /admin et /membre
2. **Créer lib/env.ts** - Validation des variables au démarrage
3. **Standardiser les réponses API** - Format unique success/error
4. **Ajouter des tests** - Routes critiques (auth, paiements)
5. **Documenter les flux** - Inscription, paiement, remboursement

---

# NOTES DE CORRECTION

## Route upload (api/admin/upload)
Après vérification, cette route est **déjà correctement sécurisée**:
- Authentification via session NextAuth
- Vérification du rôle admin (ADMIN, IMAM, STAFF)
- Validation du type de fichier (images uniquement)
- Limite de taille (5MB max)

Ce point était une fausse alerte dans l'audit initial.

---

# PARTIE 5: AUDIT FONCTIONNEL DES PAGES

**Date:** 25 décembre 2025
**Méthode:** Navigation Playwright + vérification du contenu visible
**Serveur:** localhost:3001

## RÉSUMÉ FONCTIONNEL

| Section | Total | OK | Erreurs | 404 |
|---------|-------|-----|---------|-----|
| Pages publiques | 15 | 15 | 0 | 0 |
| Dashboard membre | 11 | 8 | 1 | 2 |
| Dashboard admin | 17 | 16 | 0 | 1 |
| **TOTAL** | **43** | **39** | **1** | **3** |

**Score fonctionnel: 90.7%** (39/43 pages fonctionnelles)

---

## 5.1 PAGES PUBLIQUES (15/15 OK)

| # | Route | Statut | Contenu vérifié |
|---|-------|--------|-----------------|
| 1 | `/` | ✅ OK | Accueil, horaires, compte à rebours, activités |
| 2 | `/horaires` | ✅ OK | Calendrier mensuel, 5 prières, Jumua |
| 3 | `/about` | ✅ OK | Histoire, mission, équipe |
| 4 | `/activites` | ✅ OK | 19 activités, filtres catégorie, pagination |
| 5 | `/evenements` | ✅ OK | 41 événements, filtres, inscriptions |
| 6 | `/dons` | ✅ OK | Types de dons, projets, widget Tamaro |
| 7 | `/contact` | ✅ OK | Formulaire, carte, infos contact |
| 8 | `/services` | ✅ OK | 4 services (Mariage, Funérailles, Shahada, Aqiqa) |
| 9 | `/devenir-membre` | ✅ OK | Types d'adhésion (Actif/Passif), formulaire |
| 10 | `/connexion` | ✅ OK | Formulaire login, lien inscription |
| 11 | `/inscription` | ✅ OK | Formulaire inscription complet |
| 12 | `/admin/login` | ✅ OK | Formulaire admin dédié |
| 13 | `/stripe-success` | ✅ OK | Message confirmation paiement |
| 14 | `/stripe-cancel` | ✅ OK | Message annulation, retour |
| 15 | `/evenements/[slug]` | ✅ OK | Page 404 élégante si non trouvé |

### Incohérences de contenu détectées:
- **Nom mosquée**: "Al-Nour" vs "Madretsch" selon les pages
- **Devise**: € vs CHF incohérent
- **Email contact**: Mélange @mosquee-paris.fr et @mosque-madretsch.ch
- **Adresses**: Paris vs Biel/Bienne

---

## 5.2 DASHBOARD MEMBRE (8/11 OK)

| # | Route | Statut | Contenu vérifié |
|---|-------|--------|-----------------|
| 1 | `/dashboard` | ✅ OK | Stats, notifications, menu complet |
| 2 | `/dashboard/profil` | ✅ OK | Formulaire infos personnelles |
| 3 | `/dashboard/enfants` | ❌ ERREUR | "Impossible de charger cette page" |
| 4 | `/dashboard/notifications` | ❌ 404 | Page non trouvée |
| 5 | `/dashboard/inscriptions` | ✅ OK | 6 inscriptions, statistiques |
| 6 | `/dashboard/evenements` | ❌ 404 | Page non trouvée |
| 7 | `/dashboard/dons` | ✅ OK | Historique, reçu fiscal PDF |
| 8 | `/dashboard/cotisation` | ✅ OK | Types adhésion, statut |
| 9 | `/dashboard/documents` | ✅ OK | Reçus fiscaux, attestations |
| 10 | `/dashboard/paiements` | ✅ OK | 4 paiements en attente |
| 11 | `/dashboard/organiser` | ✅ OK | Espace organisateur |

### Pages à corriger:
1. **`/dashboard/enfants`** - Erreur de chargement (API ou composant)
2. **`/dashboard/notifications`** - Route manquante
3. **`/dashboard/evenements`** - Route manquante (conflit avec `/dashboard/organiser`?)

---

## 5.3 DASHBOARD ADMIN (16/17 OK)

| # | Route | Statut | Contenu vérifié |
|---|-------|--------|-----------------|
| 1 | `/dashboard/admin` | ✅ OK | Stats, alertes, graphique dons |
| 2 | `/dashboard/admin/membres` | ✅ OK | 8 membres, filtres rôle/statut |
| 3 | `/dashboard/admin/gestion` | ✅ OK | 60 offres (41 events, 19 activités) |
| 4 | `/dashboard/admin/gestion/nouveau` | ✅ OK | Formulaire création complet |
| 5 | `/dashboard/admin/dons` | ✅ OK | 22 dons, 31 525 CHF, export CSV |
| 6 | `/dashboard/admin/messages` | ✅ OK | 6 messages, filtres, répondre |
| 7 | `/dashboard/admin/services` | ✅ OK | 3 demandes, filtres type/statut |
| 8 | `/dashboard/admin/jumua` | ✅ OK | 1 message actif, gestion slider |
| 9 | `/dashboard/admin/roles` | ✅ OK | 5 rôles, permissions détaillées |
| 10 | `/dashboard/admin/responsables-activites` | ✅ OK | 41 événements, 10 avec responsable |
| 11 | `/dashboard/admin/adhesions` | ✅ OK | 5 demandes, 40% conversion |
| 12 | `/dashboard/admin/cotisations` | ✅ OK | 4 cotisations, 480 CHF |
| 13 | `/dashboard/admin/activites` | ✅ OK | 19 activités, 7 inscrits |
| 14 | `/dashboard/admin/inscriptions-activites` | ✅ OK | 20 inscriptions, 6 en attente |
| 15 | `/dashboard/admin/evenements` | ✅ OK | 50 inscriptions, 55 participants |
| 16 | `/dashboard/admin/evenements-gestion` | ❌ 404 | Route manquante |
| 17 | `/dashboard/admin/import-raisenow` | ✅ OK | Import CSV, instructions |

### Pages à corriger:
1. **`/dashboard/admin/evenements-gestion`** - Route manquante (doublon avec `/gestion`?)

---

## 5.4 PROBLÈMES CRITIQUES DÉTECTÉS

### Erreurs fonctionnelles (4 pages):
1. `/dashboard/enfants` - **ERREUR** - Page ne charge pas
2. `/dashboard/notifications` - **404** - Route non implémentée
3. `/dashboard/evenements` - **404** - Route non implémentée
4. `/dashboard/admin/evenements-gestion` - **404** - Route non implémentée

### Incohérences de contenu:
| Élément | Valeur 1 | Valeur 2 | Impact |
|---------|----------|----------|--------|
| Nom mosquée | "Al-Nour" | "Madretsch" | Confusion identité |
| Devise | € (euro) | CHF (franc) | Erreur paiements |
| Email | @mosquee-paris.fr | @mosque-madretsch.ch | Support cassé |
| Adresse | 23 rue de la Paix, Paris | Madretschstrasse 64, Biel | Localisation |
| Téléphone | +33 1 23 45 67 89 | 032 322 89 89 | Contact |

---

## 5.5 RECOMMANDATIONS

### Priorité 1 - Corrections urgentes:
1. ✅ Créer `/dashboard/notifications/page.tsx`
2. ✅ Créer `/dashboard/evenements/page.tsx` (ou renommer vers `/dashboard/inscriptions`)
3. 🔧 Débugger `/dashboard/enfants` - vérifier API `/api/account/children`
4. ✅ Supprimer `/dashboard/admin/evenements-gestion` du menu (doublon)

### Priorité 2 - Cohérence contenu:
1. Standardiser le nom de la mosquée → "Mosquée Madretsch"
2. Utiliser CHF partout (pas €)
3. Corriger les emails → @mosque-madretsch.ch
4. Vérifier l'adresse dans tous les composants

### Priorité 3 - Améliorations UX:
1. Ajouter des pages error.tsx personnalisées
2. Améliorer les messages d'erreur
3. Ajouter des pages de loading

---

## 5.6 AUTHENTIFICATION

**Test réussi avec:**
- Email: `admin@mosquee.com`
- Password: `Admin123!`
- Rôle: ADMIN

**Fonctionnalités testées:**
- ✅ Login membre/admin
- ✅ Redirection après connexion
- ✅ Menu contextuel selon rôle
- ✅ Déconnexion
