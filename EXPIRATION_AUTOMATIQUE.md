# Expiration automatique des cotisations

## Fonctionnement

Le système expire automatiquement les cotisations périmées tous les jours à **2h du matin**.

Quand une cotisation expire :
- Son statut passe de `ACTIVE` → `EXPIRED`
- Le membre redevient un **"membre normal"** (sans cotisation active)
- Il devra faire une nouvelle demande d'adhésion et payer pour redevenir ACTIF ou PASSIF

## Configuration

### 1. Variable d'environnement

Ajoutez dans votre fichier `.env.local` :

```bash
CRON_SECRET=votre_secret_tres_securise_ici
```

**Important** : Utilisez une valeur aléatoire et sécurisée (par exemple, un UUID).

### 2. Déploiement sur Vercel

Le fichier `vercel.json` est déjà configuré pour exécuter le cron job automatiquement.

Vercel appellera automatiquement `/api/cron/expire-memberships` tous les jours à 2h du matin (UTC).

**Dans le dashboard Vercel** :
1. Allez dans Settings → Environment Variables
2. Ajoutez `CRON_SECRET` avec la même valeur que votre `.env.local`

### 3. Test manuel

Pour tester manuellement l'expiration des cotisations :

```bash
curl -X GET http://localhost:3000/api/cron/expire-memberships \
  -H "Authorization: Bearer votre_secret_tres_securise_ici"
```

Ou en production :
```bash
curl -X GET https://votre-domaine.com/api/cron/expire-memberships \
  -H "Authorization: Bearer votre_secret_tres_securise_ici"
```

### 4. Logs

Le cron job affiche des logs détaillés :
- Nombre de cotisations expirées
- Email et type de chaque cotisation expirée
- Date de fin de chaque cotisation

## Exemple de réponse

```json
{
  "success": true,
  "message": "2 cotisation(s) expirée(s)",
  "expired": 2,
  "memberships": [
    {
      "email": "membre@example.com",
      "type": "ACTIF",
      "endDate": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

## Horaire du cron

Le cron s'exécute selon le calendrier suivant :
- **Fréquence** : Tous les jours
- **Heure** : 2h00 du matin (UTC)
- **Format cron** : `0 2 * * *`

Pour changer l'heure, modifiez le fichier `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-memberships",
      "schedule": "0 2 * * *"  // Modifier ici
    }
  ]
}
```

## Calendrier des expirations

Le système vérifie automatiquement si `endDate < date actuelle` et expire les cotisations concernées.

**Exemple** :
- Cotisation valide jusqu'au 01/12/2024
- Le cron s'exécute le 02/12/2024 à 2h
- → La cotisation est automatiquement expirée
- → Le membre devient "membre normal"
