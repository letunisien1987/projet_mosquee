# 🚨 Widget RaiseNow - Activation de l'UUID

## ⚠️ Problème Actuel

Le widget Tamaro ne peut pas se charger car **l'UUID n'est pas encore activé** sur RaiseNow.

**UUID actuel** : `640b5452-006a-40ff-8247-4e6b8e27facf`

**Erreur** : Le script `https://tamaro.raisenow.com/640b5452-006a-40ff-8247-4e6b8e27facf/latest/widget.js` retourne une erreur 404.

---

## ✅ Solution Temporaire en Place

Le widget affiche automatiquement un **bouton de redirection** vers votre page RaiseNow qui fonctionne :

👉 **https://donate.raisenow.io/ftwhv?lng=fr**

Vos donateurs peuvent donc **faire des dons dès maintenant** via ce lien !

---

## 📞 Étapes pour Activer l'UUID

### 1. Contactez RaiseNow

**Email** : support@raisenow.com
**Téléphone** : +41 44 500 48 50 (Suisse)

**Message à envoyer** :

```
Objet : Activation du widget Tamaro pour l'UUID 640b5452-006a-40ff-8247-4e6b8e27facf

Bonjour,

Nous souhaitons intégrer le widget Tamaro sur notre site web pour permettre les dons en ligne.

UUID de notre organisation : 640b5452-006a-40ff-8247-4e6b8e27facf

Pouvez-vous activer le widget Tamaro pour cet UUID afin que nous puissions l'intégrer sur notre site ?

Le widget devrait être accessible à cette URL :
https://tamaro.raisenow.com/640b5452-006a-40ff-8247-4e6b8e27facf/latest/widget.js

Merci d'avance !

Cordialement,
[Votre nom]
[Nom de la mosquée]
```

### 2. Informations qu'ils peuvent vous demander

Préparez ces informations :
- **Nom de votre organisation** : Association Mosquée Al-Nour (ou votre nom)
- **Site web** : Votre URL de production
- **Objectif** : Intégrer le widget de dons sur la page /dons
- **Méthodes de paiement souhaitées** : Carte, TWINT, PayPal, PostFinance, SEPA
- **Pays** : Suisse / France (selon votre localisation)

### 3. Configuration RaiseNow

Une fois l'UUID activé, demandez-leur de configurer :

#### Méthodes de paiement
- ✅ Carte bancaire (Visa, Mastercard)
- ✅ TWINT (si Suisse)
- ✅ PayPal
- ✅ PostFinance (si Suisse)
- ✅ Virement SEPA

#### Objectifs de dons (Purposes)
Demandez à RaiseNow de créer ces objectifs dans votre compte :

1. **Don général** (`general`)
2. **Zakat** (`zakat`)
3. **Sadaqa** (`sadaqa`)
4. **Rénovation mosquée** (`renovation`)
5. **Éducation & Cours** (`education`)
6. **Campagne Ramadan** (`ramadan`)

#### Reçus fiscaux
- Demandez l'activation des **reçus fiscaux automatiques**
- Configurez le **modèle de reçu** avec le nom de votre mosquée
- Définissez la **déduction fiscale** selon votre pays (66% en France)

---

## 🧪 Vérifier l'Activation

### Test 1 : Vérifier le script

Ouvrez cette URL dans votre navigateur :
```
https://tamaro.raisenow.com/640b5452-006a-40ff-8247-4e6b8e27facf/latest/widget.js
```

**Si activé** : Vous verrez du code JavaScript
**Si pas activé** : Erreur 404

### Test 2 : Tester le widget sur votre site

1. Démarrez votre site : `npm run dev`
2. Allez sur : http://localhost:3000/dons
3. Si l'UUID est activé, vous verrez le formulaire de don intégré
4. Sinon, vous verrez le bouton de redirection (solution temporaire)

---

## 🔄 Une Fois l'UUID Activé

### Le widget s'affichera automatiquement

Dès que RaiseNow active votre UUID :
1. Le widget se chargera automatiquement
2. Le bouton de redirection disparaîtra
3. Vos donateurs pourront faire des dons directement sur votre page

**Aucune modification de code n'est nécessaire** - tout est déjà configuré !

### Activer le Mode Test

Avant de passer en production, testez avec `testMode={true}` :

**Fichier** : `/app/dons/page.tsx`

```typescript
<TamaroWidget
  language="fr"
  testMode={true}  // ← Mode test activé
/>
```

**En mode test** :
- Les paiements ne sont PAS réels
- Utilisez des cartes de test
- Vérifiez que tout fonctionne

**Carte de test** :
- Numéro : `4111 1111 1111 1111`
- Date : N'importe quelle date future
- CVV : `123`

### Passer en Production

Une fois les tests OK :

```typescript
<TamaroWidget
  language="fr"
  testMode={false}  // ← Mode production
/>
```

---

## 📊 Alternative : Utiliser le Lien Direct

Si l'activation de l'UUID prend trop de temps, vous pouvez continuer avec le **bouton de redirection** :

**Avantages** :
- ✅ Fonctionne immédiatement
- ✅ Même système de paiement sécurisé
- ✅ Toutes les méthodes de paiement disponibles
- ✅ Dashboard RaiseNow pour gérer les dons

**Inconvénient** :
- ⚠️ Redirection vers une autre page (au lieu d'un formulaire intégré)

Le bouton de redirection s'affiche **automatiquement** si le widget ne peut pas se charger, donc vos donateurs peuvent quand même faire des dons !

---

## 🎯 Résumé

### État Actuel
- ❌ Widget Tamaro : Pas encore activé
- ✅ Bouton de redirection : Fonctionnel
- ✅ Dons possibles : OUI via https://donate.raisenow.io/ftwhv?lng=fr

### Prochaines Étapes
1. Contactez RaiseNow pour activer l'UUID
2. Une fois activé, le widget s'affichera automatiquement
3. Testez en mode test
4. Passez en production

### En Attendant
Vos donateurs peuvent faire des dons via le **bouton de redirection** qui fonctionne parfaitement.

---

## 📞 Contact RaiseNow

**Email** : support@raisenow.com
**Téléphone** : +41 44 500 48 50
**Site** : https://www.raisenow.com
**Dashboard** : https://admin.raisenow.com

N'hésitez pas à les contacter - leur support est réactif et vous aidera à activer le widget ! 🚀
