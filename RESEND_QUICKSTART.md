# 🚀 Démarrage Rapide - Notifications Email avec Resend

## ✅ Ce qui a été installé

Le système de notifications par email est **déjà installé** et **prêt à fonctionner** !

Il vous reste juste à configurer votre clé API Resend (gratuit, 5 minutes).

## 📝 Étapes rapides

### 1. Créer un compte Resend (2 minutes)

1. Allez sur https://resend.com
2. Cliquez sur **"Sign Up"**
3. Inscrivez-vous avec votre email
4. Vérifiez votre email

### 2. Obtenir votre clé API (1 minute)

1. Connectez-vous à https://resend.com
2. Allez dans **"API Keys"** (menu de gauche)
3. Cliquez sur **"Create API Key"**
4. Nommez-la : `Mosquee Production`
5. Cliquez sur **"Add"**
6. **Copiez** la clé qui commence par `re_...`

Exemple de clé : `re_jivGKkGf_JgYFaXVvREozMumZNpcSntn3`

### 3. Ajouter la clé dans votre .env (30 secondes)

Éditez le fichier `.env` à la racine du projet et ajoutez votre clé :

```bash
RESEND_API_KEY=re_votre_cle_ici
```

Remplacez `re_votre_cle_ici` par votre vraie clé.

### 4. Redémarrer le serveur (10 secondes)

```bash
# Dans le terminal, arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

## ✨ C'est tout ! Les emails fonctionnent maintenant

Les emails seront envoyés automatiquement pour :

- ✅ **Inscription** : Email de bienvenue au nouvel utilisateur
- ✅ **Activités** : Confirmation d'inscription à un cours
- ✅ **Événements** : Confirmation d'inscription à un événement
- ✅ **Dons** : Remerciement et reçu

## 🧪 Tester

1. Créez un nouveau compte sur votre site
2. Vérifiez votre boîte email
3. Vous devriez recevoir un email de bienvenue !

## ⚠️ Important

### Si vous n'ajoutez pas la clé API :

Les emails **ne seront pas envoyés**, mais l'application fonctionnera normalement.

Vous verrez ce message dans les logs :

```
⚠️  RESEND_API_KEY non configurée - Email non envoyé
```

### Domaine d'envoi

Par défaut, les emails viendront de `onboarding@resend.dev`.

Pour utiliser votre propre domaine (ex: `noreply@mosquee-madretsch.ch`), consultez le guide complet dans `EMAIL_CONFIGURATION.md`.

## 📚 Documentation complète

Pour plus de détails (configuration du domaine, personnalisation des templates, etc.) :

👉 **Voir `EMAIL_CONFIGURATION.md`**

## 💰 Coût

**Gratuit** : 3 000 emails/mois (largement suffisant pour une mosquée)

Aucune carte bancaire requise.

---

**Questions ?** Consultez https://resend.com/docs
