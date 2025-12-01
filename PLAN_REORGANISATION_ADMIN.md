# 🎯 PLAN DE RÉORGANISATION & OPTIMISATION ADMIN

Date: 30 Novembre 2025

---

## 📊 SITUATION ACTUELLE

Votre admin est **déjà très fonctionnel** : **8/10**

### ✅ Points Forts
- Couverture complète des besoins métier
- Interface moderne et cohérente
- Bonne séparation CMS vs données transactionnelles
- Statistiques et tableaux de bord

### ⚠️ Points à Améliorer
- Beaucoup de pages en **lecture seule** (pas de modification)
- Pas d'exports (Excel/CSV)
- Pas de notifications automatiques
- Page "Horaires" inutile (vous utilisez Mawaqit API)

---

## 🗂️ NOUVELLE STRUCTURE DE NAVIGATION RECOMMANDÉE

```
┌─────────────────────────────────────────────────────┐
│                  ADMIN MOSQUÉE                      │
└─────────────────────────────────────────────────────┘

📊 TABLEAU DE BORD
   └─ Vue d'ensemble, stats clés, alertes

👥 MEMBRES & ADHÉSIONS
   ├─ 📋 Liste des membres
   ├─ 💳 Cotisations
   └─ 📤 Export membres (NOUVEAU)

💰 FINANCES
   ├─ 💵 Dons
   ├─ 📊 Rapports financiers (NOUVEAU)
   └─ 📥 Export comptable (NOUVEAU)

📚 ACTIVITÉS & COURS
   ├─ 📝 Inscriptions
   ├─ 🎓 Gestion activités (via Directus)
   └─ 📅 Planning (NOUVEAU)

📅 ÉVÉNEMENTS
   ├─ ✅ Inscriptions événements
   └─ 🎪 Gestion événements (via Directus)

📞 COMMUNICATION
   ├─ 📬 Messages de contact
   ├─ 🕌 Demandes de services
   └─ 📧 Notifications emails (NOUVEAU)

📝 CONTENU
   ├─ 🎨 Directus CMS (remplace Sanity)
   └─ ⚙️ Paramètres

⚙️ ADMINISTRATION
   ├─ 👤 Gestion utilisateurs (améliorer)
   └─ 🔐 Rôles & permissions (NOUVEAU)
```

---

## 🔥 ACTIONS IMMÉDIATES (À FAIRE MAINTENANT)

### 1. Supprimer la page Import Horaires ✂️

**Fichiers à supprimer :**
```bash
rm /Users/elghoudi/mosquee/app/admin/horaires/page.tsx
rm /Users/elghoudi/mosquee/app/api/admin/import-prayer-times/route.ts
```

**Raison :**
- Vous récupérez déjà les horaires via API Mawaqit en temps réel
- Fonctionnalité redondante et inutile
- Simplifie l'admin

**Impact :** Aucun effet négatif

---

### 2. Supprimer la redirection Studio Sanity ✂️

**Fichier à supprimer :**
```bash
rm /Users/elghoudi/mosquee/app/admin/studio/page.tsx
```

**Alternative :**
- Ajouter un lien direct vers Directus dans la navigation
- URL : `http://localhost:8055` (ou votre URL de production)

---

### 3. Mettre à jour la navigation

**Fichier :** `/app/admin/layout.tsx`

**Retirer :**
- ❌ Lien "Horaires"
- ❌ Lien "Studio"

**Ajouter :**
- ✅ Lien "CMS Directus" (externe)

---

## 🚀 AMÉLIORATIONS PRIORITAIRES

### PHASE 1 : CRUD Complet (Semaine 1-2)

#### 1.1 Membres - Modifier Rôle

**Problème actuel :** Page en lecture seule

**Amélioration :**
```typescript
// Ajouter dans /admin/membres/page.tsx

// Bouton "Modifier rôle"
<Select
  value={user.role}
  onValueChange={(newRole) => updateUserRole(user.id, newRole)}
>
  <option value="MEMBER">Membre</option>
  <option value="STAFF">Personnel</option>
  <option value="TEACHER">Enseignant</option>
  <option value="IMAM">Imam</option>
  <option value="ADMIN">Administrateur</option>
</Select>
```

**Route API nécessaire :**
```typescript
// /app/api/admin/users/[id]/route.ts
export async function PATCH(request, { params }) {
  const { role } = await request.json()
  await prisma.user.update({
    where: { id: params.id },
    data: { role }
  })
}
```

---

#### 1.2 Cotisations - Créer & Renouveler

**Problème actuel :** Page en lecture seule

**Amélioration :**
```typescript
// Bouton "Nouvelle cotisation"
<Dialog>
  <DialogTrigger>+ Nouvelle cotisation</DialogTrigger>
  <DialogContent>
    <form onSubmit={createMembership}>
      <Select name="userId">...</Select>
      <Select name="type">
        <option value="INDIVIDUAL">Individuelle</option>
        <option value="FAMILY">Familiale</option>
        <option value="STUDENT">Étudiant</option>
        <option value="SENIOR">Senior</option>
      </Select>
      <Input type="number" name="amount" />
      <Input type="date" name="startDate" />
      <Input type="date" name="endDate" />
      <Button type="submit">Créer</Button>
    </form>
  </DialogContent>
</Dialog>

// Bouton "Renouveler" sur chaque cotisation expirée
<Button onClick={() => renewMembership(membership.id)}>
  Renouveler
</Button>
```

**Route API nécessaire :**
```typescript
// /app/api/admin/memberships/route.ts
export async function POST(request) {
  const data = await request.json()
  await prisma.membership.create({ data })
}

// /app/api/admin/memberships/[id]/renew/route.ts
export async function POST(request, { params }) {
  const membership = await prisma.membership.findUnique({
    where: { id: params.id }
  })

  // Créer nouvelle cotisation avec dates +1 an
  await prisma.membership.create({
    data: {
      userId: membership.userId,
      type: membership.type,
      amount: membership.amount,
      startDate: new Date(membership.endDate),
      endDate: addYears(membership.endDate, 1),
      status: 'PENDING'
    }
  })
}
```

---

#### 1.3 Événements - Modifier Statut Inscription

**Amélioration :**
```typescript
// Dropdown pour changer le statut
<Select
  value={registration.status}
  onValueChange={(status) => updateRegistrationStatus(registration.id, status)}
>
  <option value="PENDING">En attente</option>
  <option value="CONFIRMED">Confirmé</option>
  <option value="CANCELLED">Annulé</option>
</Select>
```

**Route API nécessaire :**
```typescript
// /app/api/admin/event-registrations/[id]/route.ts
export async function PATCH(request, { params }) {
  const { status } = await request.json()
  await prisma.eventRegistration.update({
    where: { id: params.id },
    data: { status }
  })
}
```

---

### PHASE 2 : Exports (Semaine 3)

#### 2.1 Export Excel/CSV Universel

**Bibliothèque recommandée :** `xlsx` ou `papaparse`

```bash
npm install xlsx
```

**Composant réutilisable :**
```typescript
// /components/admin/ExportButton.tsx
import * as XLSX from 'xlsx'

export function ExportButton({ data, filename, label }) {
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`)
  }

  return (
    <Button onClick={exportToExcel}>
      📥 {label || 'Export Excel'}
    </Button>
  )
}
```

**Utilisation :**
```typescript
// Dans /admin/dons/page.tsx
<ExportButton
  data={donations}
  filename="dons"
  label="Export Dons"
/>

// Dans /admin/membres/page.tsx
<ExportButton
  data={users}
  filename="membres"
  label="Export Membres"
/>
```

---

#### 2.2 Rapport Financier

**Nouvelle page :** `/admin/finances/page.tsx`

```typescript
export default function FinancesPage() {
  // Stats globales
  const totalDons = donations.reduce((sum, d) => sum + d.amount, 0)
  const donationsParType = groupBy(donations, 'type')
  const donationsParMois = groupByMonth(donations)

  return (
    <div>
      <h1>Rapport Financier</h1>

      {/* Filtres de dates */}
      <DateRangePicker onChange={setDateRange} />

      {/* Cards de stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardTitle>Total Dons</CardTitle>
          <CardValue>{totalDons} CHF</CardValue>
        </Card>
        <Card>
          <CardTitle>Zakat</CardTitle>
          <CardValue>{donationsParType.ZAKAT} CHF</CardValue>
        </Card>
        {/* ... */}
      </div>

      {/* Graphiques */}
      <BarChart data={donationsParMois} />

      {/* Export */}
      <ExportButton data={donations} filename="rapport-financier" />
    </div>
  )
}
```

**Bibliothèque graphiques recommandée :** `recharts`

```bash
npm install recharts
```

---

### PHASE 3 : Notifications Email (Semaine 4)

#### 3.1 Configuration Email

**Service recommandé :** **Resend** (gratuit jusqu'à 3000 emails/mois)

```bash
npm install resend
```

**Configuration :**
```typescript
// /lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  await resend.emails.send({
    from: 'Mosquée Madretsch <noreply@mosquee-madretsch.ch>',
    to,
    subject,
    html
  })
}
```

**Dans `.env` :**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

#### 3.2 Email Approbation Inscription

**Modifier :** `/app/api/admin/enrollments/[id]/route.ts`

```typescript
export async function PATCH(request, { params }) {
  const { status } = await request.json()

  const enrollment = await prisma.enrollment.update({
    where: { id: params.id },
    data: { status },
    include: { user: true, activity: true }
  })

  // Envoyer email
  if (status === 'APPROVED') {
    await sendEmail({
      to: enrollment.user.email,
      subject: `Inscription approuvée - ${enrollment.activityTitle}`,
      html: `
        <h1>Bonjour ${enrollment.user.firstName},</h1>
        <p>Votre inscription à <strong>${enrollment.activityTitle}</strong> a été approuvée !</p>
        <p>Rendez-vous ${enrollment.activity.schedule}.</p>
        <p>À bientôt,<br>Mosquée Madretsch</p>
      `
    })
  }
}
```

---

#### 3.3 Email Rappel Cotisation

**Nouveau script :** `/scripts/send-membership-reminders.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { addDays } from 'date-fns'

async function sendReminders() {
  // Trouver cotisations expirant dans 30 jours
  const expiringMemberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: new Date(),
        lte: addDays(new Date(), 30)
      }
    },
    include: { user: true }
  })

  for (const membership of expiringMemberships) {
    await sendEmail({
      to: membership.user.email,
      subject: 'Rappel - Renouvellement de cotisation',
      html: `
        <h1>Bonjour ${membership.user.firstName},</h1>
        <p>Votre cotisation expire le ${membership.endDate.toLocaleDateString()}.</p>
        <p>Merci de la renouveler pour continuer à bénéficier de nos services.</p>
        <a href="https://mosquee.ch/cotisations">Renouveler maintenant</a>
      `
    })
  }
}

sendReminders()
```

**Cron Job (exécuter chaque jour) :**
```bash
# Dans package.json
"scripts": {
  "send-reminders": "tsx scripts/send-membership-reminders.ts"
}

# Configurer cron (Linux/Mac) ou Task Scheduler (Windows)
0 9 * * * cd /path/to/project && npm run send-reminders
```

---

## 📋 TABLEAU RÉCAPITULATIF DES AMÉLIORATIONS

| Page | État Actuel | Amélioration | Priorité | Effort |
|------|-------------|--------------|----------|--------|
| **Membres** | Lecture seule | Modifier rôle, activer/désactiver | 🔥 Haute | Moyen |
| **Cotisations** | Lecture seule | Créer, renouveler, modifier | 🔥 Haute | Élevé |
| **Dons** | Lecture seule | Export Excel/CSV | 🔥 Haute | Faible |
| **Événements** | Lecture seule | Modifier statut, export | 🔥 Haute | Faible |
| **Inscriptions** | ✅ Bon | Email auto après approbation | 🔶 Moyenne | Moyen |
| **Messages** | ✅ Bon | Bouton "Répondre" | 🔷 Basse | Faible |
| **Services** | ✅ Bon | Calendrier visuel | 🔷 Basse | Élevé |
| **Dashboard** | ✅ Bon | Graphiques interactifs | 🔶 Moyenne | Moyen |
| **Horaires** | ❌ Inutile | **SUPPRIMER** | 🔥 Haute | Immédiat |
| **Studio** | Redirection | Lien Directus | 🔥 Haute | Immédiat |

---

## 🛠️ TECHNOLOGIES RECOMMANDÉES

### Pour les Exports
- **xlsx** : Export Excel
- **papaparse** : Export CSV

### Pour les Graphiques
- **recharts** : Simple et React-friendly
- **chart.js** : Plus d'options
- **tremor** : Dashboard moderne

### Pour les Emails
- **Resend** : Moderne, gratuit jusqu'à 3000/mois
- **SendGrid** : Plus établi
- **Mailgun** : Alternative

### Pour les PDFs
- **react-pdf** : Génération PDF (cartes de membre, reçus)
- **jsPDF** : Alternative légère

### Pour les Dates
- **date-fns** : Déjà utilisé dans le projet ✅

---

## 📅 PLANNING SUGGÉRÉ

### Semaine 1 : Nettoyage & CRUD Membres
- ✅ Supprimer page Horaires
- ✅ Supprimer page Studio
- ✅ Ajouter modification rôle utilisateurs
- ✅ Ajouter activation/désactivation comptes

### Semaine 2 : CRUD Cotisations & Événements
- ✅ Créer nouvelle cotisation
- ✅ Renouveler cotisation
- ✅ Modifier statut inscriptions événements

### Semaine 3 : Exports
- ✅ Installer xlsx
- ✅ Créer composant ExportButton
- ✅ Ajouter exports partout (dons, membres, inscriptions, événements)
- ✅ Créer page Rapport Financier

### Semaine 4 : Notifications Email
- ✅ Configurer Resend
- ✅ Email approbation inscription
- ✅ Email rappel cotisation
- ✅ Script cron

### Semaine 5+ : Améliorations avancées
- Dashboard avec graphiques
- Calendrier services
- Recherche globale
- Système de permissions

---

## 🎯 OBJECTIF FINAL

**Admin Next.js = 10/10**

### Fonctionnalités complètes :
- ✅ CRUD complet sur toutes les entités
- ✅ Exports Excel/CSV partout
- ✅ Notifications email automatiques
- ✅ Rapports financiers avec graphiques
- ✅ Interface moderne et intuitive
- ✅ Gestion des rôles et permissions

### Workflow optimisé :
1. **Admin crée événement** dans Directus
2. **Utilisateurs s'inscrivent** via le site
3. **Admin voit inscriptions** dans Next.js admin
4. **Admin approuve** → Email auto envoyé
5. **Admin exporte liste** en Excel pour la logistique

---

## 💡 CONSEILS D'IMPLÉMENTATION

### 1. Commencer petit
- Une amélioration à la fois
- Tester en dev avant production
- Demander feedback aux autres admins

### 2. Réutiliser les composants
- Créer des composants génériques (ExportButton, StatusBadge, etc.)
- Utiliser shadcn/ui (déjà dans le projet)
- DRY (Don't Repeat Yourself)

### 3. Penser UX
- Confirmations avant actions destructives
- Messages de succès/erreur clairs
- Loading states pendant les actions

### 4. Sécurité
- Vérifier les permissions côté serveur (pas que frontend)
- Logs des actions importantes
- Validation stricte des inputs

---

## 📞 BESOIN D'AIDE ?

Consultez :
- `MIGRATION_STATUS.md` - État migration Directus
- `AUDIT_ADMIN.md` - Analyse détaillée admin
- Documentation Next.js : https://nextjs.org/docs
- Documentation Prisma : https://www.prisma.io/docs

---

**Bon courage pour les améliorations ! 🚀**
