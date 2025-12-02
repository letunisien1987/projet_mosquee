# Plan Complet : Système de Paiements pour Site Mosquée

**Date :** 2 décembre 2025
**Projet :** Site web Mosquée Al-Nour
**Objectif :** Stratégie complète pour la gestion des paiements en ligne

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Types de paiements à gérer](#2-types-de-paiements-à-gérer)
3. [Solutions de paiement recommandées](#3-solutions-de-paiement-recommandées)
4. [Architecture technique](#4-architecture-technique)
5. [Flux de paiement détaillés](#5-flux-de-paiement-détaillés)
6. [Gestion des données](#6-gestion-des-données)
7. [Sécurité et conformité](#7-sécurité-et-conformité)
8. [Expérience utilisateur](#8-expérience-utilisateur)
9. [Fonctionnalités avancées](#9-fonctionnalités-avancées)
10. [Feuille de route (Roadmap)](#10-feuille-de-route-roadmap)
11. [Budget estimatif](#11-budget-estimatif)

---

## 1. Vue d'ensemble

### 1.1 Contexte
Votre site de mosquée nécessite un système de paiement complet pour :
- Collecter des dons (Zakat, Sadaqa)
- Gérer les cotisations des membres
- Accepter les paiements pour les événements
- Facturer les inscriptions aux activités (cours d'arabe, Coran, etc.)

### 1.2 Objectifs
- ✅ Simplicité pour les donateurs
- ✅ Sécurité maximale (PCI-DSS compliant)
- ✅ Traçabilité complète des transactions
- ✅ Génération automatique de reçus fiscaux
- ✅ Support multi-devises (CHF prioritaire)
- ✅ Intégration avec la comptabilité

### 1.3 Contraintes
- Budget limité (association à but non lucratif)
- Conformité légale (fiscalité suisse)
- Accessibilité (tous niveaux techniques)
- Support mobile (responsive design)

---

## 2. Types de paiements à gérer

### 2.1 Dons religieux

#### Zakat (Aumône obligatoire)
- **Montants** : Variables, souvent élevés (2.5% de l'épargne)
- **Fréquence** : Annuelle
- **Particularité** : Doit être traçable pour la validité religieuse
- **Calcul** : Besoin d'un calculateur de Zakat

#### Sadaqa (Charité volontaire)
- **Montants** : Libres (5 CHF à 1000+ CHF)
- **Fréquence** : Occasionnelle ou récurrente
- **Types** :
  - Sadaqa Jariya (continue)
  - Sadaqa ponctuelle
  - Sadaqa pour projets spécifiques

#### Zakat al-Fitr
- **Montants** : Fixe (environ 10-15 CHF/personne)
- **Fréquence** : Une fois par an (Ramadan)
- **Particularité** : Urgence (doit être collectée avant l'Aïd)

### 2.2 Cotisations membres

#### Types de cotisations
- **Individuelle** : 200 CHF/an ou 20 CHF/mois
- **Familiale** : 350 CHF/an ou 35 CHF/mois
- **Étudiante** : 100 CHF/an (tarif réduit)
- **Sénior** : 150 CHF/an (tarif réduit)

#### Fonctionnalités requises
- Paiements récurrents (mensuel/annuel)
- Gestion de l'expiration
- Renouvellement automatique avec consentement
- Historique des paiements

### 2.3 Événements

#### Types d'événements
- **Gratuits** : Conférences, prières collectives
- **Payants** :
  - Dîners communautaires (10-30 CHF)
  - Sorties familiales (20-50 CHF)
  - Événements spéciaux (prix variable)

#### Fonctionnalités requises
- Inscription familiale (adultes + enfants)
- Gestion de la capacité
- Liste d'attente automatique
- Confirmation par email
- Rappels avant l'événement

### 2.4 Activités et cours

#### Types d'activités
- **Cours d'arabe** : 50-100 CHF/mois
- **Cours de Coran** : 40-80 CHF/mois
- **École du dimanche** : Gratuit ou 30 CHF/mois
- **Cours pour femmes** : 40-60 CHF/mois

#### Fonctionnalités requises
- Paiements mensuels ou trimestriels
- Gestion multi-enfants (réduction famille nombreuse)
- Gestion des niveaux (débutant, intermédiaire, avancé)
- Suivi de la présence

### 2.5 Services spéciaux

#### Services payants
- **Mariage** : Don recommandé (100-500 CHF)
- **Funérailles** : Gratuit (dons acceptés)
- **Shahada** : Gratuit
- **Aqiqa** : Don recommandé (50-200 CHF)

#### Particularité
- Paiements suggérés (pas obligatoires)
- Flexibilité des montants
- Anonymat possible

---

## 3. Solutions de paiement recommandées

### 3.1 Recommandation principale : **Stripe**

#### ✅ Avantages
- **Frais compétitifs** : 1.4% + 0.25 CHF par transaction (cartes européennes)
- **Très sécurisé** : PCI-DSS Level 1 (le plus haut niveau)
- **Simple à intégrer** : API moderne et bien documentée
- **Pas d'abonnement** : Seulement des frais par transaction
- **Fonctionnalités avancées** :
  - Paiements récurrents (abonnements)
  - Liens de paiement (sans code)
  - Terminal physique disponible
  - Support 3D Secure 2
  - Dashboard complet
  - Webhooks pour automatisation
  - Reçus automatiques par email

#### ⚠️ Inconvénients
- Nécessite un développement technique (déjà fait ✅)
- Support client en anglais uniquement

#### 💰 Coûts estimés
```
Transaction moyenne : 50 CHF
Frais Stripe : 1.4% + 0.25 CHF = 0.95 CHF
Net reçu : 49.05 CHF (98.1%)

Pour 10'000 CHF de dons/mois :
→ Frais totaux : ~165 CHF/mois
```

### 3.2 Alternative : **RaiseNow** (actuellement utilisé)

#### ✅ Avantages
- **Spécialisé non-profit** : Conçu pour les associations
- **Interface clé en main** : Widget prêt à l'emploi
- **Support français** : Service client en français
- **Fonctionnalités métier** :
  - Formulaires de don personnalisables
  - Campagnes de collecte
  - Reporting avancé
  - Gestion des donateurs

#### ⚠️ Inconvénients
- **Frais plus élevés** : ~2-3% + frais fixes
- **Moins flexible** : Personnalisation limitée
- **Pas adapté aux paiements récurrents** complexes (cotisations)
- **Iframe** : Moins intégré visuellement

#### 💰 Coûts estimés
```
Pour 10'000 CHF de dons/mois :
→ Frais totaux : ~250-300 CHF/mois
```

### 3.3 Stratégie hybride recommandée

#### 🎯 Solution optimale

**Stripe pour :**
- ✅ Cotisations membres (paiements récurrents)
- ✅ Inscriptions événements et activités
- ✅ Services spéciaux
- ✅ Toutes les transactions nécessitant une intégration poussée

**RaiseNow (optionnel) pour :**
- ✅ Campagnes de collecte spécifiques
- ✅ Dons ponctuels (page dédiée)
- ✅ Projets avec objectifs de financement visibles

**Pourquoi cette approche ?**
- Stripe : Contrôle total, frais réduits, automatisation
- RaiseNow : Marketing des dons, image professionnelle
- Meilleur des deux mondes

### 3.4 Autres alternatives (non recommandées pour votre cas)

#### PayPal
- ❌ Frais élevés (2.9% + 0.30 CHF)
- ❌ Réputation d'associations de fonds bloqués
- ❌ Moins professionnel

#### Twint
- ⚠️ Seulement Suisse
- ⚠️ Pas de paiements récurrents natifs
- ⚠️ Moins adapté aux montants élevés

#### Virement bancaire (IBAN)
- ✅ Pas de frais
- ❌ Pas d'automatisation
- ❌ Lent (délai de traitement)
- ❌ Pas de confirmation immédiate

---

## 4. Architecture technique

### 4.1 Stack technologique actuel

**Frontend :**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Stripe.js (client SDK)

**Backend :**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (via Prisma Accelerate)

**CMS :**
- Directus (gestion des projets, événements, activités)

**Auth :**
- NextAuth.js

### 4.2 Architecture des paiements

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                           │
│  (Navigateur web - Chrome, Safari, Firefox, Mobile)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                         │
│  • Formulaires de paiement                                   │
│  • Validation côté client                                    │
│  • Stripe.js (tokenisation sécurisée)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTES BACKEND (Next.js)                    │
│  • POST /api/stripe/create-checkout → Créer session         │
│  • POST /api/stripe/webhook → Recevoir événements           │
│  • GET /api/donations → Historique                          │
│  • GET /api/memberships → Cotisations                       │
└───────────────┬──────────────────┬──────────────────────────┘
                │                  │
                ▼                  ▼
    ┌──────────────────┐  ┌──────────────────┐
    │   STRIPE API     │  │   BASE DONNÉES   │
    │  (Paiements)     │  │   (PostgreSQL)   │
    │                  │  │                  │
    │  • Checkout      │  │  • donations     │
    │  • Webhooks      │  │  • memberships   │
    │  • Subscriptions │  │  • payments      │
    └──────────────────┘  │  • users         │
                          └──────────────────┘
                │
                ▼
    ┌──────────────────────┐
    │   NOTIFICATIONS      │
    │  • Email (Resend)    │
    │  • SMS (optionnel)   │
    └──────────────────────┘
```

### 4.3 Base de données - Tables nécessaires

#### Table `donations` (existante ✅)
```sql
- id (UUID)
- userId (UUID, nullable)
- firstName, lastName, email, phone
- amount (Float)
- type (ZAKAT, SADAQA, ZAKAT_AL_FITR, PROJECT, MEMBERSHIP)
- projectId (String, nullable)
- projectName (String, nullable)
- message (String, nullable)
- anonymous (Boolean)
- stripePaymentId (String, nullable)
- createdAt (DateTime)
```

#### Table `payments` (existante ✅)
```sql
- id (UUID)
- userId (UUID, nullable)
- eventId (String, nullable)
- enrollmentId (UUID, nullable)
- amount (Float)
- currency (String, default: CHF)
- status (PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED)
- stripePaymentId (String, unique)
- stripeCheckoutId (String)
- metadata (JSON)
- paidAt (DateTime, nullable)
- failedAt (DateTime, nullable)
- failureReason (String, nullable)
- refundedAt (DateTime, nullable)
- refundAmount (Float, nullable)
- createdAt, updatedAt
```

#### Table `memberships` (existante ✅)
```sql
- id (UUID)
- userId (UUID)
- type (INDIVIDUAL, FAMILY, STUDENT, SENIOR)
- status (ACTIVE, EXPIRED, PENDING)
- amount (Float)
- startDate, endDate
- stripeSubscriptionId (String, nullable) ← À AJOUTER
- autoRenew (Boolean) ← À AJOUTER
- createdAt, updatedAt
```

#### Table `subscription_payments` (nouvelle - À CRÉER)
```sql
- id (UUID)
- membershipId (UUID)
- amount (Float)
- status (SUCCESS, FAILED)
- stripeInvoiceId (String)
- paidAt (DateTime)
- createdAt
```

#### Table `receipts` (nouvelle - À CRÉER)
```sql
- id (UUID)
- userId (UUID)
- year (Int)
- totalAmount (Float)
- pdfUrl (String, nullable)
- sentAt (DateTime, nullable)
- downloadedAt (DateTime, nullable)
- createdAt
```

### 4.4 APIs nécessaires

#### Dons
- `POST /api/donations/create-checkout` - Créer session don ponctuel
- `GET /api/donations` - Historique des dons (utilisateur)
- `GET /api/admin/donations` - Tous les dons (admin)
- `GET /api/donations/receipt/:year` - Télécharger reçu fiscal

#### Cotisations
- `POST /api/memberships/subscribe` - Créer abonnement Stripe
- `POST /api/memberships/cancel` - Annuler abonnement
- `PATCH /api/memberships/:id/renew` - Renouveler manuellement
- `GET /api/memberships/status` - Statut actuel (utilisateur)

#### Événements
- `POST /api/events/:id/register` - Inscription événement
- `POST /api/events/:id/payment` - Paiement événement
- `GET /api/events/:id/check-payment` - Vérifier statut paiement

#### Activités
- `POST /api/activities/:id/enroll` - Inscription activité
- `POST /api/activities/:id/payment` - Paiement inscription
- `GET /api/activities/:id/enrollment-status` - Statut inscription

#### Webhooks
- `POST /api/stripe/webhook` - Recevoir événements Stripe
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

---

## 5. Flux de paiement détaillés

### 5.1 Don ponctuel (Zakat, Sadaqa)

```
1. Utilisateur arrive sur /dons
   ↓
2. Sélectionne type de don (Zakat/Sadaqa)
   ↓
3. Choisit montant (prédéfini ou personnalisé)
   ↓
4. (Optionnel) Associe le don à un projet
   ↓
5. Entre ses coordonnées (nom, email, téléphone)
   ↓
6. (Optionnel) Coche "Don anonyme"
   ↓
7. Clic "Faire un don"
   ↓
8. Redirection vers Stripe Checkout (page sécurisée)
   ↓
9. Entre informations carte bancaire
   ↓
10. Validation du paiement (3D Secure si nécessaire)
   ↓
11. Stripe envoie webhook "checkout.session.completed"
   ↓
12. Serveur enregistre le don dans la base de données
   ↓
13. Email de confirmation envoyé automatiquement
   ↓
14. Redirection vers /stripe-success
```

### 5.2 Cotisation membre (récurrente)

```
1. Utilisateur sur /membre/cotisation
   ↓
2. Sélectionne type (Individuel/Famille/Étudiant/Sénior)
   ↓
3. Choisit fréquence (Mensuel/Annuel)
   ↓
4. Clic "S'abonner"
   ↓
5. Création Stripe Subscription via API
   ↓
6. Redirection vers Stripe Checkout
   ↓
7. Entre informations carte
   ↓
8. Validation premier paiement
   ↓
9. Stripe crée l'abonnement
   ↓
10. Webhook "customer.subscription.created"
   ↓
11. Serveur crée/met à jour membership (status: ACTIVE)
   ↓
12. Email de confirmation + Carte de membre PDF
   ↓
13. Redirection vers /stripe-success

---

Chaque mois/an (automatique) :
→ Stripe prélève le montant
→ Webhook "invoice.paid"
→ Serveur enregistre le paiement
→ Email de reçu envoyé
→ Mise à jour de endDate (+1 mois/an)
```

### 5.3 Inscription événement payant

```
1. Utilisateur sur /evenements
   ↓
2. Sélectionne un événement
   ↓
3. Clic "S'inscrire"
   ↓
4. Formulaire inscription :
   - Type (Individuel/Famille)
   - Nombre participants
   - Informations participants
   ↓
5. Si événement payant :
   - Affichage du montant total
   - Clic "Payer et confirmer"
   ↓
6. Création session Stripe Checkout
   ↓
7. Paiement sur Stripe
   ↓
8. Webhook "checkout.session.completed"
   ↓
9. Serveur :
   - Crée EventRegistration (status: CONFIRMED)
   - Crée Payment (status: COMPLETED)
   - Décrémente capacité disponible
   - Envoie email confirmation avec détails
   ↓
10. Redirection vers /stripe-success
```

### 5.4 Inscription activité (cours)

```
1. Utilisateur sur /activites
   ↓
2. Sélectionne activité
   ↓
3. Clic "Inscrire un enfant"
   ↓
4. Formulaire :
   - Sélection enfant (ou création)
   - Niveau souhaité
   - Informations médicales/allergies
   ↓
5. Si activité payante :
   - Affichage montant mensuel
   - Choix durée engagement (1 mois, trimestre, année)
   ↓
6. Création Enrollment (status: PENDING)
   ↓
7. Si paiement requis immédiatement :
   - Stripe Checkout
   - Paiement validé
   - Webhook
   ↓
8. Serveur :
   - Met à jour Enrollment (status: APPROVED ou PENDING selon règles)
   - Crée Payment
   - Envoie email confirmation
   ↓
9. Admin approuve l'inscription (si nécessaire)
   ↓
10. Email final avec horaires, salle, liste matériel
```

---

## 6. Gestion des données

### 6.1 Stockage sécurisé

#### Données sensibles JAMAIS stockées
- ❌ Numéros de carte bancaire
- ❌ CVV
- ❌ Données d'authentification 3D Secure

**Stripe gère 100% des données de paiement sensibles**

#### Données stockées dans PostgreSQL
- ✅ Références Stripe (payment_intent_id, customer_id)
- ✅ Montants, devises, dates
- ✅ Statuts des transactions
- ✅ Métadonnées (projet, événement, activité)
- ✅ Informations donateurs (nom, email, téléphone)

### 6.2 Synchronisation Stripe ↔ Base de données

```
Stripe (Source de vérité)          PostgreSQL (Copie + métier)
├── payment_intent_id              ├── stripePaymentId
├── amount                         ├── amount
├── status                         ├── status
├── customer_email                 ├── email
└── metadata                       └── projectId, userId, etc.
```

**Règle d'or** : En cas de conflit, Stripe a toujours raison

### 6.3 Rapports et exports

#### Rapports disponibles

**Dashboard Admin (`/admin/dons`)**
- Dons du jour/semaine/mois/année
- Répartition par type (Zakat/Sadaqa)
- Répartition par projet
- Graphiques d'évolution
- Top donateurs (si non anonymes)

**Export Excel/CSV**
- Tous les dons (filtrable par date, type, projet)
- Tous les paiements
- Cotisations actives/expirées
- Inscriptions événements
- Factures mensuelles pour comptabilité

**Rapports fiscaux annuels**
- Génération automatique reçus fiscaux PDF
- Envoi email massif en janvier
- Export pour expert-comptable

### 6.4 Conformité RGPD

#### Données personnelles collectées
- Nom, prénom
- Email, téléphone
- Adresse (optionnel)
- Historique de paiements

#### Droits des utilisateurs
- ✅ Droit d'accès : Télécharger ses données
- ✅ Droit de rectification : Modifier profil
- ✅ Droit à l'effacement : Supprimer compte (avec règles)
- ✅ Droit à la portabilité : Export JSON/CSV

#### Conservation des données
- **Dons** : 10 ans (obligation fiscale)
- **Paiements** : 10 ans (loi comptable)
- **Comptes inactifs** : 3 ans puis anonymisation
- **Logs** : 1 an

---

## 7. Sécurité et conformité

### 7.1 Sécurité des paiements

#### PCI-DSS Compliance
- ✅ **Stripe est PCI-DSS Level 1 certifié**
- ✅ Jamais de données de carte sur vos serveurs
- ✅ Tokenisation côté client (Stripe.js)
- ✅ HTTPS obligatoire partout
- ✅ 3D Secure 2 (Strong Customer Authentication)

#### Variables d'environnement
```bash
# ✅ BON : Clés dans .env.local (jamais committées)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ❌ MAUVAIS : Jamais directement dans le code
const stripe = new Stripe('sk_live_hardcoded') // DANGER !
```

#### Validation des webhooks
```typescript
// ✅ Toujours vérifier la signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)

// ❌ Jamais accepter webhooks non signés
```

### 7.2 Authentification et autorisation

#### Niveaux d'accès

**Public (non authentifié) :**
- Faire un don ponctuel
- Consulter projets

**Membre authentifié :**
- Voir historique personnel
- Gérer cotisation
- S'inscrire événements/activités
- Télécharger reçus fiscaux

**Admin :**
- Dashboard complet
- Gestion remboursements
- Export données
- Statistiques avancées

**Super Admin :**
- Configuration Stripe
- Gestion webhooks
- Logs système

### 7.3 Protection contre la fraude

#### Stripe Radar (inclus gratuitement)
- Machine learning anti-fraude
- Blocage automatique transactions suspectes
- Score de risque par transaction
- Règles personnalisables

#### Règles recommandées
- Bloquer paiements hors Suisse/Europe
- Alertes montants > 1000 CHF
- Limite 5 tentatives par carte
- Vérification email/téléphone pour gros montants

### 7.4 Conformité légale Suisse

#### Obligations fiscales
- Émettre reçus fiscaux pour dons > 100 CHF
- Conserver preuves paiements 10 ans
- Déclarer revenus à l'administration fiscale
- Transparence sur l'utilisation des fonds

#### Mentions légales requises
- IBAN pour virements bancaires
- Numéro d'association
- Adresse du siège
- Contact responsable dons
- Politique remboursement

---

## 8. Expérience utilisateur

### 8.1 Parcours utilisateur optimisé

#### Principe : **Moins de clics = Plus de conversions**

**Don ponctuel (objectif : 3 clics)**
1. Clic "Faire un don"
2. Sélection montant
3. Paiement Stripe (1 page)

**Cotisation membre (objectif : 4 clics)**
1. Clic "Devenir membre"
2. Choix formule
3. Choix fréquence
4. Paiement Stripe

### 8.2 Design des formulaires

#### Montants prédéfinis
```
┌──────┬──────┬──────┬──────┐
│ 20CHF│ 50CHF│100CHF│200CHF│  ← Gros boutons
└──────┴──────┴──────┴──────┘
        [Montant personnalisé]  ← Input en dessous
```

#### Progression visuelle
```
[1] Montant → [2] Coordonnées → [3] Paiement
 ████████████    ░░░░░░░░░░░░    ░░░░░░░░░░
```

#### Messages de confiance
- "Paiement 100% sécurisé par Stripe"
- "Reçu fiscal automatique"
- "Vos données bancaires ne sont jamais stockées"
- Logo Stripe visible

### 8.3 Responsive mobile

#### Mobile-first design
- 60% des dons viennent de mobile
- Boutons suffisamment grands (min 44x44px)
- Clavier numérique auto pour montants
- Auto-complétion adresse email

#### Test sur appareils
- iPhone (Safari)
- Android (Chrome)
- Tablettes (iPad)

### 8.4 Emails transactionnels

#### Email confirmation don
```
Objet : ✅ Merci pour votre don de 50 CHF

Bonjour Ahmed,

Votre don de 50 CHF pour le projet "Construction nouvelle aile"
a bien été enregistré.

Transaction ID : pay_xxxxxxxxxxxxx
Date : 2 décembre 2025, 15:30
Montant : 50.00 CHF
Moyen de paiement : •••• 4242

[Télécharger le reçu PDF]

Merci pour votre générosité !
Mosquée Al-Nour
```

#### Email confirmation cotisation
```
Objet : 🎉 Bienvenue parmi nos membres !

Bonjour Fatima,

Votre cotisation familiale a été activée.

Type : Famille
Montant : 35 CHF/mois
Première échéance : 2 décembre 2025
Prochaine échéance : 2 janvier 2026

[Télécharger carte de membre]
[Gérer mon abonnement]

À bientôt à la mosquée !
```

---

## 9. Fonctionnalités avancées

### 9.1 Paiements récurrents intelligents

#### Gestion des échecs de paiement
```
Tentative 1 (J+0) : Échec
→ Email : "Échec paiement, veuillez vérifier carte"

Tentative 2 (J+3) : Échec
→ Email + SMS : "2ème échec, risque suspension"

Tentative 3 (J+7) : Échec
→ Suspension cotisation
→ Email : "Cotisation suspendue, cliquez pour réactiver"

Après 30 jours sans paiement :
→ Annulation définitive
```

#### Carte expirée
```
30 jours avant expiration :
→ Email : "Votre carte expire bientôt, mettez-la à jour"

À l'expiration :
→ Email : "Mettez à jour votre carte pour continuer"
→ Lien direct mise à jour (Stripe Customer Portal)
```

### 9.2 Calculateur de Zakat

#### Fonctionnalité
Page dédiée `/calculateur-zakat` avec formulaire :

```
1. Épargne (comptes bancaires)     : _______ CHF
2. Or et argent                    : _______ CHF
3. Actions et investissements      : _______ CHF
4. Biens loués                     : _______ CHF
5. Créances récupérables           : _______ CHF
───────────────────────────────────────────────
Total richesse                     : _______ CHF

6. Dettes à court terme            : -______ CHF
───────────────────────────────────────────────
Total imposable                    : _______ CHF

Nisab (seuil minimum) : 4'500 CHF ✅

🎯 Votre Zakat (2.5%) : _____ CHF

[Payer ma Zakat maintenant]
```

#### Sauv egarde des calculs
- Historique des calculs (si connecté)
- Rappel annuel automatique
- Export PDF du calcul

### 9.3 Campagnes de collecte

#### Projets avec objectifs
```
Construction nouvelle aile
──────────────────────────
Objectif : 100'000 CHF
Collecté : 45'000 CHF (45%)

[████████████░░░░░░░░░░░░░░]

128 donateurs
23 jours restants

[Faire un don]
```

#### Fonctionnalités
- Barre de progression temps réel
- Compteur de donateurs
- Timeline des dons récents (si non anonyme)
- Partage réseaux sociaux
- Widget intégrable sur d'autres sites

### 9.4 Reçus fiscaux automatiques

#### Génération automatique
```
Chaque année, le 15 janvier :
→ Script génère PDF pour tous les donateurs
→ Email massif avec PDF joint
→ Archivage sécurisé 10 ans
```

#### Contenu reçu fiscal
```
REÇU FISCAL ANNÉE 2025
Association Mosquée Al-Nour
[Numéro d'association]

Donateur : Ahmed BENALI
Adresse : Rue de la Paix 12, 2500 Bienne

──────────────────────────────────────
Date        Type      Projet    Montant
──────────────────────────────────────
15/03/2025  Zakat     -         500 CHF
22/06/2025  Sadaqa    Nouvelle  100 CHF
                      aile
10/11/2025  Sadaqa    -          50 CHF
──────────────────────────────────────
TOTAL DÉDUCTIBLE               650 CHF
──────────────────────────────────────

Déduction fiscale estimée : 429 CHF (66%)

Signature électronique
[QR Code de vérification]
```

### 9.5 Espace membre avancé

#### Dashboard personnel `/membre/dashboard`
```
┌────────────────────────────────────────┐
│ Bonjour Ahmed                          │
│ Membre depuis : Mars 2023              │
│ Statut : ✅ Actif (expire 15/03/2026)  │
└────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ MES DONS    │ │ COTISATION  │ │ ACTIVITÉS   │
│ 650 CHF     │ │ 35 CHF/mois │ │ 3 enfants   │
│ en 2025     │ │ Auto-renew  │ │ inscrits    │
└─────────────┘ └─────────────┘ └─────────────┘

📊 Historique des transactions
📅 Mes inscriptions événements
👨‍👩‍👧‍👦 Mes enfants (gérer inscriptions)
📄 Mes reçus fiscaux
⚙️ Paramètres paiement
```

#### Gestion abonnement
- Voir prochaines échéances
- Changer fréquence (mensuel ↔ annuel)
- Mettre à jour carte bancaire
- Pause abonnement (max 3 mois)
- Annuler abonnement (avec confirmation)

### 9.6 Dons récurrents (Sadaqa Jariya)

#### Concept
Don mensuel automatique pour soutien continu.

#### Configuration
```
Montant mensuel : [50] CHF
Fréquence : Tous les [15] du mois
Première échéance : 15 janvier 2026
Projet (optionnel) : [Aide alimentaire ▼]

[✓] M'envoyer un récapitulatif mensuel
[✓] Augmenter de 5% chaque année (inflation)

[Activer mon don récurrent]
```

#### Avantages
- Impact continu
- Gestion budget facilitée
- Récapitulatif annuel automatique

---

## 10. Feuille de route (Roadmap)

### Phase 1 : MVP (4-6 semaines) ✅ EN COURS

**Semaine 1-2 : Dons simples**
- [✅] Installation Stripe
- [✅] Formulaire don ponctuel
- [✅] Webhook checkout.session.completed
- [✅] Enregistrement dons en base
- [✅] Pages success/cancel
- [ ] Email confirmation basique

**Semaine 3-4 : Cotisations**
- [ ] Stripe Subscriptions (abonnements)
- [ ] Formulaire adhésion membre
- [ ] Gestion auto-renewal
- [ ] Dashboard cotisations (admin)
- [ ] Email confirmation adhésion

**Semaine 5-6 : Événements**
- [ ] Paiement inscription événement
- [ ] Vérification capacité
- [ ] Gestion liste d'attente
- [ ] Confirmation email avec billet
- [ ] QR Code accès événement

### Phase 2 : Améliorations (6-8 semaines)

**Semaine 7-8 : Activités**
- [ ] Paiement inscription activités
- [ ] Gestion multi-enfants
- [ ] Réductions famille nombreuse
- [ ] Calendrier paiements mensuels

**Semaine 9-10 : Reçus fiscaux**
- [ ] Génération PDF reçus
- [ ] Script génération annuelle
- [ ] Envoi email massif
- [ ] Archivage sécurisé

**Semaine 11-12 : Espace membre**
- [ ] Dashboard personnel
- [ ] Historique transactions
- [ ] Gestion abonnements
- [ ] Mise à jour carte bancaire
- [ ] Export données personnelles (RGPD)

**Semaine 13-14 : Calculateur Zakat**
- [ ] Page calculateur interactif
- [ ] Sauvegarde calculs
- [ ] Rappel annuel automatique
- [ ] Intégration paiement Zakat

### Phase 3 : Fonctionnalités avancées (4-6 semaines)

**Semaine 15-16 : Campagnes**
- [ ] Page projet avec barre progression
- [ ] Objectif et deadline
- [ ] Timeline dons récents
- [ ] Widget intégrable
- [ ] Partage réseaux sociaux

**Semaine 17-18 : Dons récurrents**
- [ ] Stripe Subscriptions pour Sadaqa Jariya
- [ ] Configuration montant/fréquence
- [ ] Gestion échecs paiement
- [ ] Notifications cartes expirées

**Semaine 19-20 : Analytics & Reporting**
- [ ] Dashboard admin avancé
- [ ] Graphiques évolution dons
- [ ] Export Excel/CSV
- [ ] Rapports comptables
- [ ] Prévisions revenus

### Phase 4 : Optimisations (2-4 semaines)

**Semaine 21-22 : Performance**
- [ ] Optimisation temps chargement
- [ ] Cache Stripe requests
- [ ] Tests charge
- [ ] Monitoring erreurs (Sentry)

**Semaine 23-24 : UX/UI**
- [ ] Tests utilisateurs
- [ ] A/B testing formulaires
- [ ] Optimisation mobile
- [ ] Accessibilité (WCAG 2.1)

---

## 11. Budget estimatif

### 11.1 Coûts de développement

#### Option 1 : Développement interne (vous + Claude)
```
Temps estimé : 80-120 heures
Coût : GRATUIT (votre temps)

Avantages :
✅ Contrôle total
✅ Apprentissage
✅ Pas de dépendance externe

Inconvénients :
⚠️ Temps conséquent
⚠️ Courbe d'apprentissage
```

#### Option 2 : Freelance développeur
```
Tarif : 80-120 CHF/heure
Temps : 60-80 heures
Total : 4'800 - 9'600 CHF

Avantages :
✅ Plus rapide
✅ Expertise professionnelle

Inconvénients :
⚠️ Coût initial élevé
⚠️ Dépendance pour maintenance
```

#### Option 3 : Agence web
```
Forfait : 15'000 - 30'000 CHF

Avantages :
✅ Solution clé en main
✅ Support inclus
✅ Garantie résultat

Inconvénients :
⚠️ Très coûteux
⚠️ Sur-dimensionné pour vos besoins
```

**Recommandation : Option 1** (vous êtes déjà bien avancé !)

### 11.2 Coûts mensuels récurrents

#### Stripe (paiements)
```
Frais par transaction : 1.4% + 0.25 CHF

Exemple avec 10'000 CHF/mois :
→ 165 CHF de frais
→ Net : 9'835 CHF

Exemple avec 5'000 CHF/mois :
→ 95 CHF de frais
→ Net : 4'905 CHF
```

#### Hébergement
```
Vercel (gratuit) : 0 CHF/mois
OU
Vercel Pro : 20 CHF/mois (si besoin)
```

#### Base de données
```
Prisma Accelerate : Actuellement utilisé
Neon / Supabase : 0-25 CHF/mois
```

#### Emails transactionnels
```
Resend (déjà configuré) :
0-20 CHF/mois (jusqu'à 3000 emails)
```

#### Monitoring (optionnel)
```
Sentry (erreurs) : 0 CHF (plan free)
LogRocket (sessions) : 0 CHF (plan free)
```

**Total mensuel estimé : 0-50 CHF** (hors frais Stripe)

### 11.3 Retour sur investissement (ROI)

#### Scénario pessimiste
```
Dons mensuels : 3'000 CHF
Frais Stripe : -60 CHF
Coûts serveurs : -25 CHF
───────────────────────
Net mensuel : 2'915 CHF
Net annuel : 34'980 CHF

ROI : ∞ (investissement initial = 0)
```

#### Scénario réaliste
```
Dons mensuels : 8'000 CHF
Cotisations : 2'000 CHF
Total : 10'000 CHF

Frais Stripe : -165 CHF
Coûts serveurs : -25 CHF
───────────────────────
Net mensuel : 9'810 CHF
Net annuel : 117'720 CHF

Gain vs. sans système en ligne :
Si 30% de dons additionnels grâce au système :
→ +30'000 CHF/an
```

#### Scénario optimiste
```
Dons mensuels : 15'000 CHF
Cotisations : 4'000 CHF
Événements : 1'000 CHF
Activités : 2'000 CHF
Total : 22'000 CHF

Frais Stripe : -345 CHF
Coûts serveurs : -50 CHF
───────────────────────
Net mensuel : 21'605 CHF
Net annuel : 259'260 CHF

Gain vs. système physique :
→ Réduction tâches admin : 10h/mois × 30 CHF/h = 300 CHF/mois
→ Moins d'erreurs comptables
→ Traçabilité parfaite
→ Satisfaction donateurs++
```

---

## 12. Risques et mitigation

### 12.1 Risques techniques

#### Risque : Pannes Stripe
**Probabilité : Faible** (uptime 99.99%)
**Impact : Élevé** (aucun paiement possible)

**Mitigation :**
- Afficher IBAN en fallback
- Message clair "Problème temporaire, utilisez virement bancaire"
- Monitoring statut Stripe (status.stripe.com)

#### Risque : Webhooks non reçus
**Probabilité : Moyenne** (problèmes réseau)
**Impact : Moyen** (dons non enregistrés)

**Mitigation :**
- Retry automatique Stripe (48h)
- Script réconciliation journalier
- Alertes admin si décalage détecté

#### Risque : Bugs logiciels
**Probabilité : Moyenne**
**Impact : Variable**

**Mitigation :**
- Tests unitaires critiques
- Environnement de staging
- Monitoring erreurs (Sentry)
- Rollback rapide si nécessaire

### 12.2 Risques financiers

#### Risque : Chargebacks (contestations)
**Probabilité : Faible** (<1% en moyenne)
**Impact : Faible** (Stripe gère)

**Mitigation :**
- Descriptions claires sur relevés bancaires
- Email confirmation immédiat
- Support réactif
- Politique remboursement claire

#### Risque : Fraude
**Probabilité : Faible** (Stripe Radar actif)
**Impact : Moyen** (perte d'argent)

**Mitigation :**
- Stripe Radar (machine learning)
- Blocage paiements suspects
- Vérification manuelle gros montants (>500 CHF)

### 12.3 Risques légaux

#### Risque : Non-conformité RGPD
**Probabilité : Moyenne** (si mal implémenté)
**Impact : Élevé** (amendes)

**Mitigation :**
- Politique confidentialité claire
- Consentement explicite
- Droit à l'oubli implémenté
- DPO désigné (même bénévole)

#### Risque : Problèmes fiscaux
**Probabilité : Faible**
**Impact : Élevé** (redressement fiscal)

**Mitigation :**
- Comptabilité rigoureuse
- Expert-comptable consulté
- Reçus fiscaux conformes
- Archivage 10 ans

---

## 13. Recommandations finales

### 13.1 Priorités absolues

**À faire MAINTENANT :**
1. ✅ Finir intégration Stripe dons simples (presque fait)
2. ⚡ Tester webhooks en local avec Stripe CLI (en cours)
3. ⚡ Envoyer emails confirmation basiques
4. ⚡ Page admin liste des dons

**À faire ce mois-ci :**
5. Cotisations membres (Stripe Subscriptions)
6. Paiements événements
7. Tests utilisateurs réels (5-10 personnes)

**À faire dans 3 mois :**
8. Reçus fiscaux automatiques
9. Calculateur Zakat
10. Dashboard membre complet

### 13.2 Points d'attention

**⚠️ NE PAS :**
- Sur-compliquer dès le début
- Développer des fonctionnalités non demandées
- Négliger les tests
- Oublier les emails de confirmation
- Ignorer les erreurs en production

**✅ TOUJOURS :**
- Tester chaque fonctionnalité manuellement
- Vérifier les webhooks reçus
- Valider les montants en base
- Monitorer les erreurs
- Écouter les retours utilisateurs

### 13.3 Métriques de succès

**KPIs à suivre :**

**Adoption :**
- Nombre dons en ligne vs. physiques
- Taux conversion visiteurs → donateurs
- Nombre membres actifs
- Inscriptions événements en ligne

**Performance :**
- Temps moyen paiement (objectif : <2 min)
- Taux abandon panier (objectif : <30%)
- Taux succès paiements (objectif : >95%)

**Financier :**
- Montant total collecté
- Montant moyen par don
- Frais Stripe % du total
- ROI système paiement

**Satisfaction :**
- Note satisfaction (sondage)
- Nombre réclamations
- Temps réponse support
- Taux renouvellement cotisations

---

## Conclusion

Ce plan vous donne une vision complète du système de paiements pour votre mosquée.

**Prochaines étapes concrètes :**

1. **Cette semaine :**
   - [ ] Finir tests paiement Stripe avec webhook local
   - [ ] Implémenter emails confirmation basiques
   - [ ] Créer page admin `/admin/dons`

2. **Semaine prochaine :**
   - [ ] Faire tester à 3-5 personnes de confiance
   - [ ] Corriger bugs remontés
   - [ ] Documenter pour les utilisateurs

3. **Dans 2 semaines :**
   - [ ] Lancement officiel dons en ligne
   - [ ] Communication communauté
   - [ ] Support premier mois

4. **Mois prochain :**
   - [ ] Cotisations membres
   - [ ] Bilan premier mois
   - [ ] Ajustements basés sur données réelles

**Vous êtes sur la bonne voie !** 🚀

Le système Stripe est déjà bien avancé. Concentrez-vous sur le MVP, lancez rapidement, et améliorez progressivement basé sur les retours réels.

---

**Questions ? Besoin de clarifications ?**
N'hésitez pas à demander des précisions sur n'importe quelle section de ce plan.
