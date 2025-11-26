# 🕌 Guide de Démarrage - Site Mosquée

## ✅ Ce qui a été fait

J'ai implémenté **l'intégralité du backend** pour votre site de mosquée :

### 1. Base de données Prisma + PostgreSQL
- ✅ Schéma complet avec tous les modèles
- ✅ Users, Children, Memberships, Donations, Enrollments, Events, Contact, Services
- ✅ Migrations appliquées

### 2. Sanity CMS
- ✅ Configuration complète
- ✅ Schémas pour : horaires, événements, activités, articles, équipe, projets, galerie
- ✅ Système intelligent d'horaires de prière avec overrides
- ✅ Interface Sanity Studio intégrée

### 3. NextAuth (Authentification)
- ✅ Configuration avec Prisma Adapter
- ✅ Login par email/password
- ✅ Protection des routes admin
- ✅ Middleware de sécurité

### 4. API Routes
- ✅ `/api/donations` - Gestion des dons
- ✅ `/api/enrollments` - Inscriptions aux cours
- ✅ `/api/event-registrations` - Inscriptions aux événements
- ✅ `/api/contact` - Messages de contact
- ✅ `/api/service-requests` - Demandes de services (mariage, funérailles, etc.)
- ✅ `/api/prayer-times` - Horaires de prière
- ✅ `/api/admin/stats` - Statistiques du dashboard
- ✅ `/api/admin/import-prayer-times` - Import automatique depuis Aladhan API

### 5. Interface Admin
- ✅ Dashboard avec statistiques en temps réel
- ✅ Page d'import des horaires de prière
- ✅ Accès à Sanity Studio
- ✅ Layout responsive avec sidebar
- ✅ Protection par authentification

### 6. Formulaires Publics
- ✅ ContactForm - Formulaire de contact connecté à Prisma
- ✅ DonationForm - Formulaire de don connecté à Prisma
- ✅ Page de contact modifiée pour utiliser Sanity

---

## 🚀 Étapes pour démarrer

### 1. Configurer Sanity

**Créer un projet Sanity :**
```bash
# Créer un compte sur sanity.io
# Aller sur https://www.sanity.io/manage
# Créer un nouveau projet
```

**Mettre à jour `.env` :**
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=votre_project_id_ici
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=votre_token_avec_droits_ecriture
```

**Pour obtenir le token :**
1. Allez dans les paramètres de votre projet Sanity
2. API → Tokens
3. Créer un nouveau token avec droits d'écriture
4. Copier le token dans `.env`

### 2. Créer un utilisateur admin

```bash
npm run create-admin
```

**Identifiants par défaut :**
- Email: `admin@mosquee.com`
- Mot de passe: `Admin123!`

⚠️ **Changez ces identifiants après la première connexion !**

### 3. Générer le secret NextAuth

```bash
# Générer un secret aléatoire
openssl rand -base64 32
```

Copier le résultat dans `.env` :
```env
NEXTAUTH_SECRET=votre_secret_genere_ici
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

---

## 📍 URLs Importantes

### Site Public
- Page d'accueil : `http://localhost:3000`
- Contact : `http://localhost:3000/contact`
- Dons : `http://localhost:3000/dons`
- Activités : `http://localhost:3000/activites`
- Événements : `http://localhost:3000/evenements`
- Horaires : `http://localhost:3000/horaires`

### Interface Admin
- Dashboard : `http://localhost:3000/admin`
- Login : `http://localhost:3000/admin/login`
- Import horaires : `http://localhost:3000/admin/horaires`
- Sanity Studio : `http://localhost:3000/studio`

---

## 📊 Première utilisation

### 1. Se connecter à l'admin
1. Aller sur `http://localhost:3000/admin/login`
2. Utiliser les identifiants admin créés
3. Vous serez redirigé vers le dashboard

### 2. Configurer Sanity Studio
1. Aller sur `http://localhost:3000/studio`
2. Créer les contenus de base :
   - **mosqueSettings** : Infos de la mosquée (adresse, contact, IBAN)
   - **prayerSettings** : Paramètres des horaires
   - **teamMember** : Membres de l'équipe (Imam, Président, etc.)
   - **activity** : Cours et activités
   - **event** : Événements à venir
   - **project** : Projets de dons

### 3. Importer les horaires de prière
1. Aller sur `http://localhost:3000/admin/horaires`
2. Sélectionner l'année actuelle
3. Ville : `Bienne` (ou votre ville)
4. Pays : `Switzerland`
5. Cliquer sur "Importer les horaires"
6. Attendre 2-3 minutes (import de 365 jours)

### 4. Créer des overrides (optionnel)
Dans Sanity Studio, créer des `prayerOverride` pour :
- Fajr fixe en hiver
- Horaires spéciaux Ramadan (avec Tarawih, Imsak)
- Corrections ponctuelles

---

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev                  # Lancer le serveur dev

# Base de données
npm run prisma:studio        # Interface visuelle Prisma
npx prisma migrate dev       # Nouvelle migration
npx prisma generate          # Générer le client

# Admin
npm run create-admin         # Créer un utilisateur admin

# Build
npm run build               # Build production
npm start                   # Lancer en production
```

---

## 🎨 Design

**Le design existant est préservé !** J'ai uniquement :
- Connecté les données à Sanity/Prisma
- Ajouté les formulaires fonctionnels
- Créé l'interface admin

Tout le style CSS, les animations Framer Motion et l'UI sont intacts.

---

## 📝 Fonctionnalités Implémentées

### ✅ Complètement fonctionnel
- Authentification admin
- Dashboard avec stats
- Import des horaires de prière
- Formulaire de contact (enregistré en BDD)
- Formulaire de don (enregistré en BDD)
- Sanity Studio intégré
- API complète
- Middleware de protection

### 🚧 À compléter (si besoin)
Les pages admin suivantes sont prévues mais vous pouvez les créer selon vos besoins :
- `/admin/membres` - Gestion des membres
- `/admin/cotisations` - Gestion des cotisations
- `/admin/inscriptions` - Validation des inscriptions
- `/admin/dons` - Historique détaillé
- `/admin/messages` - Boîte de réception
- `/admin/evenements` - Gestion des inscriptions
- `/admin/services` - Demandes de services

Formulaires publics à ajouter :
- Formulaire d'inscription aux cours (sur /activites)
- Formulaire d'inscription aux événements (sur /evenements)
- Formulaire de demande de services

---

## 📚 Documentation

Pour plus de détails techniques, consultez :
- `README_BACKEND.md` - Documentation technique complète
- [Prisma Docs](https://www.prisma.io/docs)
- [Sanity Docs](https://www.sanity.io/docs)
- [NextAuth Docs](https://next-auth.js.org)

---

## 🆘 En cas de problème

### La base de données ne fonctionne pas
```bash
npx prisma migrate reset
npx prisma migrate dev
npm run create-admin
```

### Sanity ne se connecte pas
Vérifiez que :
- Le Project ID est correct dans `.env`
- Le token a les droits d'écriture
- Le dataset est bien `production`

### Erreur d'authentification
Vérifiez que :
- `NEXTAUTH_SECRET` est défini
- `NEXTAUTH_URL` est correct (http://localhost:3000 en dev)
- L'utilisateur admin existe dans la BDD

---

## 🎉 C'est prêt !

Tout le backend est en place et fonctionnel. Vous pouvez maintenant :
1. Configurer Sanity
2. Créer l'admin
3. Commencer à utiliser votre site de mosquée !

**Bon courage ! 🚀**
