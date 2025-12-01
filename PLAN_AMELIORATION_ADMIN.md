# Plan d'Amélioration de la Partie Admin

## 🎯 Vision Globale

La partie admin doit permettre une gestion complète du cycle de vie de chaque processus, de la demande initiale jusqu'à la finalisation, avec des états intermédiaires, des notifications, et un historique complet.

---

## 📊 ANALYSE PAR PROCESSUS MÉTIER

### 1️⃣ **INSCRIPTIONS AUX ACTIVITÉS** (Enrollments)

#### 🔄 Flux Actuel (INCOMPLET)
```
Utilisateur → Formulaire → PENDING → [Approve/Reject] → FIN
```

#### ✅ Flux Amélioré Proposé
```
Utilisateur → Formulaire → PENDING (Liste d'attente)
    ↓
Admin examine → Plusieurs actions possibles:
    - APPROVED → Inscription confirmée
    - WAITING_LIST → Liste d'attente (activité pleine)
    - INTERVIEW_REQUIRED → Entretien nécessaire
    - REJECTED → Refusé avec raison
    ↓
APPROVED → ACTIVE (cours en cours)
    ↓
Gestion continue:
    - avoir un tableau avec filtre
    - Paiements mensuels trackés
    - Absences enregistrées / pas besoin 
    - Notes de progression / pas besoin 
    - Commentaires admin/enseignant  /pas besoin 
    ↓
Fin du trimestre/année: / pas besoin 
    - COMPLETED (terminé avec succès)
    - DROPPED (abandon)
    - TRANSFERRED (transfert de niveau)
```

#### 🚀 Fonctionnalités à Ajouter

**Vue Liste d'Attente:**
- Tableau séparé pour WAITING_LIST
- Notification auto quand place disponible
- Priorité (date d'inscription, fratrie déjà inscrite, etc.)

**Détails Enrichis:**
- Historique complet des changements de statut
- Notes internes (visibles seulement admin)
- Pièces jointes (certificat de naissance, photo, etc.)
- Lien vers le profil complet de l'enfant/parent

**Actions Manquantes:**
- ✏️ Modifier les informations (corriger erreurs)
- 📞 Bouton "Contacter le parent" (email pré-rempli)
- 💰 Historique des paiements liés
- 📊 Export Excel des inscriptions
- 🔔 Envoyer notification email personnalisée
- 📝 Ajouter commentaire/note interne
- 🗑️ Supprimer (avec confirmation)
- 🔄 Transférer vers autre activité/niveau

**Dashboard Inscriptions:**
- Taux de remplissage par activité (jauge visuelle)
- Alertes: activités pleines, liste d'attente longue
- Graphique: évolution des inscriptions dans le temps
- Revenus estimés par activité

---

### 2️⃣ **DONS** (Donations)

#### 🔄 Flux Actuel (TRÈS BASIQUE)
```
Utilisateur → Formulaire → Enregistré → AFFICHAGE SEULEMENT
```
un tableau qui montre le total et le % de chaque dons  et les projet aussi par % et montant 

```

**Dashboard Dons:**
- Graphique: dons par mois/année
- Top donateurs (anonymisé si demandé)
- Objectifs de collecte par projet (barre de progression)
- Alertes: gros dons à remercier, objectif atteint
- Statistiques: montant moyen, nombre donateurs récurrents

**Rapports:**
- Rapport fiscal annuel (tous les dons d'une personne)
- Rapport par projet (tous les contributeurs)
- Rapport par type (Zakat, Sadaqa, etc.)
- Export comptable (CSV pour logiciel compta)

---

### 3️⃣ **INSCRIPTIONS ÉVÉNEMENTS** (Event Registrations)

#### 🔄 Flux Actuel (TROP SIMPLE)
```
Utilisateur → Inscription → PENDING → AFFICHAGE SEULEMENT
```

#### ✅ Flux Amélioré Proposé
```
Utilisateur → Inscription événement
    ↓
Vérification automatique:
    - Capacité disponible? → CONFIRMED
    - Événement plein? → WAITING_LIST
    - Approbation requise? → PENDING
    ↓
Admin examine PENDING → Actions:
    - CONFIRMED (confirmé)
    - WAITING_LIST (liste d'attente)
    - REJECTED (refusé)
    ↓
CONFIRMED → Avant l'événement:
    - Rappel email J-3, J-1
    - Participant peut annuler → CANCELLED
    ↓
Jour de l'événement:
    - Check-in → ATTENDED (présent)
    - No-show → NO_SHOW (absent)
    ↓
Après événement:
    - COMPLETED (terminé)
```

#### 🚀 Fonctionnalités à Ajouter

**Gestion Avancée:**
- États: PENDING, CONFIRMED, WAITING_LIST, CANCELLED, ATTENDED, NO_SHOW, COMPLETED
- Mode check-in (scan QR code ou liste)
- Gestion accompagnants (nombre exact)
- Rappels automatiques configurables

**Actions Manquantes:**
- ✅ Check-in (marquer présence jour J)
- 📧 Envoyer rappel manuel
- 🎫 Générer badge/ticket avec QR code
- ✏️ Modifier nombre d'accompagnants
- 🔄 Déplacer de waiting list → confirmed
- 📊 Export liste participants (pour accueil)
- 📋 Export badges imprimables
- 📈 Voir taux de présence par événement

**Dashboard Événements:**
- Liste événements à venir avec jauge remplissage
- Alertes: événements pleins, liste d'attente
- Événements passés: taux de présence
- Statistiques: no-show rate, capacité moyenne

**Interface Check-in:**
- Page dédiée pour jour d'événement
- Recherche rapide par nom
- Scan QR code (mobile)
- Compteur en temps réel: attendus vs présents

---

### 4️⃣ **MEMBRES** (Users/Members)

#### 🔄 Flux Actuel (LECTURE SEULE)
```
Auto-inscription → Compte créé → AFFICHAGE SEULEMENT
```

#### ✅ Flux Amélioré Proposé
```
Création compte (auto ou admin) → MEMBER
    ↓
Admin peut:
    - Modifier rôle (MEMBER, TEACHER, STAFF, IMAM, ADMIN)
    - Activer/désactiver compte
    - Voir historique complet
    - Voir famille (enfants, cotisations, inscriptions)
    ↓
Vue 360° du membre:
    - Informations personnelles
    - Enfants liés
    - Cotisations actives/historique
    - Inscriptions activités
    - Dons effectués
    - Événements inscrits
    - Demandes de services
```

#### 🚀 Fonctionnalités à Ajouter

**CRUD Complet:**
- ✏️ Modifier informations membre
- ➕ Créer nouveau membre manuellement
- 🔒 Activer/désactiver compte
- 🔄 Changer rôle avec justification
- 🗑️ Supprimer (soft delete)
- 🔑 Réinitialiser mot de passe

**Vue Détaillée 360°:**
- Onglet "Informations personnelles"
- Onglet "Famille" (enfants avec âges)
- Onglet "Cotisations" (historique + statut)
- Onglet "Activités" (inscriptions enfants)
- Onglet "Dons" (historique contributions)
- Onglet "Événements" (participations)
- Onglet "Historique" (timeline de toutes actions)

**Actions Contextuelles:**
- 📧 Envoyer email personnalisé
- 📞 Copier coordonnées
- 💳 Créer nouvelle cotisation
- 📝 Ajouter note privée
- 🏷️ Tags personnalisés (VIP, Bénévole, etc.)

**Dashboard Membres:**
- Nouveaux membres ce mois
- Membres inactifs (pas de connexion depuis X mois)
- Membres avec cotisation expirée
- Graphique: évolution nombre membres

---

### 5️⃣ **COTISATIONS** (Memberships)

#### 🔄 Flux Actuel (LECTURE SEULE)
```
Cotisation créée → PENDING/ACTIVE/EXPIRED → AFFICHAGE SEULEMENT
```

#### ✅ Flux Amélioré Proposé
```
Création cotisation (membre ou admin)
    ↓
PENDING (en attente paiement)
    ↓
Admin vérifie paiement → Actions:
    - ACTIVE (paiement reçu)
    - REJECTED (annulé)
    ↓
ACTIVE → Suivi automatique:
    - Email rappel 1 mois avant expiration
    - Email rappel J-7
    - Email rappel expiration
    ↓
Date expiration atteinte:
    - EXPIRED (automatique)
    - Notification admin: renouvellements à solliciter
```

#### 🚀 Fonctionnalités à Ajouter

**Gestion Complète:**
- ➕ Créer cotisation manuellement pour un membre
- ✏️ Modifier dates/montant
- 💳 Marquer comme payée
- 🔄 Renouveler (créer nouvelle cotisation)
- 📧 Envoyer rappel de renouvellement
- 🗑️ Annuler/supprimer

**Automatisations:**
- Rappels automatiques avant expiration
- Notification admin: X cotisations expirent ce mois
- Génération auto cotisation année suivante

**Dashboard Cotisations:**
- Revenus mensuels/annuels
- Taux de renouvellement
- Cotisations arrivant à expiration (30j)
- Graphique: évolution revenus cotisations

---

### 6️⃣ **MESSAGES CONTACT** (Contact Messages)

#### 🔄 Flux Actuel (BASIQUE)
```
Message reçu → Marquer lu → FIN
```

#### ✅ Flux Amélioré Proposé
```
Message reçu → NEW (non lu)
    ↓
Admin lit → OPEN (lu, en cours de traitement)
    ↓
Admin traite → Actions:
    - Répondre par email
    - Assigner à quelqu'un (imam, trésorier, etc.)
    - Ajouter notes internes
    - Archiver → ARCHIVED
    - Marquer important → FLAGGED
    ↓
Résolu → RESOLVED
```

#### 🚀 Fonctionnalités à Ajouter

**États:**
- NEW, OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, ARCHIVED, FLAGGED

**Actions:**
- 📧 Répondre directement (email pré-rempli)
- 👤 Assigner à un membre équipe
- 🏷️ Catégoriser (question, demande, plainte, etc.)
- ⭐ Marquer important
- 📝 Ajouter notes internes
- 🔗 Lier à un membre existant
- 🗑️ Supprimer spam

**Interface:**
- Vue boîte de réception (type email)
- Filtres: non lus, importants, assignés à moi
- Recherche avancée
- Statistiques: temps moyen de réponse

---

### 7️⃣ **DEMANDES DE SERVICES** (Service Requests)

#### 🔄 Flux Actuel (BON MAIS PEUT MIEUX FAIRE)
```
Demande → PENDING → APPROVED → COMPLETED
```

#### ✅ Flux Amélioré Proposé
```
Demande service (mariage, funérailles, etc.)
    ↓
PENDING (en attente examen)
    ↓
Admin examine → Actions:
    - INTERVIEW_SCHEDULED (entretien planifié)
    - DOCUMENTS_REQUIRED (documents manquants)
    - APPROVED (approuvé)
    - REJECTED (refusé avec raison)
    ↓
APPROVED → Préparation:
    - IN_PREPARATION (en préparation)
    - Date/heure confirmée
    - Documents collectés
    - Paiement reçu (si applicable)
    ↓
SCHEDULED (planifié, date confirmée)
    ↓
Jour J → COMPLETED
    ↓
Suivi → ARCHIVED
```

#### 🚀 Fonctionnalités à Ajouter

**Enrichissements:**
- 📅 Calendrier intégré (planifier date service)
- 📎 Upload documents (certificat, etc.)
- 💰 Gestion paiement si frais
- 📋 Checklist pré-service
- 📝 Notes détaillées sur dossier
- 👤 Assigner à imam/responsable

**Actions:**
- 📧 Envoyer demande documents par email
- 📅 Proposer créneaux disponibles
- ✅ Valider réception documents
- 💳 Confirmer paiement
- 📄 Générer certificat (ex: certificat shahada)

**Dashboard Services:**
- Services à venir (calendrier)
- Services en attente documents
- Statistiques par type
- Timeline services planifiés

---

### 8️⃣ **PARAMÈTRES** (Settings) - TRÈS INCOMPLET

#### Sections à Ajouter

**Informations Mosquée:**
- Nom, adresse complète
- Téléphones, emails
- Horaires d'ouverture
- Capacité salle principale
- Logo, photos

**Réseaux Sociaux:**
- Facebook, Instagram, YouTube, Twitter
- WhatsApp, Telegram

**Informations Bancaires:**
- IBAN, BIC
- Nom bénéficiaire
- Informations fiscales

**Configuration Horaires Prière:**
- Connexion API Mawaqit
- Méthode de calcul
- Ajustements manuels
- Iqama (délai après adhan)

**Notifications:**
- Activer/désactiver rappels auto
- Templates emails personnalisables
- Signature emails

**Utilisateurs & Rôles:**
- Gérer permissions par rôle
- Créer rôles personnalisés

---

## 🎨 AMÉLIORATIONS UI/UX TRANSVERSALES

### 1. **Tableaux de Bord Améliorés**

Pour chaque section, ajouter:
- 📊 Graphiques visuels
- 🔔 Alertes et notifications
- ⚡ Actions rapides
- 📈 KPIs clés
- 🎯 Objectifs et progression

### 2. **Filtres & Recherche Avancés**

- Recherche multi-critères
- Filtres combinables
- Sauvegarde de filtres favoris
- Export résultats filtrés

### 3. **Historique & Audit**

Pour chaque entité:
- Timeline de tous changements
- Qui a fait quoi et quand
- Commentaires/notes internes
- Pièces jointes

### 4. **Notifications & Alertes**

Système centralisé:
- 🔔 Centre notifications (cloche en haut)
- Email automatiques configurables
- Rappels personnalisables
- Notifications push (optionnel)

### 5. **Exports & Rapports**

Uniformiser:
- 📊 Export Excel/CSV partout
- 📄 PDF pour documents officiels
- 📧 Email export direct
- 📅 Rapports programmés

### 6. **Actions en Masse**

Sur tous les tableaux:
- Sélection multiple (checkbox)
- Actions groupées (supprimer, exporter, changer statut)
- Confirmation avant action destructive

---

## 📱 FONCTIONNALITÉS GLOBALES À AJOUTER

### 1. **Gestion Fichiers/Documents**

- 📁 Bibliothèque documents
- Upload pièces jointes
- Catégorisation
- Recherche

### 2. **Calendrier Centralisé**

Vue unifiée:
- Événements
- Services planifiés
- Cours/activités
- Horaires prière

### 3. **Communication Intégrée**

- 📧 Email intégré (envoyer depuis plateforme)
- 📱 SMS (optionnel, avec service)
- 📢 Notifications push
- 📋 Templates messages

### 4. **Gestion Financière**

Dashboard financier:
- Revenus (dons, cotisations, activités)
- Dépenses (optionnel)
- Bilan mensuel/annuel
- Graphiques trésorerie
- Export comptable

### 5. **Gestion Contenu**

Interface pour:
- ✏️ Modifier événements Directus
- ✏️ Modifier activités Directus
- ✏️ Modifier articles/actualités
- 📸 Gérer galerie photos
- (Alternative: garder Directus séparé)

---

## 🚀 PRIORISATION (3 Phases)

### **PHASE 1 - URGENT** (Combler lacunes critiques)

1. ✅ **Inscriptions**: États détaillés + liste d'attente + modification
2. ✅ **Dons**: États + reçus fiscaux + confirmations
3. ✅ **Membres**: Modification + création + vue 360°
4. ✅ **Paramètres**: Infos mosquée complètes
5. ✅ **Exports**: Excel/CSV partout

### **PHASE 2 - IMPORTANT** (Améliorer workflows)

6. ✅ **Événements**: Check-in + QR codes + rappels
7. ✅ **Cotisations**: Gestion complète + rappels auto
8. ✅ **Services**: Calendrier + documents + checklist
9. ✅ **Messages**: Réponses + assignation + catégories
10. ✅ **Notifications**: Centre notifications + emails auto

### **PHASE 3 - AVANCÉ** (Optimisation)

11. ✅ **Calendrier centralisé**
12. ✅ **Dashboard financier**
13. ✅ **Communication intégrée**
14. ✅ **Gestion documents**
15. ✅ **Rapports avancés**

---

## 💡 RECOMMANDATIONS TECHNIQUES

### Base de Données

Champs à ajouter aux modèles Prisma:

```prisma
// Enrollment
- status: ajouter WAITING_LIST, INTERVIEW_REQUIRED, ACTIVE, COMPLETED, DROPPED, TRANSFERRED
- internalNotes: String?
- paymentStatus: PaymentStatus?
- lastPaymentDate: DateTime?

// Donation
- status: ajouter PENDING, CONFIRMED, PROCESSING, REJECTED, REFUNDED
- receiptNumber: String? @unique
- receiptSent: Boolean @default(false)
- paymentMethod: PaymentMethod
- receivedDate: DateTime?

// EventRegistration
- status: ajouter WAITING_LIST, CANCELLED, ATTENDED, NO_SHOW
- qrCode: String? @unique
- reminderSent: Boolean @default(false)
- checkedInAt: DateTime?

// ContactMessage
- status: NEW, OPEN, ASSIGNED, RESOLVED, ARCHIVED, FLAGGED
- assignedTo: String? (userId)
- category: String?
- internalNotes: String?

// ServiceRequest
- ajouter: INTERVIEW_SCHEDULED, DOCUMENTS_REQUIRED, IN_PREPARATION, SCHEDULED
- scheduledDate: DateTime?
- documentsReceived: Boolean @default(false)
- assignedTo: String?
```

### Notifications

Implémenter système notifications:
- Table `Notification` dans DB
- WebSocket ou polling pour temps réel
- Templates emails (Resend, SendGrid, etc.)
- Cron jobs pour rappels automatiques

### Audit Log

Table dédiée pour traçabilité:
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // CREATE, UPDATE, DELETE, etc.
  entity    String   // Enrollment, Donation, etc.
  entityId  String
  changes   Json?    // Ancien/nouveau état
  createdAt DateTime @default(now())
}
```

---

## ✅ CONCLUSION

La partie admin actuelle est **fonctionnelle mais basique**. Elle permet de **visualiser** les données mais manque cruellement de:

1. **Gestion d'états** (workflows complets)
2. **Actions de modification** (tout est read-only)
3. **Automatisations** (rappels, notifications)
4. **Historique** (qui a fait quoi)
5. **Communication** (email intégré)
6. **Rapports** (exports, statistiques)

En suivant ce plan, vous aurez une **interface admin professionnelle** qui couvre tous les processus métier d'une mosquée, de A à Z.

**Prochaine étape suggérée**: Commencer par la Phase 1, en particulier:
- Enrichir gestion Inscriptions (le plus urgent)
- Ajouter modification Membres (besoin fréquent)
- Compléter page Paramètres (fondamental)
