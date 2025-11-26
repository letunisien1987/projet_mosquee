# Backend Mosquée - Documentation Complète

## Vue d'ensemble

Backend complet pour site de mosquée avec :
- **Prisma** + PostgreSQL pour les données transactionnelles
- **Sanity CMS** pour le contenu éditorial
- **NextAuth.js** pour l'authentification admin

---

## Installation et Configuration

### 1. Variables d'environnement

Le fichier `.env` contient déjà les variables nécessaires :

```env
# Base de données
DATABASE_URL="votre_url_postgresql"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_super_securise_a_changer_en_production

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=votre_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=votre_token_avec_droits_ecriture
```

### 2. Configuration Sanity

1. Créer un compte sur [sanity.io](https://www.sanity.io/)
2. Créer un nouveau projet
3. Copier le Project ID dans `.env`
4. Créer un token avec droits d'écriture dans les paramètres du projet
5. Copier le token dans `.env`

### 3. Initialisation de la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Créer un utilisateur admin
npx tsx scripts/create-admin.ts
```

**Identifiants admin par défaut:**
- Email: `admin@mosquee.com`
- Mot de passe: `Admin123!`

⚠️ **Changez ces identifiants après la première connexion !**

---

## Structure des Données

### Prisma (Base de données PostgreSQL)

#### Modèles principaux

1. **User** - Utilisateurs et membres
   - Rôles: ADMIN, IMAM, TEACHER, STAFF, MEMBER
   - Données personnelles et authentification

2. **Child** - Enfants des membres
   - Rattachés aux parents (User)
   - Pour les inscriptions aux cours

3. **Membership** - Cotisations
   - Types: INDIVIDUAL, FAMILY, STUDENT, SENIOR
   - Statuts: ACTIVE, EXPIRED, PENDING

4. **Enrollment** - Inscriptions aux cours
   - Référence les activités de Sanity
   - Statuts: PENDING, APPROVED, REJECTED

5. **Donation** - Dons
   - Types: ZAKAT, SADAQA, ZAKAT_AL_FITR, PROJECT, MEMBERSHIP
   - Tracking des montants et types

6. **EventRegistration** - Inscriptions aux événements
   - Référence les événements de Sanity

7. **ContactMessage** - Messages du formulaire de contact
   - Marquage lu/non lu

8. **ServiceRequest** - Demandes de services
   - Types: MARRIAGE, FUNERAL, SHAHADA, AQIQA
   - Statuts: PENDING, APPROVED, COMPLETED, CANCELLED

### Sanity CMS (Contenu Éditorial)

#### Schémas principaux

1. **prayerSettings** - Paramètres des horaires de prière
   - JSON annuel des horaires importés depuis Aladhan API
   - Horaires de Joumou'a multiples
   - Méthode de calcul

2. **prayerOverride** - Modifications manuelles des horaires
   - Date unique, période ou permanent
   - Utile pour : Fajr fixe en hiver, Ramadan (Tarawih, Imsak), corrections

3. **event** - Événements
   - Aïd, Ramadan, conférences, iftars...
   - Gestion des inscriptions

4. **activity** - Activités et cours
   - Cours de Coran, arabe, école du dimanche
   - Horaires, professeurs, tarifs

5. **article** - Actualités et articles
   - Annonces, nouvelles, articles religieux

6. **teamMember** - Équipe
   - Imam, président, professeurs...
   - Photos et biographies

7. **project** - Projets de dons
   - Objectifs et progression
   - Tracking en temps réel

8. **mosqueSettings** - Paramètres généraux
   - Adresse, contact, IBAN, Twint
   - Réseaux sociaux
   - Logo

9. **gallery** - Galerie photos
   - Catégories: événements, mosquée, activités

---

## API Routes

### Routes Publiques

#### Dons
- `POST /api/donations` - Créer un don
- `GET /api/donations` - Liste des dons (non anonymes)

#### Inscriptions Cours
- `POST /api/enrollments` - Créer une inscription
- `GET /api/enrollments` - Liste des inscriptions

#### Inscriptions Événements
- `POST /api/event-registrations` - S'inscrire à un événement
- `GET /api/event-registrations` - Liste des inscriptions

#### Contact
- `POST /api/contact` - Envoyer un message
- `GET /api/contact` - Liste des messages

#### Demandes de Services
- `POST /api/service-requests` - Créer une demande
- `GET /api/service-requests` - Liste des demandes

#### Horaires de Prière
- `GET /api/prayer-times?date=YYYY-MM-DD` - Horaires pour une date
- `GET /api/prayer-times?type=month&month=1&year=2024` - Horaires du mois
- `GET /api/prayer-times?type=jumuah` - Horaires de Joumou'a

### Routes Admin (Protégées)

#### Stats Dashboard
- `GET /api/admin/stats` - Statistiques complètes

#### Import Horaires
- `POST /api/admin/import-prayer-times` - Importer horaires annuels depuis Aladhan API

---

## Interface Admin

### Accès
- URL: `/admin`
- Login: `/admin/login`

### Pages disponibles

1. **Dashboard** (`/admin`)
   - Stats en temps réel
   - Graphiques des dons
   - Alertes (cotisations expirant, inscriptions en attente)

2. **Horaires** (`/admin/horaires`)
   - Import des horaires annuels depuis Aladhan API
   - Paramètres de calcul

3. **Sanity Studio** (`/admin/studio` → `/studio`)
   - Interface complète Sanity
   - Gestion de tout le contenu éditorial

### Fonctionnalités à implémenter (pages supplémentaires)

Les pages suivantes sont prévues mais non encore implémentées :
- `/admin/membres` - Gestion des membres
- `/admin/cotisations` - Gestion des cotisations
- `/admin/inscriptions` - Validation des inscriptions
- `/admin/dons` - Historique et stats détaillées
- `/admin/evenements` - Liste des inscriptions
- `/admin/messages` - Boîte de réception
- `/admin/services` - Gestion des demandes

---

## Système d'Horaires de Prière (Intelligence)

### Logique de priorité

1. **Vérifier les overrides** (prayerOverride)
   - Si un override actif existe pour la date → l'utiliser
   - Types : date unique, période, permanent

2. **Sinon, utiliser le JSON annuel** (prayerSettings.annualPrayerTimes)
   - Horaires importés depuis Aladhan API

### Cas d'usage des overrides

- **Fajr fixe en hiver** : Override permanent pour décaler le Fajr
- **Ramadan** : Override période avec Tarawih, Imsak, Qiyam
- **Corrections ponctuelles** : Override date unique

### Import des horaires

Via `/admin/horaires` :
1. Sélectionner l'année
2. Ville (défaut: Bienne)
3. Méthode de calcul (défaut: MWL)
4. Import complet (12 mois) depuis Aladhan API
5. Stockage dans Sanity

---

## Formulaires Publics

Tous les formulaires sont connectés à Prisma et envoient les données à la base :

- **DonationForm** - Sur `/dons`
- **ContactForm** - Sur `/contact`
- **EnrollmentForm** - À créer sur `/activites`
- **EventRegistrationForm** - À créer sur `/evenements`
- **ServiceRequestForm** - À créer (page dédiée)

---

## Sécurité

### Middleware
- Protection de toutes les routes `/admin/*` (sauf `/admin/login`)
- Vérification du rôle (ADMIN, IMAM, STAFF)
- Redirection automatique si non authentifié

### Mot de passe
- Hash avec bcryptjs (12 rounds)
- Validation stricte

### Sessions
- JWT avec NextAuth
- Durée configurable

---

## Prochaines Étapes

### À terminer

1. **Pages admin manquantes**
   - Gestion complète des membres
   - Validation des inscriptions
   - Historique détaillé des dons
   - etc.

2. **Formulaires publics**
   - Formulaire d'inscription aux cours (activités)
   - Formulaire d'inscription aux événements
   - Formulaire de demande de services

3. **Emails**
   - Reçus fiscaux automatiques
   - Confirmations d'inscription
   - Notifications admin

4. **Exports**
   - Export Excel des membres
   - Rapports financiers
   - Statistiques annuelles

### Améliorations futures

- Multi-langue (FR/AR)
- Notifications push
- Application mobile
- Paiements en ligne (Stripe, PayPal, Twint)
- Système de réservation (salles, services)

---

## Support et Documentation

- **Prisma**: https://www.prisma.io/docs
- **Sanity**: https://www.sanity.io/docs
- **NextAuth**: https://next-auth.js.org
- **Aladhan API**: https://aladhan.com/prayer-times-api

---

## Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Prisma
npx prisma studio          # Interface visuelle BDD
npx prisma migrate dev     # Nouvelle migration
npx prisma db push         # Push schema sans migration

# Sanity
npm run sanity:deploy      # Déployer le studio (à configurer)

# Admin
npx tsx scripts/create-admin.ts  # Créer un admin
```

---

## Structure des Fichiers

```
mosquee/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # NextAuth
│   │   ├── donations/         # Dons
│   │   ├── enrollments/       # Inscriptions cours
│   │   ├── contact/           # Messages
│   │   ├── service-requests/  # Demandes services
│   │   ├── prayer-times/      # Horaires
│   │   └── admin/             # Routes admin
│   ├── admin/                  # Interface admin
│   └── studio/                 # Sanity Studio
├── components/                 # Composants React
├── lib/                        # Utilitaires
│   ├── prisma.ts              # Client Prisma
│   ├── sanity.ts              # Client Sanity
│   ├── auth.ts                # Config NextAuth
│   └── prayer-utils.ts        # Logique horaires
├── prisma/
│   └── schema.prisma          # Schéma BDD
├── sanity/
│   └── schemas/               # Schémas Sanity
├── scripts/
│   └── create-admin.ts        # Script admin
└── types/                      # Types TypeScript
```

---

**Tout est prêt ! Il ne reste plus qu'à configurer Sanity et créer l'admin.** 🚀
