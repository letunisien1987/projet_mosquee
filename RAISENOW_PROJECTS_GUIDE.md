# Guide - Système de Dons par Projet avec RaiseNow

## Vue d'ensemble

Le système permet de créer des **cartes de dons** pour chaque projet avec :
- ✅ Image du projet
- ✅ Description
- ✅ Barre de progression (montant collecté / objectif)
- ✅ Bouton "Faire un don" qui ouvre un popup
- ✅ Widget RaiseNow intégré (SolutionEmbed)
- ✅ Code RaiseNow unique par projet

## 🔧 Configuration dans Directus

### 1. Ajouter le champ `raisenow_code` à la collection `projects`

Allez dans Directus → Settings → Data Model → `projects` et ajoutez :

```
Champ: raisenow_code
Type: String
Interface: Input
Options:
  - Placeholder: "Exemple: zsmgy"
  - Icon: credit-card
  - Note: "Code unique RaiseNow pour ce projet (ex: zsmgy)"
```

### 2. Créer vos projets de don

Allez dans Content → Projects et créez vos projets :

**Exemple 1 - Rénovation Mosquée:**
```
Title: Rénovation de la Mosquée
Description: Projet de rénovation complète de la salle de prière principale
Goal Amount: 50000
Current Amount: 12500
Image: [Upload une belle image]
RaiseNow Code: zsmgy  ← CODE UNIQUE RAISENOW
Active: Yes
Priority: 1
```

**Exemple 2 - Cours d'Arabe:**
```
Title: Programme Cours d'Arabe
Description: Financement des cours d'arabe pour les enfants
Goal Amount: 10000
Current Amount: 3200
Image: [Upload image]
RaiseNow Code: abc123  ← CODE UNIQUE RAISENOW
Active: Yes
Priority: 2
```

**Exemple 3 - Aide Humanitaire:**
```
Title: Aide Humanitaire Palestine
Description: Collecte pour l'aide humanitaire d'urgence
Goal Amount: 30000
Current Amount: 18500
Image: [Upload image]
RaiseNow Code: xyz789  ← CODE UNIQUE RAISENOW
Active: Yes
Priority: 3
```

## 🎯 Obtenir les codes RaiseNow

### Option A : Via le Dashboard RaiseNow

1. Connectez-vous à https://raisenow.com
2. Allez dans **Solutions** → **Embedded Widgets**
3. Cliquez sur **Create New Widget**
4. Remplissez les informations du projet :
   - Project Name: "Rénovation Mosquée"
   - Purpose Code: Ce sera votre code unique (ex: `zsmgy`)
5. Copiez le code fourni qui ressemble à :
   ```html
   <div id="rnw-solution-embed-zsmgy"></div>
   <script>
     ...url: "https://pay.raisenow.io/zsmgy"...
   </script>
   ```
6. Prenez juste le code : `zsmgy`

### Option B : Utiliser les codes de test RaiseNow

Pour tester, vous pouvez utiliser des codes de démonstration :
- `zsmgy` - Widget de test RaiseNow
- Ou créez vos propres codes dans votre compte RaiseNow

## 📊 Récupérer les données de dons

### Méthode 1 : Webhook RaiseNow (Automatique - Recommandé)

RaiseNow peut envoyer automatiquement les données à votre site :

1. **Configurez le webhook dans RaiseNow:**
   - Allez dans Settings → Webhooks
   - Ajoutez l'URL : `https://votre-domaine.com/api/donations/webhook`
   - Événement : "Payment Completed"
   - Copiez le secret du webhook

2. **Ajoutez la variable d'environnement:**
   ```bash
   # .env
   RAISENOW_WEBHOOK_SECRET=votre_secret_webhook
   ```

3. **Données reçues automatiquement:**
   Quand quelqu'un fait un don, vous recevez :
   ```json
   {
     "epp_transaction_id": "txn_abc123",
     "amount": "100.00",
     "currency": "CHF",
     "stored_customer_firstname": "Ahmed",
     "stored_customer_lastname": "Benali",
     "stored_customer_email": "ahmed@example.com",
     "stored_customer_phone": "+41 79 123 45 67",
     "stored_customer_street": "Rue de la Paix 10",
     "stored_customer_zip_code": "2500",
     "stored_customer_city": "Bienne",
     "stored_customer_country": "CH",
     "purpose": "zsmgy",  ← Code du projet
     "payment_method": "card",
     "language": "fr",
     "test_mode": false
   }
   ```

4. **Ces données sont automatiquement enregistrées dans PostgreSQL:**
   - Table : `Donation`
   - Champs : montant, email, nom, téléphone, adresse, projectId, etc.

### Méthode 2 : API RaiseNow (Manuel)

Vous pouvez aussi récupérer les données via l'API RaiseNow :

```javascript
// Exemple de récupération via API
const response = await fetch('https://api.raisenow.io/v1/transactions', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})

const transactions = await response.json()
```

### Méthode 3 : Export CSV depuis RaiseNow

1. Connectez-vous au dashboard RaiseNow
2. Allez dans **Reports** → **Transactions**
3. Filtrez par projet (code)
4. Exportez en CSV
5. Importez dans votre système

## 🎨 Apparence sur le site

### Page de dons (`/dons`)

Les projets s'affichent comme des cartes :

```
┌─────────────────────────────────────┐
│  [IMAGE DU PROJET]                  │
├─────────────────────────────────────┤
│  Rénovation de la Mosquée           │
│                                     │
│  Projet de rénovation complète...  │
│                                     │
│  Progression: 25%                   │
│  ████████░░░░░░░░░░░░░░░░░░         │
│  12,500 CHF sur 50,000 CHF          │
│                                     │
│  [ ♥ Faire un don ]                 │
└─────────────────────────────────────┘
```

### Popup de don

Quand l'utilisateur clique sur "Faire un don" :

```
╔═════════════════════════════════════╗
║  Rénovation de la Mosquée      [X] ║
╠═════════════════════════════════════╣
║                                     ║
║  [WIDGET RAISENOW INTÉGRÉ]          ║
║  - Choix du montant                 ║
║  - Informations personnelles        ║
║  - Méthode de paiement              ║
║  - Confirmation                     ║
║                                     ║
╚═════════════════════════════════════╝
```

## 🔍 Informations collectées

Pour chaque don, vous récupérez :

### Informations personnelles:
- ✅ Prénom et nom
- ✅ Email
- ✅ Téléphone
- ✅ Adresse complète (rue, ville, code postal, pays)

### Informations du don:
- ✅ Montant
- ✅ Devise (CHF, EUR, etc.)
- ✅ Méthode de paiement (carte, TWINT, PayPal, etc.)
- ✅ ID de transaction unique
- ✅ Code du projet
- ✅ Date et heure
- ✅ Langue utilisée
- ✅ Mode test ou production

### Utilisation des données:

Ces données sont utilisées pour :
1. **Enregistrement dans la base de données** (table `Donation`)
2. **Envoi d'email de confirmation** au donateur
3. **Génération de reçus fiscaux** (66% de réduction d'impôts)
4. **Statistiques** dans l'admin
5. **Mise à jour automatique** de la barre de progression

## 📝 Exemple de workflow complet

1. **Admin crée un projet dans Directus:**
   - Title: "Construction Nouvelle Salle"
   - Goal: 80,000 CHF
   - RaiseNow Code: `salle2024`

2. **Projet apparaît automatiquement sur `/dons`**

3. **Utilisateur visite le site:**
   - Voit la carte du projet
   - Clique sur "Faire un don"
   - Popup s'ouvre avec widget RaiseNow

4. **Utilisateur fait un don:**
   - Entre 500 CHF
   - Remplit ses informations
   - Paie par carte bancaire
   - Reçoit confirmation

5. **RaiseNow envoie webhook à votre site:**
   - `POST /api/donations/webhook`
   - Données du don + informations personnelles

6. **Votre site traite automatiquement:**
   - ✅ Enregistre dans la base de données
   - ✅ Envoie email de confirmation
   - ✅ Met à jour la progression (12,500 → 13,000 CHF)
   - ✅ Génère reçu fiscal

7. **Admin peut voir dans le dashboard:**
   - Liste de tous les dons
   - Détails de chaque donateur
   - Export CSV pour comptabilité

## 🚀 Déploiement

### Variables d'environnement nécessaires:

```bash
# .env
RAISENOW_WEBHOOK_SECRET=secret_from_raisenow_dashboard
```

### URLs à configurer dans RaiseNow:

```
Webhook URL: https://votre-domaine.com/api/donations/webhook
Success URL: https://votre-domaine.com/dons/merci
Cancel URL: https://votre-domaine.com/dons
```

## ❓ FAQ

**Q: Puis-je avoir plusieurs projets actifs en même temps ?**
R: Oui ! Créez autant de projets que vous voulez dans Directus, chacun avec son propre code RaiseNow.

**Q: Comment mettre à jour le montant collecté ?**
R: Deux options :
- Automatique : Via webhook RaiseNow
- Manuel : Modifiez `current_amount` dans Directus

**Q: Les données sont-elles sécurisées ?**
R: Oui, RaiseNow est certifié PCI-DSS. Le paiement se fait directement chez RaiseNow, pas sur votre serveur.

**Q: Puis-je personnaliser les couleurs du widget ?**
R: Oui, dans RaiseNow dashboard → Widget Settings → Colors

**Q: Comment tester sans faire de vrais paiements ?**
R: Utilisez `test_mode: true` dans RaiseNow et utilisez leurs cartes de test.

## 📞 Support

- Documentation RaiseNow : https://docs.raisenow.com
- Support RaiseNow : support@raisenow.com
- Code source : `/components/DonationProjectCard.tsx` et `/components/DonationCardModal.tsx`
