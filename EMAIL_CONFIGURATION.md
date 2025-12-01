# Configuration des Notifications par Email

Ce document explique comment configurer le système de notifications par email avec Resend.

## 📧 Pourquoi Resend ?

- ✅ **Gratuit** : 3000 emails/mois (plus que suffisant pour une mosquée)
- ✅ **Simple** : Configuration en 5 minutes
- ✅ **Moderne** : API propre et bien documentée
- ✅ **Fiable** : Infrastructure professionnelle
- ✅ **Sans carte bancaire** : Aucune CB requise pour le plan gratuit

## 🚀 Configuration étape par étape

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Cliquez sur "Sign Up" (Inscription)
3. Inscrivez-vous avec votre email professionnel (ex: `admin@mosquee-madretsch.ch`)
4. Vérifiez votre email

### 2. Obtenir votre clé API

1. Une fois connecté, allez dans **API Keys** (clés API)
2. Cliquez sur **"Create API Key"**
3. Nommez-la : `Mosquee Madretsch Production`
4. Permissions : Laissez **"Sending access"** (Accès envoi)
5. Cliquez sur **"Add"**
6. **IMPORTANT** : Copiez immédiatement la clé qui commence par `re_...`
   - Elle ne sera affichée qu'une seule fois !
   - Exemple : `re_jivGKkGf_JgYFaXVvREozMumZNpcSntn3`

### 3. Configurer le domaine d'envoi

#### Option A : Utiliser le domaine Resend (le plus simple)

Si vous n'avez pas de domaine personnalisé, Resend vous fournit automatiquement :
- `onboarding@resend.dev` (pour les tests)

**Avantage** : Fonctionne immédiatement, aucune configuration DNS
**Inconvénient** : Le nom de l'expéditeur est générique

#### Option B : Utiliser votre propre domaine (recommandé)

1. Dans Resend, allez dans **Domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine : `mosquee-madretsch.ch`
4. Resend vous donnera des enregistrements DNS à ajouter :
   ```
   Type: TXT
   Name: _resend
   Value: [fourni par Resend]

   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   ```
5. Ajoutez ces enregistrements dans votre gestionnaire DNS (OVH, Cloudflare, etc.)
6. Attendez 5-30 minutes pour la propagation DNS
7. Cliquez sur **"Verify"** dans Resend

**Avantage** : Emails professionnels de `noreply@mosquee-madretsch.ch`
**Inconvénient** : Nécessite accès aux DNS du domaine

### 4. Ajouter les variables d'environnement

Éditez le fichier `.env` à la racine du projet :

```bash
# Configuration Email (Resend)
RESEND_API_KEY=re_votre_cle_api_ici
EMAIL_FROM=noreply@mosquee-madretsch.ch
```

Remplacez :
- `re_votre_cle_api_ici` par votre vraie clé API Resend
- `noreply@mosquee-madretsch.ch` par votre email d'expéditeur

**Exemples selon votre choix** :

```bash
# Option A : Domaine Resend (tests)
RESEND_API_KEY=re_jivGKkGf_JgYFaXVvREozMumZNpcSntn3
EMAIL_FROM=onboarding@resend.dev

# Option B : Votre domaine (production)
RESEND_API_KEY=re_jivGKkGf_JgYFaXVvREozMumZNpcSntn3
EMAIL_FROM=noreply@mosquee-madretsch.ch
```

### 5. Redémarrer l'application

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis relancer
npm run dev
```

## 📬 Emails automatiques envoyés

Une fois configuré, les emails suivants seront envoyés automatiquement :

### 1. Email de bienvenue
**Quand** : Lors de l'inscription d'un nouveau membre
**À qui** : Le nouvel utilisateur
**Contenu** :
- Message de bienvenue
- Lien vers l'espace membre
- Présentation des fonctionnalités

### 2. Confirmation d'inscription aux activités
**Quand** : Inscription à une activité (cours d'arabe, tajweed, etc.)
**À qui** : La personne inscrite
**Contenu** :
- Confirmation de réception de la demande
- Nom de l'activité
- Statut (en attente de validation ou confirmée)
- Lien vers "Mes inscriptions"

### 3. Confirmation d'inscription à un événement
**Quand** : Inscription à un événement
**À qui** : La personne inscrite
**Contenu** :
- Confirmation d'inscription
- Date et heure de l'événement
- Nombre de places réservées
- Lien vers "Mes événements"

### 4. Confirmation de don
**Quand** : Après un don via Tamaro (RaiseNow)
**À qui** : Le donateur
**Contenu** :
- Remerciement
- Montant du don
- Nom du projet (si applicable)
- Verset coranique
- Lien vers "Mes dons"

## 🧪 Tester l'envoi d'emails

### Test manuel via l'inscription

1. Créez un nouveau compte avec votre email de test
2. Vérifiez votre boîte de réception
3. Vous devriez recevoir l'email de bienvenue

### Test via les logs

Les emails envoyés apparaissent dans les logs du serveur :

```
✅ Email envoyé avec succès: { id: 'xxx-xxx-xxx' }
```

Si la clé API n'est pas configurée :

```
⚠️  RESEND_API_KEY non configurée - Email non envoyé
```

### Vérifier dans Resend Dashboard

1. Connectez-vous à [resend.com](https://resend.com)
2. Allez dans **Emails** (menu de gauche)
3. Vous verrez tous les emails envoyés avec leur statut :
   - ✅ **Delivered** : Email délivré avec succès
   - ⏳ **Queued** : En cours d'envoi
   - ❌ **Failed** : Échec (voir les détails)

## 🔧 Personnalisation

### Modifier les templates d'emails

Tous les templates sont dans `/lib/email.ts`. Vous pouvez personnaliser :

- Les couleurs
- Le logo
- Les textes
- Les versets coraniques
- Les liens

Exemple pour changer la couleur :

```typescript
// Dans lib/email.ts, ligne ~61
style="background: linear-gradient(135deg, #059669 0%, #047857 100%);"
// Remplacez #059669 par votre couleur
```

### Ajouter un nouveau type d'email

1. Créez une nouvelle fonction dans `/lib/email.ts` :

```typescript
export async function sendPrayerTimeUpdateEmail(
  to: string,
  firstName: string,
  prayerName: string,
  newTime: string
) {
  const content = `
    <h2 style="color: #059669;">Horaire de prière mis à jour</h2>
    <p>Assalamu alaikum ${firstName},</p>
    <p>L'horaire de <strong>${prayerName}</strong> a été modifié.</p>
    <p>Nouvelle heure : <strong>${newTime}</strong></p>
  `

  return sendEmail({
    to,
    subject: `Modification d'horaire - ${prayerName}`,
    html: getEmailTemplate(content),
  })
}
```

2. Importez et utilisez-la dans votre API route :

```typescript
import { sendPrayerTimeUpdateEmail } from '@/lib/email'

// Dans votre route API
await sendPrayerTimeUpdateEmail(
  user.email,
  user.firstName,
  'Fajr',
  '05:30'
)
```

## 📊 Limites et quotas

### Plan gratuit Resend :
- **3 000 emails/mois**
- **100 emails/jour**
- Support par email

### Estimation pour une mosquée :
- ~100 membres actifs
- ~50 inscriptions/mois
- ~200 emails/mois

➡️ **Le plan gratuit est largement suffisant !**

### Si vous dépassez les limites :

1. **Option 1** : Passer au plan payant (20$/mois pour 50 000 emails)
2. **Option 2** : Optimiser les envois (grouper, désactiver certaines notifications)

## 🐛 Dépannage

### Problème : "RESEND_API_KEY non configurée"

**Solution** : Vérifiez que la variable est bien dans `.env` et redémarrez le serveur.

### Problème : Emails non reçus

1. **Vérifiez les spams** : Les premiers emails peuvent tomber en spam
2. **Vérifiez le domaine** : Si vous utilisez votre domaine, vérifiez qu'il est vérifié dans Resend
3. **Vérifiez les logs** : Regardez si l'email est marqué comme "delivered" dans Resend

### Problème : "Domain not verified"

**Solution** : Complétez la vérification DNS dans Resend Dashboard > Domains

### Problème : Emails en spam

**Solutions** :
1. Vérifiez SPF, DKIM et DMARC (Resend les configure automatiquement)
2. Demandez aux utilisateurs d'ajouter votre adresse aux contacts
3. Améliorez le contenu des emails (moins de liens, plus de texte)

## 🔒 Sécurité

- ⚠️ **NE JAMAIS** commiter la clé API dans Git
- ✅ La clé est dans `.env` qui est dans `.gitignore`
- ✅ Utilisez des clés différentes pour dev/production
- ✅ Régénérez la clé si elle est exposée

## 📝 Support

- **Documentation Resend** : https://resend.com/docs
- **Exemples Next.js** : https://resend.com/docs/send-with-nextjs
- **Support Resend** : support@resend.com

---

**Fait avec ❤️ pour la Mosquée Madretsch**
