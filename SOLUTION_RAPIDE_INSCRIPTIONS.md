# ⚡ Solution Rapide - Inscriptions aux événements

## 🎯 Problème
Les inscriptions aux événements ne s'affichent pas dans `/membre/evenements`.

## ✅ Corrections déjà appliquées
- ✅ Code API mis à jour (`/app/api/events/[id]/register/route.ts`)
- ✅ Schema Prisma mis à jour (`prisma/schema.prisma`)
- ✅ Client Prisma régénéré

## 📋 Étapes à suivre

### Étape 1: Appliquer la migration SQL

Vous devez ajouter 3 colonnes à la table `event_registrations`.

**Option A: Via Prisma Data Platform (Recommandé)**

1. Allez sur: https://cloud.prisma.io/
2. Connectez-vous et sélectionnez votre projet
3. Allez dans **Database** → **Console**
4. Copiez-collez ces commandes:

```sql
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "eventLocation" TEXT,
ADD COLUMN IF NOT EXISTS "numberOfParticipants" INTEGER;

UPDATE event_registrations
SET "numberOfParticipants" = attendees
WHERE "numberOfParticipants" IS NULL;
```

5. Cliquez sur **Run**

**Option B: Via fichier SQL (si vous avez accès direct)**

```bash
psql "$DATABASE_URL_DIRECT" -f migration-event-registrations.sql
```

### Étape 2: Remplir les données manquantes

Une fois la migration appliquée, exécutez:

```bash
npx tsx scripts/update-event-registrations.ts
```

Ce script va récupérer les informations des événements depuis Directus et remplir les champs `eventDate` et `eventLocation` pour toutes les inscriptions existantes.

### Étape 3: Vérifier

1. Allez sur http://localhost:3000/evenements
2. Inscrivez-vous à un événement
3. Allez sur http://localhost:3000/membre/evenements
4. Vous devriez voir votre inscription ✅

## 📧 Problème d'email séparé

### Pourquoi les emails ne sont pas reçus?

Votre email (`ahmed.elghoudi@gmail.com` avec point) ≠ Email du compte Resend (`ahmedelghoudi@gmail.com` sans point).

### Solution temporaire (Tests)

Lors de l'inscription aux événements, utilisez l'email **sans le point**:
```
ahmedelghoudi@gmail.com
```

### Solution permanente (Production)

1. Allez sur https://resend.com/domains
2. Cliquez sur **Add Domain**
3. Entrez: `mosquee-madretsch.ch`
4. Configurez les enregistrements DNS fournis par Resend:
   - SPF (TXT)
   - DKIM (TXT)
   - DMARC (TXT)
5. Une fois vérifié, modifiez `.env`:
   ```
   EMAIL_FROM=noreply@mosquee-madretsch.ch
   ```

Après cela, les emails pourront être envoyés à n'importe quelle adresse.

## 🔍 Vérification rapide

### Vérifier que la migration a fonctionné:

```bash
npx tsx -e "
import { prisma } from './lib/prisma.ts'
const reg = await prisma.eventRegistration.findFirst({ orderBy: { createdAt: 'desc' } })
console.log(reg)
await prisma.\$disconnect()
"
```

Si vous voyez `eventDate`, `eventLocation` et `numberOfParticipants` dans la sortie, c'est bon ✅

### Vérifier les inscriptions dans le profil:

```bash
curl -s http://localhost:3000/membre/evenements
```

Si la page charge sans erreur, c'est bon ✅

## 📚 Documents de référence

- `PROBLEME_INSCRIPTIONS_EVENEMENTS.md` - Diagnostic complet
- `migration-event-registrations.sql` - Script SQL
- `scripts/update-event-registrations.ts` - Script de mise à jour

## ⏱️ Temps estimé

- Migration SQL: **30 secondes**
- Script de mise à jour: **~2 minutes** (selon le nombre d'inscriptions)
- Tests: **2 minutes**

**Total**: ~5 minutes ⚡

---

**Date**: 1er décembre 2025
**Statut**: ⚠️ En attente de migration SQL
