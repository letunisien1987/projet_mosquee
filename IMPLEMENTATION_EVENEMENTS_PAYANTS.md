# Implémentation - Événements Payants

**Date :** 2 décembre 2025
**Statut :** EN COURS - Phase 1

---

## Résumé

Système de paiement pour les inscriptions aux événements avec Stripe Checkout.

---

## ✅ Travaux Complétés

### 1. Backend - API et Webhook

✅ **API Route créée** : `/app/api/stripe/create-event-checkout/route.ts`
- Récupère l'événement depuis Directus
- Calcule le montant total (adultes + enfants)
- Crée la session Stripe Checkout
- Validation avec Zod

✅ **Webhook Stripe mis à jour** : `/app/api/stripe/webhook/route.ts`
- Router par type de paiement (`EVENT_REGISTRATION` vs `DONATION`)
- Fonction `handleEventRegistrationPayment()` :
  - Crée le `Payment` avec statut `COMPLETED`
  - Crée l'`EventRegistration` avec statut `CONFIRMED`
  - Lie automatiquement à l'utilisateur si email trouvé
  - Envoie email de confirmation

✅ **Template Email** : `/lib/email.ts`
- Fonction `sendEventRegistrationConfirmation()`
- Design professionnel avec tous les détails
- Message différent si utilisateur a un compte ou non
- CTA pour créer un compte ou voir ses inscriptions

✅ **Schéma Prisma**
- Relations `EventRegistration` ↔ `Payment` déjà présentes
- Champs `requiresPayment`, `paymentAmount`, `paymentId`

---

## 🔧 Travaux Restants

### 2. Configuration Directus (MANUEL)

Vous devez ajouter manuellement ces champs dans Directus :

#### 📝 Étapes dans Directus (http://localhost:8055)

1. **Connexion** : Allez sur http://localhost:8055
2. **Ouvrir** : Settings → Data Model → `events`
3. **Ajouter les champs suivants** :

**Champ 1 : `price`**
- Type : `Decimal` (ou `Float`)
- Interface : `Input`
- Label : "Prix adulte (CHF)"
- Placeholder : "50.00"
- Note : "Prix pour un participant adulte en CHF"
- Options :
  - Nullable : ✅ Yes (optionnel)
  - Min : 0
  - Decimal places : 2

**Champ 2 : `child_price`**
- Type : `Decimal` (ou `Float`)
- Interface : `Input`
- Label : "Prix enfant (CHF)"
- Placeholder : "25.00"
- Note : "Prix réduit pour les enfants. Si vide, prix adulte appliqué."
- Options :
  - Nullable : ✅ Yes (optionnel)
  - Min : 0
  - Decimal places : 2

**Champ 3 : `requires_payment`**
- Type : `Boolean`
- Interface : `Toggle`
- Label : "Requiert un paiement"
- Default Value : `false`
- Note : "Si activé, l'inscription nécessite un paiement"

4. **Sauvegarder** les modifications

5. **Modifier quelques événements** pour tester :
   - Activez "Requiert un paiement" ✅
   - Ajoutez des prix (ex: 50 CHF adulte, 25 CHF enfant)

---

### 3. Frontend - Modal d'Inscription

**Fichier à modifier** : `/components/EventRegistrationModal.tsx`

#### Changements nécessaires :

1. **Afficher le prix** dans le modal si `event.requiresPayment === true`
2. **Calcul dynamique** du total :
   - Si INDIVIDUAL : `price × 1`
   - Si FAMILY : `(numberOfAdults × price) + (numberOfChildren × child_price)`
   - Si CHILD : `child_price × 1`
3. **Bouton modifié** :
   - Si gratuit : "S'inscrire"
   - Si payant : "Payer [montant] CHF et s'inscrire"
4. **Redirection** vers l'API de checkout au lieu de l'API d'inscription directe

#### Code exemple (à adapter) :

```typescript
// Dans EventRegistrationModal.tsx

const handleSubmit = async (formData) => {
  // Si événement payant
  if (event.requires_payment && event.price) {
    const totalAmount = calculateTotal(formData) // Fonction à créer

    // Appeler l'API de checkout
    const res = await fetch('/api/stripe/create-event-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        participationType: formData.type,
        numberOfAdults: formData.numberOfAdults,
        numberOfChildren: formData.numberOfChildren,
        contactName: `${formData.firstName} ${formData.lastName}`,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        participants: formData.participants,
        userId: session?.user?.id,
        childId: formData.childId,
      })
    })

    const { url } = await res.json()

    // Rediriger vers Stripe
    window.location.href = url
  } else {
    // Inscription gratuite (logique actuelle)
    // ... code existant
  }
}

// Fonction de calcul du total
function calculateTotal(formData) {
  if (formData.type === 'INDIVIDUAL') {
    return event.price
  } else if (formData.type === 'CHILD') {
    return event.child_price || event.price
  } else if (formData.type === 'FAMILY') {
    const adultTotal = formData.numberOfAdults * event.price
    const childTotal = formData.numberOfChildren * (event.child_price || event.price)
    return adultTotal + childTotal
  }
  return 0
}
```

---

### 4. Page de Succès

**Créer** : `/app/evenements/inscription-success/page.tsx`

Page affichée après le paiement Stripe réussi.

```typescript
// app/evenements/inscription-success/page.tsx

export default function EventRegistrationSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Inscription confirmée !
        </h1>

        <p className="text-gray-600 mb-8">
          Votre paiement a été reçu avec succès. Un email de confirmation vous a été envoyé.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/evenements"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Voir tous les événements
          </a>
          <a
            href="/membre/evenements"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Mes inscriptions
          </a>
        </div>
      </div>
    </div>
  )
}
```

---

## 🧪 Tests

### Test 1 : Événement Payant INDIVIDUAL

1. Dans Directus, créez un événement avec :
   - `requires_payment` : ✅ true
   - `price` : 50.00
   - `child_price` : 25.00
2. Sur le site, ouvrez cet événement
3. Cliquez "S'inscrire"
4. Sélectionnez "INDIVIDUAL"
5. Remplissez le formulaire
6. Cliquez "Payer 50.00 CHF et s'inscrire"
7. ✅ Vous devez être redirigé vers Stripe Checkout
8. Utilisez la carte test : `4242 4242 4242 4242`
9. ✅ Après paiement, redirection vers `/evenements/inscription-success`
10. ✅ Email de confirmation reçu
11. ✅ Dans Prisma Studio, vérifiez :
    - Table `payments` : nouveau paiement avec `status: COMPLETED`
    - Table `event_registrations` : nouvelle inscription avec `status: CONFIRMED`

### Test 2 : Événement Payant FAMILY

1. Même événement
2. Sélectionnez "FAMILY"
3. Entrez : 2 adultes + 3 enfants
4. Total attendu : (2 × 50) + (3 × 25) = **175 CHF**
5. ✅ Vérifier que le total affiché est correct
6. Procéder au paiement
7. Vérifier email et base de données

### Test 3 : Événement Gratuit

1. Créez un événement avec `requires_payment` : ❌ false
2. L'inscription doit fonctionner comme avant (sans paiement)
3. Bouton : "S'inscrire" (pas "Payer...")

### Test 4 : Utilisateur Connecté vs Non Connecté

**Utilisateur connecté :**
- Email de confirmation doit dire : "Cette inscription est dans votre espace membre"
- Bouton : "Voir mes inscriptions"

**Utilisateur non connecté :**
- Email doit suggérer de créer un compte
- Bouton : "Créer mon compte"

---

## 🔍 Vérifications dans Stripe Dashboard

1. **Allez sur** : https://dashboard.stripe.com/test/payments
2. **Vérifiez** :
   - Paiement reçu avec le bon montant
   - Metadata contient : `type: EVENT_REGISTRATION`, `eventId`, etc.
   - Statut : `succeeded`

---

## 📧 Vérification des Emails

Si les emails ne s'envoient pas :

1. **Vérifier Resend** : https://resend.com/emails
2. **Vérifier les logs** :
   ```bash
   # Dans le terminal Next.js
   # Vous devriez voir :
   📧 Email de confirmation envoyé à: user@example.com
   ```
3. **Vérifier .env** :
   ```bash
   RESEND_API_KEY=re_...
   ```

---

## 🐛 Debug

### Webhook ne se déclenche pas

1. **Stripe CLI** doit tourner :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. **Logs webhook** :
   ```bash
   # Terminal Next.js
   📥 Webhook reçu - Type: EVENT_REGISTRATION Session: cs_...
   ```

### Erreur "Event not found" dans l'API

- Vérifiez que Directus tourne : http://localhost:8055
- Vérifiez que l'eventId existe dans Directus
- Vérifiez les logs :
  ```bash
  ❌ Événement introuvable
  ```

### Payment créé mais pas d'inscription

- Vérifiez les logs du webhook
- Vérifiez que `handleEventRegistrationPayment` est appelé
- Regardez Prisma Studio :
  - Table `payments` doit avoir l'entry
  - Table `event_registrations` aussi

---

## 📊 Monitoring

### Logs à surveiller

```bash
# API Checkout
✅ Session Stripe créée: cs_... Montant: 50 CHF

# Webhook
📥 Webhook reçu - Type: EVENT_REGISTRATION Session: cs_...
🎟️  Traitement inscription événement: 123
✅ Utilisateur trouvé: user@example.com
💰 Payment créé: uuid - 50 CHF
📝 Inscription créée: uuid - Statut: CONFIRMED
📧 Email de confirmation envoyé à: user@example.com
```

---

## 🎯 Prochaines Étapes (après tests)

Une fois que les événements payants fonctionnent :

1. **Phase 2** : Cotisations annuelles (120 CHF) avec approbation admin
2. **Phase 3** : Activités/Cours payants
3. **Phase 4** : Améliorations UX

---

## ⚠️ Important

- **Ne déployez PAS en production** tant que tous les tests ne sont pas validés
- **Utilisez toujours** les clés Stripe de test (commencent par `pk_test_...`)
- **Testez tous les scénarios** avant de passer en production
- **Documentez** tout problème rencontré

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans le terminal Next.js
2. Vérifiez les logs Stripe CLI
3. Vérifiez Prisma Studio
4. Vérifiez la console du navigateur (F12)

---

**Statut Actuel :** Backend terminé, configuration Directus et frontend restants
**Dernière mise à jour :** 2 décembre 2025
