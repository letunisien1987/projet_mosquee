# Guide d'intégration Stripe

## ✅ Installation terminée

L'intégration Stripe a été installée avec succès dans votre projet. Tous les fichiers sont en place et sécurisés.

## 📋 Ce qui a été installé

### 1. Packages npm
```bash
npm install stripe @stripe/stripe-js
```

### 2. Configuration serveur (`/lib/stripe.ts`)
- Instance Stripe configurée (SERVER-SIDE uniquement)
- Montants prédéfinis : 20, 50, 100, 200 CHF
- Devise : CHF

### 3. API Routes

**`/app/api/stripe/create-checkout/route.ts`**
- Crée une session Stripe Checkout
- Validation des montants et données
- Utilise la clé secrète (jamais exposée au client)

**`/app/api/stripe/webhook/route.ts`**
- Reçoit les événements Stripe (paiements confirmés)
- ✅ Vérifie la signature pour sécurité maximale
- Enregistre automatiquement les dons dans PostgreSQL

### 4. Composants React

**`/components/StripeDonationForm.tsx`**
- Formulaire client avec montants prédéfinis et personnalisés
- Champs : montant, nom, email
- Redirection sécurisée vers Stripe Checkout

**`/components/DonationCardModal.tsx`** (modifié)
- Modal contenant le formulaire Stripe
- Remplace l'ancienne intégration RaiseNow

**`/components/DonationProjectCard.tsx`** (modifié)
- Carte de projet avec bouton "Faire un don"
- Ouvre le modal Stripe au clic

### 5. Pages de redirection

**`/app/stripe-success/page.tsx`**
- Page après paiement réussi
- Message de confirmation
- Lien vers accueil et autres dons

**`/app/stripe-cancel/page.tsx`**
- Page après annulation
- Option de réessayer ou retour

## 🔐 Configuration requise

### 1. Créer un compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte (gratuit en mode test)
3. Récupérez vos clés API

### 2. Trouver vos clés Stripe

Dans le dashboard Stripe (https://dashboard.stripe.com):

1. **Clé secrète** (Developers > API keys > Secret key)
   - Commence par `sk_test_...` (test) ou `sk_live_...` (production)
   - ⚠️ NE JAMAIS partager cette clé !

2. **Clé publique** (Developers > API keys > Publishable key)
   - Commence par `pk_test_...` (test) ou `pk_live_...` (production)
   - OK pour le client

3. **Secret webhook** (Developers > Webhooks > Add endpoint)
   - URL du webhook : `https://votre-domaine.com/api/stripe/webhook`
   - Événements à écouter : `checkout.session.completed`
   - Après création, récupérez le "Signing secret"
   - Commence par `whsec_...`

### 3. Configurer les variables d'environnement

Copiez `.env.example` vers `.env.local` :
```bash
cp .env.example .env.local
```

Puis éditez `.env.local` :
```env
# Stripe (NE JAMAIS COMMITTER CES CLÉS !)
# Clé secrète - SERVEUR UNIQUEMENT
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI

# Clé publique - OK pour le client
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI

# Secret webhook - Pour vérifier les signatures
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK_ICI
```

### 4. Vérifier le .gitignore

Assurez-vous que `.env.local` est dans `.gitignore` :
```gitignore
.env
.env.local
.env*.local
```

## 🧪 Tester en mode développement

### 1. Tester les paiements

Utilisez les numéros de carte de test Stripe :

**Carte qui fonctionne :**
- Numéro : `4242 4242 4242 4242`
- Date : N'importe quelle date future (ex: 12/34)
- CVC : N'importe quel 3 chiffres (ex: 123)

**Carte qui échoue :**
- Numéro : `4000 0000 0000 0002`

### 2. Tester le webhook en local

Pour tester le webhook en développement local :

```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Se connecter
stripe login

# Écouter les webhooks localement
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe CLI vous donnera un `whsec_...` temporaire à mettre dans `.env.local`

### 3. Vérifier les logs

Les dons confirmés apparaissent dans :
- Console du serveur : "✅ Don enregistré: [id] - [montant] CHF"
- Dashboard Stripe : Payments
- Base de données PostgreSQL : table `donations`

## 🚀 Passage en production

### 1. Activer le compte Stripe

1. Complétez la vérification d'identité
2. Activez les paiements en production
3. Récupérez les clés de PRODUCTION (`sk_live_...` et `pk_live_...`)

### 2. Configurer le webhook de production

1. Dashboard Stripe > Webhooks > Add endpoint
2. URL : `https://votre-domaine-production.com/api/stripe/webhook`
3. Événements : `checkout.session.completed`, `payment_intent.payment_failed`
4. Récupérez le nouveau `whsec_...` de production

### 3. Mettre à jour les variables d'environnement de production

Sur votre plateforme de déploiement (Vercel, etc.), configurez :
```env
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_LIVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_LIVE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_LIVE
```

## 📊 Fonctionnement

### Flux de paiement

1. **Utilisateur clique sur "Faire un don"**
   - Modal s'ouvre avec formulaire Stripe

2. **Utilisateur remplit le formulaire**
   - Choisit un montant (prédéfini ou personnalisé)
   - Entre son nom et email

3. **Soumission du formulaire**
   - Appel à `/api/stripe/create-checkout`
   - Création d'une session Stripe Checkout
   - Redirection vers page sécurisée Stripe

4. **Paiement sur Stripe**
   - Utilisateur entre sa carte bancaire
   - Stripe traite le paiement de manière sécurisée

5. **Après paiement réussi**
   - Stripe envoie un webhook à `/api/stripe/webhook`
   - Webhook vérifie la signature (sécurité)
   - Don enregistré dans PostgreSQL
   - Utilisateur redirigé vers `/stripe-success`

6. **Si annulation**
   - Utilisateur redirigé vers `/stripe-cancel`
   - Aucun paiement effectué

## 🔒 Sécurité

### Points de sécurité implémentés

✅ **Clés API sécurisées**
- Clé secrète jamais exposée au client
- Utilisation d'env vars uniquement
- Séparation client/serveur stricte

✅ **Vérification de signature webhook**
- Chaque webhook vérifié avec `stripe.webhooks.constructEvent()`
- Protection contre les fausses requêtes

✅ **Validation des données**
- Montant minimum de 1 CHF
- Validation des champs obligatoires
- Sanitisation des entrées

✅ **HTTPS obligatoire en production**
- Stripe requiert HTTPS pour les webhooks
- Données sensibles chiffrées en transit

## 🛠️ Maintenance

### Consulter les paiements

**Dashboard Stripe :**
https://dashboard.stripe.com/payments

**Base de données :**
```bash
npx prisma studio
```
Puis ouvrir la table `donations`

### Remboursements

Dans le dashboard Stripe :
1. Allez dans Payments
2. Trouvez le paiement
3. Cliquez sur "Refund"
4. Mettez à jour manuellement la table `donations` si nécessaire

### Problèmes courants

**Erreur "STRIPE_SECRET_KEY manquante"**
- Vérifiez que `.env.local` existe
- Vérifiez que la variable est bien définie
- Redémarrez le serveur Next.js

**Webhook signature invalide**
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- En local, utilisez Stripe CLI
- En production, vérifiez l'URL du webhook dans Stripe

**Don non enregistré en base**
- Vérifiez les logs serveur
- Vérifiez que le webhook a bien été appelé
- Testez avec Stripe CLI en local

## 📧 Support

Pour toute question :
- Documentation Stripe : https://stripe.com/docs
- Dashboard Stripe : https://dashboard.stripe.com
- Stripe CLI : https://stripe.com/docs/stripe-cli

---

**Installation complétée le :** 2025-12-01
**Statut :** ✅ Prêt à tester
