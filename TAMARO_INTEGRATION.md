# 🎁 Guide d'intégration du widget Tamaro RaiseNow

## 📋 Étapes de configuration

### 1. Obtenir vos identifiants RaiseNow

Contactez RaiseNow pour obtenir :
- **Organization ID (ePID)** : Votre identifiant unique
- Exemple : `mosquee-madretsch` ou un code numérique

### 2. Mettre à jour le composant TamaroWidget

Ouvrez le fichier `/components/TamaroWidget.tsx` et modifiez la ligne 39 :

```typescript
// AVANT
<Script
  src={`https://tamaro.raisenow.com/YOUR_ORGANIZATION_ID/latest/widget.js`}
  ...
/>

// APRÈS (remplacez YOUR_ORGANIZATION_ID par votre vrai ePID)
<Script
  src={`https://tamaro.raisenow.com/mosquee-madretsch/latest/widget.js`}
  ...
/>
```

### 3. Configurer le widget dans la page dons

Ouvrez `/app/dons/page.tsx` et modifiez la ligne 114 :

```typescript
// AVANT
<TamaroWidget
  organizationId="YOUR_ORGANIZATION_ID"
  language="fr"
  testMode={true}
/>

// APRÈS (remplacez par votre ePID et mettez testMode à false en production)
<TamaroWidget
  organizationId="mosquee-madretsch"
  language="fr"
  testMode={false}  // false en production, true pour tester
/>
```

## 🎨 Personnalisation du widget

### Options de configuration disponibles

Dans `/components/TamaroWidget.tsx`, vous pouvez personnaliser :

#### Montants suggérés
```typescript
amounts: [50, 100, 200, 500], // Montants en CHF ou EUR
defaultAmount: 100,
```

#### Méthodes de paiement
```typescript
paymentMethods: ['card', 'twint', 'paypal', 'postfinance', 'sepa'],
```

Options disponibles :
- `card` : Carte bancaire
- `twint` : TWINT (Suisse)
- `paypal` : PayPal
- `postfinance` : PostFinance (Suisse)
- `sepa` : Virement SEPA
- `invoice` : Facture (BVR)

#### Objectifs/Projets de dons
```typescript
purposes: [
  { id: 'general', label: 'Don général' },
  { id: 'zakat', label: 'Zakat' },
  { id: 'sadaqa', label: 'Sadaqa' },
  { id: 'project', label: 'Projet spécifique' },
],
```

#### Personnalisation des couleurs
```typescript
theme: {
  colors: {
    primary: '#059669',   // Couleur principale (emerald)
    secondary: '#D4AF37', // Couleur or
  },
},
```

### Configuration avancée

Pour plus d'options, consultez la documentation RaiseNow :
https://docs.raisenow.com/tamaro/

Options avancées :
- Dons récurrents (mensuel, annuel)
- Collecte d'informations donateurs
- Champs personnalisés
- Confirmation par email
- Certificats fiscaux automatiques

## 🧪 Mode test

### Tester le widget AVANT la mise en production

1. Gardez `testMode={true}` dans la configuration
2. Les paiements en mode test ne sont PAS débités
3. Vous pouvez utiliser des cartes de test RaiseNow

### Passer en production

1. Changez `testMode={false}`
2. Vérifiez que votre Organization ID est correct
3. Testez avec un petit montant réel
4. Vérifiez que les dons arrivent bien dans votre compte RaiseNow

## 📍 Emplacement du widget

Le widget est intégré dans la page `/app/dons/page.tsx` :
- **Position** : Après la section "Types de Dons"
- **Avant** : La section "Projets en Cours"

## 🔒 Sécurité

- Tous les paiements sont traités par RaiseNow (certifié PCI-DSS)
- Aucune donnée de carte bancaire ne transite par votre serveur
- Les transactions sont cryptées SSL/TLS

## 📊 Suivi des dons

1. Connectez-vous à votre dashboard RaiseNow
2. Consultez les rapports de dons
3. Exportez les données pour votre comptabilité
4. Envoyez des reçus fiscaux automatiquement

## 🆘 Support

En cas de problème :
1. Vérifiez que l'Organization ID est correct
2. Consultez la console du navigateur (F12) pour les erreurs
3. Contactez le support RaiseNow : support@raisenow.com
4. Documentation : https://support.raisenow.com

## ✅ Checklist avant production

- [ ] Organization ID correct dans TamaroWidget.tsx
- [ ] Organization ID correct dans dons/page.tsx
- [ ] testMode = false
- [ ] Test d'un don réel effectué
- [ ] Vérification de la réception dans RaiseNow
- [ ] Configuration des emails de confirmation
- [ ] Configuration des reçus fiscaux
- [ ] Formation du personnel sur le dashboard RaiseNow

## 📝 Notes importantes

1. **Frais RaiseNow** : Vérifiez les frais de transaction avec votre contrat
2. **Dons récurrents** : Activez cette option si nécessaire
3. **Multi-devise** : CHF, EUR, USD supportés selon votre contrat
4. **Langues** : fr, de, it, en disponibles

---

**Besoin d'aide ?** Contactez votre gestionnaire de compte RaiseNow.



