# RAPPORT D'INCOHERENCES - Projet Mosquee

> Analyse du 3 Decembre 2025
> **MISE A JOUR: Corrections appliquees le 3 Decembre 2025**

---

## RESUME EXECUTIF

| Categorie | Nombre | Statut |
|-----------|--------|--------|
| Duplications Directus/Prisma | 2 | CORRIGE |
| Statuts confus | 2 | CORRIGE |
| Enums inutilises | 2 | CORRIGE |
| Champs redondants | 2 | PARTIELLEMENT CORRIGE |
| Valeurs par defaut incoherentes | 1 | CORRIGE |
| Code legacy non nettoye | 2 | CORRIGE |

---

## 1. DUPLICATIONS DIRECTUS / PRISMA (CRITIQUE)

### 1.1 Notifications dupliquees

**Probleme**: `notifications` existe dans les DEUX systemes

**Directus** (`http://localhost:8055`):
```
- id: integer
- user_id: uuid
- type: string
- title: string
- message: text
- link: string
- read: boolean
```

**Prisma** (`prisma/schema.prisma` ligne 509):
```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType // Enum avec 26 types!
  title     String
  message   String
  link      String?
  read      Boolean          @default(false)
  emailSent Boolean          @default(false)
  createdAt DateTime         @default(now())
}
```

**Consequence**:
- Confusion sur quelle source utiliser
- Risque de donnees desynchronisees
- Le code utilise Prisma (verifie dans les APIs)

**Recommandation**: Supprimer la collection `notifications` de Directus

---

### 1.2 UserProfiles dupliques

**Directus** (`user_profiles`):
```
- city, postal_code, country
- date_of_birth, profile_picture, bio
- preferred_language
- notification_email, notification_sms, newsletter
```

**Prisma** (`UserProfile` ligne 487):
```prisma
model UserProfile {
  city, postalCode, country
  dateOfBirth, profilePicture, bio
  preferredLanguage
  notificationEmail, notificationSms, newsletter
}
```

**Consequence**: Memes champs, deux endroits

**Recommandation**: Supprimer `user_profiles` de Directus

---

## 2. STATUTS DE PAIEMENT CONFUS (MOYENNE)

### 2.1 PaymentStatus: PAID vs COMPLETED

**Fichier**: `prisma/schema.prisma` ligne 75

```prisma
enum PaymentStatus {
  PENDING
  PAID       // <-- Qu'est-ce que ca veut dire?
  COMPLETED  // <-- Quelle difference?
  FAILED
  REFUNDED
  CANCELLED
}
```

**Utilisation dans le code**:
- `webhook/route.ts:493` → utilise `PAID` pour Membership.paymentStatus
- `webhook/route.ts:130,269,526` → utilise `COMPLETED` pour Payment.status

**Probleme**: Pas de definition claire de la difference

**Recommandation**:
- `PAID` = Paiement recu de Stripe
- `COMPLETED` = Traitement termine (email envoye, etc.)
- **Documenter clairement ou fusionner en un seul**

---

### 2.2 MembershipType: Ancien vs Nouveau systeme

**Fichier**: `prisma/schema.prisma` ligne 22

```prisma
enum MembershipType {
  ACTIF       // NOUVEAU: Membre actif avec droit de vote
  PASSIF      // NOUVEAU: Membre passif sans droit de vote
  INDIVIDUAL  // ANCIEN: membre individuel
  FAMILY      // ANCIEN: membre famille
  STUDENT     // ANCIEN: etudiant
  SENIOR      // ANCIEN: senior
}
```

**Probleme**:
- Melange de deux systemes de categorisation
- Confusion possible lors de la creation d'adhesions

**Recommandation**:
- Migrer toutes les donnees vers ACTIF/PASSIF
- Supprimer INDIVIDUAL, FAMILY, STUDENT, SENIOR
- Creer un script de migration

---

## 3. CHAMPS REDONDANTS (MOYENNE)

### 3.1 activityId vs activityIdOld

**Fichier**: `prisma/schema.prisma` ligne 304

```prisma
model Enrollment {
  activityId    String?  // Directus activity reference (String ID)
  activityIdOld String?  // Legacy Directus/Sanity reference
}
```

**Utilisation**:
- `activityId` → utilise partout dans le code actuel
- `activityIdOld` → utilise seulement dans `scripts/create-demo-data.ts`

**Recommandation**:
- Supprimer `activityIdOld` apres verification qu'aucune donnee ne l'utilise

---

### 3.2 attendees vs numberOfAdults/numberOfChildren

**Fichier**: `prisma/schema.prisma` ligne 357

```prisma
model EventRegistration {
  // Nouveaux champs
  numberOfAdults    Int  @default(1)
  numberOfChildren  Int  @default(0)

  // Ancien champ (compatibilite)
  attendees         Int  @default(1)  // REDONDANT!
}
```

**Utilisation dans le code**:
- L'API `/api/event-registrations` accepte toujours `attendees`
- L'API `/api/events/[id]/register` utilise les deux systemes
- Le calcul de capacite utilise `numberOfAdults + numberOfChildren`

**Recommandation**:
- Migrer toutes les API vers `numberOfAdults/numberOfChildren`
- Supprimer le champ `attendees`

---

## 4. VALEURS PAR DEFAUT INCOHERENTES (MOYENNE)

### 4.1 Pays: France vs Suisse

**Le projet est pour une mosquee en SUISSE (Bienne)**

| Fichier | Valeur par defaut |
|---------|-------------------|
| `prisma/schema.prisma:498` | `France` |
| `app/api/auth/register/route.ts:62` | `France` |
| `app/api/membre/profil/route.ts:73` | `France` |
| `scripts/create-member-collections.ts:92` | `France` |
| `app/api/membership/apply/route.ts:26` | `Suisse` |
| `prisma/schema.prisma:259` | `Suisse` |

**Recommandation**:
- Standardiser sur `Suisse`
- Corriger le schema Prisma: `country String? @default("Suisse")`
- Corriger toutes les routes API

---

## 5. ENUMS NON UTILISES (BASSE)

### 5.1 ActivityStatus

**Fichier**: `prisma/schema.prisma` ligne 117

```prisma
enum ActivityStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

**Utilisation**: AUCUNE dans le code principal
- Trouve seulement dans `scripts/seed-activities.ts`

**Recommandation**: Supprimer ou implementer

---

### 5.2 ActivityCategory

**Fichier**: `prisma/schema.prisma` ligne 123

```prisma
enum ActivityCategory {
  QURAN
  ARABIC
  SUNDAY_SCHOOL
  HALAQAT
  WOMEN
  SUPPORT
  OTHER
}
```

**Utilisation**: AUCUNE
- Les categories sont gerees dans Directus comme strings

**Recommandation**: Supprimer de Prisma

---

## 6. CODE LEGACY NON NETTOYE (BASSE)

### 6.1 References Sanity

**Fichier**: `lib/directus.ts`

Le fichier contient encore des commentaires mentionnant Sanity:
- Ligne 342: "Reference a Sanity si PROJECT"

**Recommandation**: Nettoyer tous les commentaires mentionnant Sanity

---

### 6.2 AdminPermission non utilise

**Fichier**: `prisma/schema.prisma` ligne 134

23 permissions definies mais le systeme n'est pas completement implemente:

```prisma
enum AdminPermission {
  VIEW_MEMBERS, MANAGE_MEMBERS, MANAGE_ROLES,
  VIEW_EVENTS, MANAGE_EVENTS, VIEW_EVENT_REGISTRATIONS, MANAGE_EVENT_REGISTRATIONS,
  VIEW_ACTIVITIES, MANAGE_ACTIVITIES, VIEW_ENROLLMENTS, MANAGE_ENROLLMENTS,
  VIEW_DONATIONS, MANAGE_DONATIONS, VIEW_MEMBERSHIPS, MANAGE_MEMBERSHIPS,
  VIEW_MESSAGES, MANAGE_MESSAGES, VIEW_SERVICES, MANAGE_SERVICES,
  VIEW_PRAYER_TIMES, MANAGE_PRAYER_TIMES, VIEW_SETTINGS, MANAGE_SETTINGS,
  ADMIN_ACCESS
}
```

**Utilisation**:
- `lib/permissions.ts` definit les mappings
- Mais le middleware utilise seulement le `role` utilisateur

**Recommandation**:
- Soit implementer completement le systeme de permissions
- Soit le supprimer et garder le controle simple par role

---

## 7. ACTIONS RECOMMANDEES

### Priorite HAUTE (a faire maintenant)

1. **Supprimer les duplications Directus**
   ```bash
   # Dans Directus Admin, supprimer:
   # - Collection "notifications"
   # - Collection "user_profiles"
   ```

2. **Standardiser le pays par defaut**
   ```prisma
   // prisma/schema.prisma
   country String? @default("Suisse")
   ```

### Priorite MOYENNE (a planifier)

3. **Migrer MembershipType**
   - Creer script pour convertir INDIVIDUAL→ACTIF, FAMILY→ACTIF, etc.
   - Supprimer les anciens types de l'enum

4. **Supprimer attendees**
   - Verifier toutes les registrations existantes
   - Migrer vers numberOfAdults/numberOfChildren
   - Supprimer le champ

5. **Clarifier PAID vs COMPLETED**
   - Ajouter documentation
   - Ou fusionner en un seul statut

### Priorite BASSE (nettoyage)

6. **Supprimer activityIdOld**
7. **Supprimer ActivityStatus et ActivityCategory**
8. **Nettoyer les references Sanity**
9. **Implementer ou supprimer AdminPermission**

---

## MATRICE D'IMPACT

| Action | Risque | Effort | Impact |
|--------|--------|--------|--------|
| Supprimer notifications Directus | Bas | 5min | Haut |
| Supprimer user_profiles Directus | Bas | 5min | Haut |
| Corriger pays defaut | Bas | 15min | Moyen |
| Migrer MembershipType | Moyen | 2h | Moyen |
| Supprimer attendees | Moyen | 1h | Moyen |
| Nettoyer enums | Bas | 30min | Bas |

---

*Document genere le 3 Decembre 2025*
