# Problème: Les inscriptions aux événements n'apparaissent pas dans le profil

## 📋 Diagnostic

### Symptômes
- L'utilisateur s'inscrit à un événement ✅
- L'inscription est enregistrée dans la base de données ✅
- L'inscription n'apparaît PAS dans `/membre/evenements` ❌
- L'email de confirmation n'est pas reçu ❌

### Causes identifiées

#### 1. **Champs manquants dans la base de données**
Les champs `eventDate`, `eventLocation` et `numberOfParticipants` ne sont PAS stockés lors de l'inscription.

**Fichier**: `/app/api/events/[id]/register/route.ts` (ligne 106-118)

**Avant (problème)**:
```typescript
const registration = await prisma.eventRegistration.create({
  data: {
    eventId,
    eventTitle: event.title,  // ✅ Titre stocké
    // ❌ eventDate NON stocké
    // ❌ eventLocation NON stocké
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    email: validatedData.email,
    phone: validatedData.phone,
    attendees: validatedData.attendees,
    notes: validatedData.notes,
    status,
  },
})
```

**Après (corrigé)**:
```typescript
const registration = await prisma.eventRegistration.create({
  data: {
    eventId,
    eventTitle: event.title,
    eventDate: event.date ? new Date(event.date) : null,       // ✅ Date ajoutée
    eventLocation: event.location || null,                      // ✅ Lieu ajouté
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    email: validatedData.email,
    phone: validatedData.phone,
    attendees: validatedData.attendees,
    notes: validatedData.notes,
    status,
  },
})
```

#### 2. **Filtre dans la page `/membre/evenements`**
La page filtre les inscriptions en vérifiant si `eventDate` existe. Comme il était `null`, TOUTES les inscriptions étaient filtrées.

**Fichier**: `/app/membre/evenements/page.tsx` (ligne 31-34)

```typescript
const upcomingEvents = registrations.filter(r => {
  if (!r.eventDate) return false  // ❌ Toutes les inscriptions sans date sont ignorées
  return new Date(r.eventDate) >= now
})
```

#### 3. **Problème d'email**
L'email de l'utilisateur (`ahmed.elghoudi@gmail.com` avec point) ne correspond PAS à l'email du compte Resend (`ahmedelghoudi@gmail.com` sans point).

**Restriction Resend en mode test**:
> You can only send testing emails to your own email address (ahmedelghoudi@gmail.com)

## 🔧 Solutions appliquées

### ✅ Solution 1: Mise à jour du code API
**Fichier modifié**: `/app/api/events/[id]/register/route.ts`
- Ajout de `eventDate` lors de la création
- Ajout de `eventLocation` lors de la création

### ⏳ Solution 2: Migration de la base de données
**Statut**: ❌ **BLOQUÉ**

**Problème**: Prisma Accelerate ne permet pas d'exécuter les commandes `ALTER TABLE` via `$executeRawUnsafe`.

**Erreur**:
```
Code: 42501
Message: must be owner of table event_registrations
```

**Raison**: Prisma Accelerate utilise un utilisateur avec des permissions limitées pour des raisons de sécurité.

### ✅ Solution 3: Mise à jour du schema Prisma
**Fichier modifié**: `/prisma/schema.prisma`

**Changements**:
```prisma
model EventRegistration {
  id                   String             @id @default(uuid()) @db.Uuid
  userId               String?            @db.Uuid
  eventId              String             // Référence à Sanity
  eventTitle           String
  eventDate            DateTime?          // ✅ NOUVEAU: Date de l'événement
  eventLocation        String?            // ✅ NOUVEAU: Lieu de l'événement
  firstName            String
  lastName             String
  email                String
  phone                String
  attendees            Int                @default(1)
  numberOfParticipants Int?               // ✅ NOUVEAU: Alias pour attendees
  status               RegistrationStatus @default(PENDING)
  notes                String?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user                 User?              @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("event_registrations")
}
```

## 🚨 Action requise: Migration manuelle de la base de données

### Option A: Via l'interface Prisma Accelerate (recommandé)

1. **Se connecter à Prisma Data Platform**
   - Aller sur https://cloud.prisma.io/
   - Se connecter avec votre compte

2. **Accéder à votre projet**
   - Sélectionner le projet `mosquee-madretsch`
   - Aller dans "Database" → "Console"

3. **Exécuter les commandes SQL**
   ```sql
   ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP;
   ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "eventLocation" TEXT;
   ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "numberOfParticipants" INTEGER;
   ```

4. **Vérifier**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'event_registrations';
   ```

### Option B: Accès direct à la base de données

Si vous avez une chaîne de connexion directe PostgreSQL (sans Prisma Accelerate):

1. Créer un fichier `.env.direct` avec l'URL de connexion directe:
   ```
   DATABASE_URL_DIRECT="postgresql://user:password@host:port/database"
   ```

2. Exécuter la migration:
   ```bash
   psql "$DATABASE_URL_DIRECT" -f /tmp/add_event_fields.sql
   ```

### Option C: Reset complet (⚠️ PERTE DE DONNÉES)

**ATTENTION**: Cette option supprime TOUTES les données de la base.

```bash
npx prisma migrate reset
npx prisma migrate dev
```

## 📝 Mise à jour des inscriptions existantes

Une fois que les colonnes sont ajoutées à la base de données, exécutez ce script pour remplir les données manquantes:

```bash
npx tsx scripts/update-event-registrations.ts
```

**Contenu du script** (`scripts/update-event-registrations.ts`):
```typescript
import { prisma } from '../lib/prisma'
import { getEventById } from '../lib/directus'

async function updateExistingRegistrations() {
  console.log('🔄 Mise à jour des inscriptions existantes...\n')

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      OR: [
        { eventDate: null },
        { eventLocation: null }
      ]
    }
  })

  console.log(`Trouvé ${registrations.length} inscriptions à mettre à jour\n`)

  for (const registration of registrations) {
    try {
      const event = await getEventById(registration.eventId)

      if (event) {
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            eventDate: event.date ? new Date(event.date) : null,
            eventLocation: event.location || null,
            numberOfParticipants: registration.attendees
          }
        })
        console.log(`✅ ${registration.eventTitle} - ${event.date}`)
      } else {
        console.log(`⚠️  Événement non trouvé: ${registration.eventId}`)
      }
    } catch (error: any) {
      console.error(`❌ Erreur pour ${registration.id}:`, error.message)
    }
  }

  console.log(`\n✅ Mise à jour terminée !`)
  await prisma.$disconnect()
}

updateExistingRegistrations()
```

## 🔍 Vérification

### 1. Vérifier que les colonnes existent
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;
```

### 2. Vérifier les données
```typescript
import { prisma } from './lib/prisma'

const registrations = await prisma.eventRegistration.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' }
})

console.log(registrations)
```

### 3. Tester une nouvelle inscription
1. Aller sur `/evenements`
2. S'inscrire à un événement
3. Vérifier `/membre/evenements` → l'événement doit apparaître ✅

## 📧 Problème d'email séparé

### Cause
L'adresse email de test (`ahmed.elghoudi@gmail.com`) ≠ email du compte Resend (`ahmedelghoudi@gmail.com`).

### Solutions

**Option 1: Utiliser l'email sans point pour les tests**
Lors de l'inscription, utiliser `ahmedelghoudi@gmail.com` (sans le point).

**Option 2: Vérifier le domaine sur Resend** (production)
1. Aller sur https://resend.com/domains
2. Ajouter le domaine `mosquee-madretsch.ch`
3. Configurer les enregistrements DNS (SPF, DKIM, DMARC)
4. Changer `EMAIL_FROM` dans `.env`:
   ```
   EMAIL_FROM=noreply@mosquee-madretsch.ch
   ```

Une fois le domaine vérifié, les emails pourront être envoyés à n'importe quelle adresse.

## ✅ État actuel

- [x] Code API corrigé pour stocker `eventDate` et `eventLocation`
- [x] Schema Prisma mis à jour
- [x] Client Prisma régénéré
- [ ] **Migration de la base de données** (⚠️ ACTION REQUISE)
- [ ] **Script de mise à jour des données existantes** (après migration)
- [ ] Vérification domaine email pour la production

## 📚 Documentation connexe

- `VERIFICATION_ESPACE_MEMBRE.md` - Vérification complète de l'espace membre
- `EMAIL_CONFIGURATION.md` - Configuration des emails avec Resend
- `RESEND_QUICKSTART.md` - Guide rapide Resend

---

**Date de création**: 1er décembre 2025
**Dernière mise à jour**: 1er décembre 2025
**Statut**: ⚠️ Migration en attente
