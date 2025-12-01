# Guide d'Installation Directus - Serveur Séparé

Ce guide vous explique comment installer Directus sur un serveur séparé pour votre projet de mosquée.

## Option 1 : Installation avec Docker (Recommandé)

### Prérequis
- Docker et Docker Compose installés
- Serveur avec au moins 1GB RAM
- PostgreSQL accessible

### 1. Créer un dossier pour Directus

```bash
mkdir directus-mosquee
cd directus-mosquee
```

### 2. Créer un fichier `docker-compose.yml`

```yaml
version: '3'
services:
  database:
    image: postgis/postgis:13-master
    volumes:
      - ./data/database:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: 'directus'
      POSTGRES_PASSWORD: 'directus'
      POSTGRES_DB: 'directus'
    ports:
      - "5432:5432"

  cache:
    image: redis:6

  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
    depends_on:
      - cache
      - database
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'

      DB_CLIENT: 'pg'
      DB_HOST: 'database'
      DB_PORT: '5432'
      DB_DATABASE: 'directus'
      DB_USER: 'directus'
      DB_PASSWORD: 'directus'

      CACHE_ENABLED: 'true'
      CACHE_STORE: 'redis'
      CACHE_REDIS: 'redis://cache:6379'

      ADMIN_EMAIL: 'admin@mosquee.ch'
      ADMIN_PASSWORD: 'changeme123'

      # CORS pour Next.js
      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'http://localhost:3000,https://votre-domaine.ch'

      # Public URL
      PUBLIC_URL: 'http://localhost:8055'
```

### 3. Démarrer Directus

```bash
docker-compose up -d
```

### 4. Accéder à Directus

Ouvrez votre navigateur : `http://localhost:8055` ou `http://votre-ip-serveur:8055`

**Identifiants par défaut :**
- Email : `admin@mosquee.ch`
- Mot de passe : `changeme123`

⚠️ **IMPORTANT : Changez ces identifiants immédiatement après la première connexion !**

---

## Option 2 : Installation Manuelle (Sans Docker)

### Prérequis
- Node.js 18+ installé
- PostgreSQL installé et configuré
- npm ou pnpm

### 1. Installer Directus globalement

```bash
npm install -g directus
```

### 2. Créer un projet Directus

```bash
mkdir directus-mosquee
cd directus-mosquee
npm init -y
npm install directus
```

### 3. Créer un fichier `.env`

```env
PORT=8055
PUBLIC_URL="http://localhost:8055"

DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="directus"
DB_USER="directus"
DB_PASSWORD="votre_mot_de_passe"

KEY="255d861b-5ea1-5996-9aa3-922530ec40b1"
SECRET="6116487b-cda1-52c2-b5b5-c8022c45e263"

ADMIN_EMAIL="admin@mosquee.ch"
ADMIN_PASSWORD="changeme123"

CORS_ENABLED="true"
CORS_ORIGIN="http://localhost:3000"
```

### 4. Initialiser Directus

```bash
npx directus bootstrap
```

### 5. Démarrer Directus

```bash
npx directus start
```

---

## Option 3 : Directus Cloud (Service Managé)

Si vous préférez ne pas gérer le serveur vous-même :

1. Allez sur https://directus.cloud
2. Créez un compte
3. Créez un nouveau projet
4. Notez l'URL et le token d'accès

**Avantages :**
- Pas de gestion serveur
- Backups automatiques
- Scalabilité automatique

**Inconvénients :**
- Payant (à partir de $15/mois)

---

## Configuration Post-Installation

### 1. Créer un utilisateur API

Dans Directus Admin :
1. Allez dans **Settings → Access Tokens**
2. Créez un nouveau token avec permissions complètes
3. **Copiez le token** (vous ne pourrez plus le voir après)

### 2. Configurer CORS

Dans **Settings → Project Settings → Security** :
- Activez CORS
- Ajoutez vos domaines autorisés :
  - `http://localhost:3000` (développement)
  - `https://votre-domaine.ch` (production)

### 3. Variables d'environnement pour Next.js

Ajoutez dans votre fichier `.env` :

```env
DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="votre_token_api_ici"
```

---

## Vérification de l'Installation

### Test de connexion

```bash
curl http://localhost:8055/server/ping
```

Réponse attendue : `pong`

### Test API

```bash
curl http://localhost:8055/items/
```

Vous devriez voir une liste vide de collections.

---

## Prochaines Étapes

Une fois Directus installé et accessible :

1. ✅ Notez votre `DIRECTUS_URL` et `DIRECTUS_TOKEN`
2. ✅ Revenez à Claude pour continuer la migration
3. ✅ Nous allons créer les collections (événements, activités, etc.)
4. ✅ Puis migrer les données depuis Sanity

---

## Dépannage

### Problème : Cannot connect to database

Vérifiez que PostgreSQL est démarré :
```bash
sudo systemctl status postgresql
```

### Problème : Port 8055 already in use

Changez le port dans `.env` :
```env
PORT=8056
```

### Problème : CORS errors

Ajoutez votre domaine dans CORS_ORIGIN avec des virgules :
```env
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

---

**Besoin d'aide ?** Contactez Claude avec le message d'erreur exact.
