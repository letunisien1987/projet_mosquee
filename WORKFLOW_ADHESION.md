# Workflow d'adhésion - Emails et Suivi

## Vue d'ensemble du processus

```
1. SOUMISSION        → Email: "Demande reçue"
2. APPROBATION       → Email: "Demande approuvée + lien paiement"
3. PAIEMENT          → Email: "Confirmation paiement + bienvenue"
4. REJET (optionnel) → Email: "Demande refusée + raison"
5. EXPIRATION        → Email: "Lien expiré + recontacter"
```

## Page de suivi

**URL**: `/membre/adhesion`

Cette page affiche en temps réel :
- ✅ Statut actuel de la demande (avec badge coloré)
- ✅ Timeline visuelle des étapes complétées
- ✅ Informations détaillées (date d'expiration, raison de rejet, etc.)
- ✅ Actions disponibles selon le statut

## Emails automatiques

### 1. Email de confirmation de soumission

**Quand**: Immédiatement après la soumission du formulaire `/devenir-membre`

**Statut**: `PENDING`

**Contenu**:
```
Objet: Demande d'adhésion reçue - Mosquée Madretsch

Bonjour [Prénom],

Nous avons bien reçu votre demande d'adhésion à la Mosquée Madretsch.

📋 Informations de votre demande:
- Type: [Membre Actif / Membre Passif]
- Date de soumission: [Date]

⏳ Prochaine étape:
Votre demande est en cours d'examen par notre équipe administrative.
Vous recevrez une réponse sous 48-72 heures ouvrables.

🔍 Suivi de votre demande:
Vous pouvez consulter l'état de votre demande à tout moment sur:
👉 https://mosquee.ch/membre/adhesion

Cordialement,
Mosquée Madretsch
```

**Fichier**: `/api/membership-requests/route.ts` (à vérifier/créer)

---

### 2. Email d'approbation + lien de paiement

**Quand**: Après approbation par l'admin

**Statut**: `APPROVED` → `PAYMENT_SENT`

**Contenu**:
```
Objet: ✅ Demande approuvée - Finalisez votre adhésion

Bonjour [Prénom],

Excellente nouvelle ! Votre demande d'adhésion a été approuvée par notre équipe.

💳 Pour finaliser votre adhésion:
1. Cliquez sur le lien de paiement ci-dessous
2. Effectuez le paiement sécurisé de 120 CHF via Stripe
3. Vous recevrez une confirmation immédiate

🔗 Lien de paiement:
👉 [URL unique avec token]

⚠️ Important:
- Ce lien est valable 7 jours (expire le [Date])
- Montant: 120 CHF (paiement sécurisé par Stripe)
- Type: [Membre Actif / Passif]

📊 Suivi de votre demande:
👉 https://mosquee.ch/membre/adhesion

Cordialement,
Mosquée Madretsch
```

**Fichier**: `/api/admin/membership-requests/[id]/approve/route.ts`

---

### 3. Email de confirmation de paiement

**Quand**: Après paiement Stripe réussi (webhook)

**Statut**: `COMPLETED`

**Contenu**:
```
Objet: 🎉 Bienvenue ! Votre adhésion est confirmée

Bonjour [Prénom],

Félicitations et bienvenue à la Mosquée Madretsch !

✅ Votre paiement a été confirmé avec succès.

📋 Détails de votre adhésion:
- Type: [Membre Actif / Passif]
- Montant payé: 120 CHF
- Validité: du [Date début] au [Date fin] (1 an)
- Statut: Actif

🎯 Vos avantages:
[Si Actif]
- ✓ Droit de vote aux assemblées générales
- ✓ Accès à toutes les activités
- ✓ Participation aux événements
- ✓ Réductions sur les cours

[Si Passif]
- ✓ Accès à toutes les activités
- ✓ Participation aux événements
- ✓ Réductions sur les cours

📱 Votre espace membre:
Accédez à votre espace membre pour:
- Consulter votre cotisation
- Vous inscrire aux événements et activités
- Gérer vos enfants (pour les inscriptions)

👉 https://mosquee.ch/membre/dashboard

🧾 Reçu fiscal:
Un reçu fiscal vous sera envoyé prochainement.

Cordialement,
L'équipe de la Mosquée Madretsch
```

**Fichier**: `/api/stripe/webhook/route.ts` (événement `checkout.session.completed`)

---

### 4. Email de rejet

**Quand**: Après rejet par l'admin

**Statut**: `REJECTED`

**Contenu**:
```
Objet: Demande d'adhésion - Décision

Bonjour [Prénom],

Nous accusons réception de votre demande d'adhésion.

Après examen, nous ne sommes malheureusement pas en mesure de donner suite à votre demande pour la raison suivante:

📝 Raison: [Raison du rejet]

Si vous souhaitez plus d'informations ou soumettre une nouvelle demande, n'hésitez pas à nous contacter à:
📧 info@mosquee-madretsch.ch
📞 [Téléphone]

Cordialement,
Mosquée Madretsch
```

**Fichier**: `/api/admin/membership-requests/[id]/reject/route.ts`

---

### 5. Email de rappel (lien expirant bientôt)

**Quand**: 5 jours après envoi du lien (2 jours avant expiration)

**Statut**: `PAYMENT_SENT` (avec expiration dans 2 jours)

**Contenu**:
```
Objet: ⚠️ Rappel - Votre lien de paiement expire bientôt

Bonjour [Prénom],

Nous remarquons que vous n'avez pas encore finalisé votre adhésion.

⏰ Votre lien de paiement expire dans 2 jours (le [Date])

💳 Pour finaliser votre adhésion:
👉 [Lien de paiement]

Montant: 120 CHF

Si vous rencontrez un problème ou si vous avez besoin d'aide, contactez-nous:
📧 info@mosquee-madretsch.ch

Cordialement,
Mosquée Madretsch
```

**Fichier**: `/api/cron/send-payment-reminders/route.ts` (à créer)

---

### 6. Email d'expiration

**Quand**: Automatiquement après 7 jours sans paiement

**Statut**: `EXPIRED`

**Contenu**:
```
Objet: Lien de paiement expiré - Nouvelle demande

Bonjour [Prénom],

Le lien de paiement pour votre adhésion a expiré (validité: 7 jours).

🔄 Pour finaliser votre adhésion:
Veuillez nous contacter pour recevoir un nouveau lien de paiement:

📧 info@mosquee-madretsch.ch
📞 [Téléphone]

Ou soumettez une nouvelle demande:
👉 https://mosquee.ch/devenir-membre

Cordialement,
Mosquée Madretsch
```

**Fichier**: `/api/cron/expire-payment-links/route.ts` (à créer)

---

## Intégration dans l'espace membre

### Navigation

Ajouter un lien dans le menu membre:

```tsx
<Link href="/membre/adhesion">
  📋 Suivi d'adhésion
</Link>
```

### Badge de notification

Afficher un badge sur le menu si demande en attente:
- 🟡 PENDING: "En attente de validation"
- 🔵 APPROVED: "Approuvé - Paiement requis"
- 🔴 PAYMENT_SENT: "Lien envoyé - Expire dans X jours"

---

## Routes API à vérifier/créer

✅ `/api/membership-requests` (POST) - Email de confirmation
✅ `/api/admin/membership-requests/[id]/approve` (POST) - Email d'approbation
✅ `/api/admin/membership-requests/[id]/reject` (POST) - Email de rejet
✅ `/api/stripe/webhook` - Email de confirmation paiement
⚠️ `/api/cron/send-payment-reminders` (GET) - À créer
⚠️ `/api/cron/expire-payment-links` (GET) - À créer

---

## Tests

### Test complet du workflow:

1. ✅ Soumettre demande → Vérifier email de confirmation
2. ✅ Admin approuve → Vérifier email avec lien + statut sur `/membre/adhesion`
3. ✅ Payer via Stripe → Vérifier email de bienvenue + membership actif
4. ✅ Admin rejette → Vérifier email de rejet

### Test des emails de rappel:

1. Approuver une demande
2. Attendre 5 jours (ou modifier manuellement `paymentLinkSentAt`)
3. Exécuter cron `/api/cron/send-payment-reminders`
4. Vérifier email de rappel

### Test d'expiration:

1. Approuver une demande
2. Modifier `paymentExpiresAt` pour une date passée
3. Exécuter cron `/api/cron/expire-payment-links`
4. Vérifier statut EXPIRED + email
