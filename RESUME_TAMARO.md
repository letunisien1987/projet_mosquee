# 📝 Résumé : Intégration Widget Tamaro

## ✅ Ce qui a été fait

### 1. Composant créé
**Fichier** : `/components/TamaroWidget.tsx`
- Widget client-side React
- Chargement du script Tamaro via Next.js Script
- Configuration personnalisable (langue, montants, méthodes de paiement)

### 2. Page dons mise à jour
**Fichier** : `/app/dons/page.tsx`
- Nouvelle section "Faire un Don en Ligne" ajoutée
- Widget Tamaro intégré entre "Types de Dons" et "Projets en Cours"
- Design cohérent avec le reste du site

### 3. Documentation créée
**Fichier** : `/TAMARO_INTEGRATION.md`
- Guide complet étape par étape
- Options de personnalisation
- Checklist avant production

## 🔧 Configuration requise (À FAIRE)

### Étape 1 : Obtenir vos identifiants RaiseNow
Contactez RaiseNow pour obtenir votre **Organization ID (ePID)**

### Étape 2 : Mettre à jour le code
Remplacez `YOUR_ORGANIZATION_ID` par votre vrai ePID dans 2 fichiers :

#### Fichier 1 : `/components/TamaroWidget.tsx` (ligne 39)
```typescript
// Remplacez ceci :
src={`https://tamaro.raisenow.com/YOUR_ORGANIZATION_ID/latest/widget.js`}

// Par ceci (exemple avec votre ID) :
src={`https://tamaro.raisenow.com/mosquee-madretsch/latest/widget.js`}
```

#### Fichier 2 : `/app/dons/page.tsx` (ligne 114)
```typescript
// Remplacez ceci :
<TamaroWidget
  organizationId="YOUR_ORGANIZATION_ID"
  testMode={true}
/>

// Par ceci :
<TamaroWidget
  organizationId="mosquee-madretsch"  // Votre vrai ePID
  testMode={false}  // false en production
/>
```

### Étape 3 : Tester
1. Gardez `testMode={true}` pour les tests
2. Visitez http://localhost:3000/dons
3. Vérifiez que le widget s'affiche
4. Testez un don (ne sera pas débité en mode test)

### Étape 4 : Passer en production
1. Changez `testMode={false}`
2. Testez avec un petit montant réel
3. Vérifiez la réception dans votre dashboard RaiseNow

## 📍 Emplacement du widget sur la page

```
┌─────────────────────────────────┐
│ Hero Section (Verset coranique) │
├─────────────────────────────────┤
│ Types de Dons                   │
│ (Zakat, Sadaqa, Cotisation)    │
├─────────────────────────────────┤
│ 🆕 WIDGET TAMARO               │  ← Nouveau !
│ (Don en ligne sécurisé)        │
├─────────────────────────────────┤
│ Projets en Cours                │
│ (Rénovation, Bibliothèque...)  │
├─────────────────────────────────┤
│ IBAN & Coordonnées bancaires   │
├─────────────────────────────────┤
│ Avantages fiscaux               │
├─────────────────────────────────┤
│ Contact / Questions             │
└─────────────────────────────────┘
```

## 🎨 Personnalisation

### Montants suggérés
Modifiez dans `/components/TamaroWidget.tsx` ligne 22 :
```typescript
amounts: [50, 100, 200, 500], // CHF ou EUR
```

### Méthodes de paiement
Ligne 23 :
```typescript
paymentMethods: ['card', 'twint', 'paypal', 'postfinance', 'sepa'],
```

### Objectifs de dons
Lignes 26-31 :
```typescript
purposes: [
  { id: 'general', label: 'Don général' },
  { id: 'zakat', label: 'Zakat' },
  { id: 'sadaqa', label: 'Sadaqa' },
  { id: 'project', label: 'Projet spécifique' },
],
```

### Couleurs
Lignes 34-38 :
```typescript
theme: {
  colors: {
    primary: '#059669',   // Vert émeraude (comme votre site)
    secondary: '#D4AF37', // Or
  },
},
```

## 🚀 Commandes pour tester

```bash
# Lancer le serveur de développement
npm run dev

# Visiter la page dons
# → http://localhost:3000/dons

# Voir la console pour les erreurs
# → Ouvrir F12 dans le navigateur
```

## ⚠️ Points importants

1. **Mode test** : Gardez `testMode={true}` tant que vous testez
2. **Organization ID** : DOIT être fourni par RaiseNow
3. **Sécurité** : Tous les paiements sont gérés par RaiseNow (PCI-DSS)
4. **Frais** : Vérifiez les frais de transaction dans votre contrat RaiseNow

## 📞 Support

- **Documentation RaiseNow** : https://support.raisenow.com
- **API Documentation** : https://docs.raisenow.com/tamaro/
- **Support email** : support@raisenow.com

## ✅ Checklist finale

- [ ] Organization ID obtenu de RaiseNow
- [ ] Code mis à jour avec le bon ePID
- [ ] Tests effectués en mode test
- [ ] Don test réel effectué
- [ ] Réception confirmée dans dashboard RaiseNow
- [ ] `testMode={false}` activé
- [ ] Site déployé en production
- [ ] Formation équipe sur dashboard RaiseNow

---

**Prochaine étape** : Contactez RaiseNow pour obtenir votre Organization ID !
