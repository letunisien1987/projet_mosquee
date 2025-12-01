# 📋 Guide: Ajouter un Responsable aux Événements et Activités

**Date**: 1er décembre 2025
**Objectif**: Ajouter un champ "responsable" (membre ou admin) pour chaque événement et activité

---

## 🎯 Besoin

Chaque événement et activité doit avoir un **responsable** qui va:
- Gérer les inscriptions
- Répondre aux emails des participants
- Approuver/refuser les demandes
- Suivre l'événement/activité

**Pour les anciens événements/activités**: Mettre l'admin par défaut
**Pour les nouveaux**: Choisir un membre ou admin comme responsable

---

## 📝 Étapes à Suivre dans Directus

### Étape 1: Se Connecter à Directus

1. Ouvrez http://localhost:8055
2. Connectez-vous avec vos identifiants admin

### Étape 2: Ajouter le Champ "Responsable" aux Événements

#### 2.1. Aller dans Data Model

1. Dans le menu latéral, cliquez sur **Settings** (⚙️)
2. Cliquez sur **Data Model**
3. Trouvez la collection **events**
4. Cliquez dessus pour l'ouvrir

#### 2.2. Créer le Champ "responsable_id"

1. Cliquez sur **"+ Create Field"** (en haut à droite)
2. Choisissez le type: **"UUID"**
3. Configurez le champ:
   - **Field Name**: `responsable_id`
   - **Display Label**: `Responsable`
   - **Note**: `Membre ou admin responsable de cet événement`

4. Dans l'onglet **Schema**:
   - ✅ Cochez **"Nullable"** (pour permettre null temporairement)
   - ❌ Ne cochez PAS "Unique"
   - ❌ Ne cochez PAS "Primary Key"

5. Dans l'onglet **Interface**:
   - Choisissez: **"Select Dropdown"** ou **"User"** (si Directus le propose)
   - Si vous choisissez "Select Dropdown":
     - Template: `{{first_name}} {{last_name}} ({{email}})`
     - Related Collection: `directus_users`

6. Cliquez sur **"Save"** (💾)

#### 2.3. Créer une Relation avec directus_users (Optionnel mais Recommandé)

Si Directus ne l'a pas créé automatiquement:

1. Retournez dans la collection **events**
2. Cliquez sur **"+ Create Field"**
3. Choisissez **"Many to One (M2O)"**
4. Configurez:
   - **Field Name**: `responsable`
   - **Related Collection**: `directus_users`
   - **Display Template**: `{{first_name}} {{last_name}}`

5. Cliquez sur **"Save"**

### Étape 3: Ajouter le Champ "Responsable" aux Activités

Répétez exactement les mêmes étapes pour la collection **activities**:

1. **Settings** → **Data Model** → **activities**
2. **"+ Create Field"** → **UUID** ou **Many to One**
3. **Field Name**: `responsable_id` ou `responsable`
4. **Related Collection**: `directus_users`
5. **Save**

---

## 🔧 Mettre à Jour les Anciens Événements/Activités

### Option 1: Via l'Interface Directus (Recommandé)

1. Allez dans **Content** → **Events**
2. Pour chaque événement:
   - Cliquez sur la ligne
   - Sélectionnez le **Responsable** (par défaut: admin)
   - Cliquez sur **Save**

3. Répétez pour **Content** → **Activities**

### Option 2: Via un Script SQL (Plus Rapide)

Si vous avez beaucoup d'événements/activités, créez un script:

```sql
-- Récupérer l'ID de l'admin
-- Remplacez 'admin@mosquee.com' par l'email de votre admin
SELECT id FROM directus_users WHERE email = 'admin@mosquee.com';

-- Mettre à jour tous les événements sans responsable
UPDATE events
SET responsable_id = '[ID_ADMIN_ICI]'
WHERE responsable_id IS NULL;

-- Mettre à jour toutes les activités sans responsable
UPDATE activities
SET responsable_id = '[ID_ADMIN_ICI]'
WHERE responsable_id IS NULL;
```

---

## 📊 Modifier le Code Next.js

### Fichier 1: Modifier l'API des Événements

**Fichier**: `app/api/events/route.ts` (ou similaire)

```typescript
// Ajouter le champ responsable dans la requête
const response = await fetch(`${DIRECTUS_URL}/items/events?fields=*,responsable.id,responsable.first_name,responsable.last_name,responsable.email`)

// Dans le type TypeScript
interface Event {
  id: string
  title: string
  // ... autres champs
  responsable?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}
```

### Fichier 2: Modifier l'API des Activités

**Fichier**: `app/api/activities/route.ts` (ou similaire)

```typescript
// Ajouter le champ responsable
const response = await fetch(`${DIRECTUS_URL}/items/activities?fields=*,responsable.id,responsable.first_name,responsable.last_name,responsable.email`)

// Dans le type TypeScript
interface Activity {
  id: string
  title: string
  // ... autres champs
  responsable?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}
```

### Fichier 3: Page Admin Événements

**Fichier**: `app/admin/evenements/page.tsx`

Ajouter une colonne "Responsable":

```tsx
// Dans le tableau
<th>Responsable</th>

// Dans les données
<td>
  {event.responsable ? (
    <div>
      {event.responsable.first_name} {event.responsable.last_name}
      <div className="text-xs text-gray-500">{event.responsable.email}</div>
    </div>
  ) : (
    <span className="text-gray-400">Non assigné</span>
  )}
</td>
```

### Fichier 4: Page Admin Activités

**Fichier**: `app/admin/inscriptions/page.tsx` (ou activités)

Même modification que pour les événements.

---

## 🔐 Filtrer par Responsable

### Permettre à chaque responsable de voir uniquement SES événements/activités

**Fichier**: `app/api/admin/event-registrations/route.ts`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const userId = session.user.id
  const isAdmin = ['ADMIN', 'IMAM'].includes(session.user.role)

  // Récupérer les événements
  let eventsFilter = ''
  if (!isAdmin) {
    // Si pas admin, voir uniquement les événements dont il est responsable
    eventsFilter = `&filter[responsable_id][_eq]=${userId}`
  }

  const eventsResponse = await fetch(
    `${DIRECTUS_URL}/items/events?fields=*,responsable.*${eventsFilter}`
  )

  // Récupérer les inscriptions pour ces événements
  const events = await eventsResponse.json()
  const eventIds = events.data.map((e: any) => e.id)

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId: { in: eventIds }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json(registrations)
}
```

---

## 📧 Envoyer les Emails au Responsable

### Modifier l'envoi d'email pour notifier le responsable

**Fichier**: `app/api/events/[id]/register/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // ... code existant pour l'inscription

  // Récupérer l'événement avec le responsable
  const eventResponse = await fetch(
    `${DIRECTUS_URL}/items/events/${eventId}?fields=*,responsable.*`
  )
  const event = await eventResponse.json()

  // Envoyer email de confirmation au participant
  await sendEventRegistrationEmail(
    email,
    firstName,
    event.data.title,
    // ... autres paramètres
  )

  // NOUVEAU: Envoyer email au responsable
  if (event.data.responsable?.email) {
    await sendEmailToResponsable(
      event.data.responsable.email,
      event.data.responsable.first_name,
      event.data.title,
      `${firstName} ${lastName}`,
      email
    )
  }

  return NextResponse.json({ success: true })
}
```

### Créer la fonction d'email au responsable

**Fichier**: `lib/email.ts`

```typescript
export async function sendEmailToResponsable(
  responsableEmail: string,
  responsableName: string,
  eventTitle: string,
  participantName: string,
  participantEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mosquée Madretsch</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Nouvelle inscription à votre événement</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #374151; margin: 0 0 20px 0;">Assalamu alaikum ${responsableName},</p>

                  <p style="color: #374151; line-height: 1.6;">
                    Une nouvelle personne s'est inscrite à l'événement <strong>${eventTitle}</strong> dont vous êtes responsable.
                  </p>

                  <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #059669;">Détails du participant</h3>
                    <p style="margin: 5px 0;"><strong>Nom:</strong> ${participantName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${participantEmail}</p>
                  </div>

                  <p style="color: #374151; line-height: 1.6;">
                    Vous pouvez gérer les inscriptions depuis votre espace admin.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/admin/evenements"
                       style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Voir les inscriptions
                    </a>
                  </div>

                  <p style="color: #374151; margin: 30px 0 0 0;">
                    Barakallahou fikoum,<br>
                    L'équipe de la Mosquée Madretsch
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    Mosquée Madretsch<br>
                    Rue Centrale 49, 2503 Bienne<br>
                    <a href="mailto:info@mosquee-madretsch.ch" style="color: #059669; text-decoration: none;">info@mosquee-madretsch.ch</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return await sendEmail({
    to: responsableEmail,
    subject: `Nouvelle inscription - ${eventTitle}`,
    html
  })
}
```

---

## 🎨 Interface Directus: Afficher le Responsable

Dans Directus, pour chaque événement/activité, vous verrez maintenant un champ **"Responsable"** avec un menu déroulant listant tous les utilisateurs (admins et membres).

---

## ✅ Checklist de Mise en Place

- [ ] **Directus**: Ajouter le champ `responsable` à la collection `events`
- [ ] **Directus**: Ajouter le champ `responsable` à la collection `activities`
- [ ] **Directus**: Mettre à jour tous les événements existants avec l'admin comme responsable
- [ ] **Directus**: Mettre à jour toutes les activités existantes avec l'admin comme responsable
- [ ] **Code**: Modifier les APIs pour inclure le responsable
- [ ] **Code**: Ajouter la colonne "Responsable" dans les pages admin
- [ ] **Code**: Filtrer les événements/activités par responsable (si non-admin)
- [ ] **Code**: Envoyer email au responsable lors d'une nouvelle inscription
- [ ] **Test**: Créer un nouvel événement et assigner un responsable
- [ ] **Test**: Vérifier que le responsable reçoit l'email lors d'une inscription
- [ ] **Test**: Vérifier que le responsable voit uniquement SES événements/activités

---

## 📝 Exemple de Workflow

### Scénario: Création d'un Nouvel Événement

1. **Admin crée l'événement dans Directus**
   - Titre: "Conférence sur le Ramadan"
   - Date: 15 mars 2025
   - **Responsable**: Sélectionne "Ahmed El Ghoudi" (un membre)

2. **Un participant s'inscrit via le site**
   - Le participant remplit le formulaire sur `/evenements`
   - Clique sur "S'inscrire"

3. **Emails envoyés automatiquement**
   - ✅ Email de confirmation au participant
   - ✅ **Email à Ahmed El Ghoudi** (le responsable) pour le notifier

4. **Ahmed se connecte à l'admin**
   - Va sur `/admin/evenements`
   - Voit UNIQUEMENT "Conférence sur le Ramadan" (son événement)
   - Peut gérer les inscriptions, répondre aux participants, etc.

5. **L'admin voit TOUS les événements**
   - L'admin peut voir tous les événements de tous les responsables

---

## 🔒 Sécurité et Permissions

### Qui Peut Faire Quoi?

| Rôle | Voir Tous les Événements | Voir Ses Événements | Créer Événement | Modifier Événement | Gérer Inscriptions |
|------|--------------------------|---------------------|-----------------|--------------------|--------------------|
| **ADMIN** | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| **IMAM** | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| **STAFF** | ❌ Non | ✅ Oui | ❌ Non | ⚠️ Ses événements uniquement | ⚠️ Ses événements uniquement |
| **MEMBER** | ❌ Non | ✅ Oui | ❌ Non | ⚠️ Ses événements uniquement | ⚠️ Ses événements uniquement |

---

## 🚀 Prochaines Étapes

1. **Ajouter les champs dans Directus** (15 minutes)
2. **Mettre à jour les événements/activités existants** (5 minutes)
3. **Modifier le code Next.js** pour afficher le responsable (30 minutes)
4. **Ajouter le filtre par responsable** (20 minutes)
5. **Créer la fonction d'email au responsable** (20 minutes)
6. **Tester** (15 minutes)

**Temps total estimé**: ~2 heures

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025

Pour toute question, n'hésitez pas à demander!
