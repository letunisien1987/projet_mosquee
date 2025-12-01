# ⚡ À FAIRE MAINTENANT - 5 minutes

## 🎯 Problème
Vos inscriptions aux événements sont enregistrées MAIS n'apparaissent pas dans votre profil.

## ✅ Ce qui a été corrigé
- ✅ Code de l'API d'inscription
- ✅ Système d'emails avec Resend
- ✅ Schema de la base de données (Prisma)

## ⚠️ CE QU'IL VOUS RESTE À FAIRE

### Étape 1: Migration SQL (2 minutes)

**Allez ici**: https://cloud.prisma.io/

1. Connectez-vous
2. Sélectionnez votre projet
3. Cliquez sur **Database** → **Console**
4. **Copiez-collez** ce code:

```sql
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "eventLocation" TEXT,
ADD COLUMN IF NOT EXISTS "numberOfParticipants" INTEGER;

UPDATE event_registrations
SET "numberOfParticipants" = attendees
WHERE "numberOfParticipants" IS NULL;
```

5. Cliquez sur **Execute** ou **Run**

### Étape 2: Mise à jour des données (1 minute)

Dans votre terminal:

```bash
cd /Users/elghoudi/mosquee
npx tsx scripts/update-event-registrations.ts
```

Ce script va remplir les dates et lieux pour vos 5 inscriptions existantes.

### Étape 3: Test (1 minute)

1. Allez sur http://localhost:3000/evenements
2. Inscrivez-vous à un événement
3. Allez sur http://localhost:3000/membre/evenements
4. **Vous devez voir vos événements** ✅

## 📧 Pour recevoir les emails

### Option temporaire (tests)
Lors de l'inscription, utilisez l'email **SANS point**:
```
ahmedelghoudi@gmail.com
```

### Option permanente (production)
1. Allez sur https://resend.com/domains
2. Ajoutez le domaine `mosquee-madretsch.ch`
3. Configurez le DNS
4. Changez `EMAIL_FROM` dans `.env`

---

## 🆘 Si ça ne marche pas

**Problème 1**: Vous ne pouvez pas accéder à Prisma Cloud
→ Donnez-moi l'accès à votre base de données PostgreSQL directe

**Problème 2**: Le script ne trouve pas Directus
→ Vérifiez que Directus tourne: http://localhost:8055

**Problème 3**: Les événements n'apparaissent toujours pas
→ Lisez `PROBLEME_INSCRIPTIONS_EVENEMENTS.md` pour le diagnostic complet

---

## 📚 Documentation créée

1. **A_FAIRE_MAINTENANT.md** ← Vous êtes ici
2. **SOLUTION_RAPIDE_INSCRIPTIONS.md** - Guide détaillé
3. **RESUME_FINAL.md** - Récapitulatif complet
4. **PROBLEME_INSCRIPTIONS_EVENEMENTS.md** - Diagnostic technique

**Script SQL**: `migration-event-registrations.sql`
**Script de mise à jour**: `scripts/update-event-registrations.ts`

---

**TEMPS TOTAL**: 5 minutes ⚡

**C'est tout !** Après ces 3 étapes, tout fonctionnera.
