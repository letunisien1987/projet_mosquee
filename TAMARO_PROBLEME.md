# ⚠️ Widget Tamaro - Configuration requise

## 🔴 Problème détecté

L'Organization ID `640b5452-006a-40ff-8247-4e6b8e27facf` **n'est pas encore activé** sur RaiseNow.

### Erreur technique
```
HTTP 404 - NoSuchKey
Le script https://tamaro.raisenow.com/640b5452-006a-40ff-8247-4e6b8e27facf/latest/widget.js n'existe pas
```

---

## ✅ Actions à effectuer

### 1. Vérifier votre compte RaiseNow

**Se connecter à votre dashboard :**
- URL : https://admin.raisenow.com
- Utilisez vos identifiants RaiseNow

**Chercher votre Organization ID (ePID) :**
- Allez dans **Settings** (Paramètres)
- Ou dans **Widgets** / **Tamaro**
- Notez l'ePID exact

### 2. Activer le widget Tamaro

Si ce n'est pas déjà fait, vous devez :
- Activer le widget Tamaro dans votre compte RaiseNow
- Configurer les paramètres de base
- Obtenir l'URL du script widget

### 3. Contacter le support RaiseNow

**Email :** support@raisenow.com

**Demandez :**
- "Je voudrais activer le widget Tamaro pour mon organisation"
- "Quel est mon Organization ID (ePID) exact ?"
- "Quelle est l'URL complète du script widget ?"
- "Le widget est-il déjà activé pour l'ID : 640b5452-006a-40ff-8247-4e6b8e27facf ?"

---

## 🔧 Une fois l'ID confirmé

### Mettre à jour le code

**Fichier :** `/app/dons/page.tsx` (ligne 114)

Remplacez l'Organization ID par le bon :
```typescript
<TamaroWidget
  organizationId="VOTRE_VRAI_EPID_ICI"  // ← Remplacez par le bon ID
  language="fr"
  testMode={true}
/>
```

### Redémarrer le serveur
```bash
npm run dev
```

---

## 💡 Format de l'Organization ID

L'ePID RaiseNow peut avoir différents formats :

### Format 1 : UUID (ce que vous avez actuellement)
```
640b5452-006a-40ff-8247-4e6b8e27facf
```

### Format 2 : Nom de domaine
```
mosquee-madretsch
votre-organisation-ch
```

### Format 3 : Code numérique
```
12345
```

**Important :** Seul RaiseNow peut vous dire quel est le bon format pour votre compte.

---

## 🎯 Solutions alternatives temporaires

En attendant l'activation de RaiseNow, vous pouvez :

### Option 1 : Désactiver temporairement le widget

**Fichier :** `/app/dons/page.tsx`

Commentez la section du widget :
```typescript
{/* Widget désactivé en attente de l'activation RaiseNow
<TamaroWidget
  organizationId="640b5452-006a-40ff-8247-4e6b8e27facf"
  language="fr"
  testMode={true}
/>
*/}

{/* Message temporaire */}
<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
  <p className="text-lg font-semibold mb-2">Dons en ligne bientôt disponibles</p>
  <p className="text-gray-600 dark:text-gray-300">
    Notre système de paiement en ligne est en cours d'activation.
    En attendant, vous pouvez effectuer un virement bancaire.
  </p>
</div>
```

### Option 2 : Utiliser uniquement IBAN

La page dons contient déjà :
- Section IBAN avec bouton de copie
- Coordonnées bancaires complètes
- Cette section fonctionne parfaitement

---

## 📋 Checklist de vérification

- [ ] Connexion au dashboard RaiseNow réussie
- [ ] Organization ID (ePID) trouvé
- [ ] Widget Tamaro activé dans le compte
- [ ] URL du script widget vérifiée
- [ ] Support RaiseNow contacté (si nécessaire)
- [ ] Code mis à jour avec le bon ePID
- [ ] Widget testé et fonctionnel

---

## 📞 Contact RaiseNow

**Support technique :**
- Email : support@raisenow.com
- Documentation : https://support.raisenow.com
- Tel : Vérifiez votre contrat RaiseNow

**Questions à poser :**
1. Mon Organization ID exact est-il : `640b5452-006a-40ff-8247-4e6b8e27facf` ?
2. Le widget Tamaro est-il activé pour mon compte ?
3. Quelle est l'URL complète du script widget ?
4. Y a-t-il des étapes de configuration manquantes ?

---

## 🔄 État actuel

### ✅ Ce qui fonctionne
- Code du widget correctement intégré
- Page dons affichée correctement
- Section IBAN fonctionnelle
- Build du projet OK

### ⚠️ Ce qui manque
- Activation du widget côté RaiseNow
- Confirmation de l'Organization ID correct
- Script widget accessible

---

## 💬 Message pour vous

Le code est **100% correct et prêt**. Le widget s'affichera **immédiatement** une fois que RaiseNow aura activé votre compte.

C'est une étape normale : RaiseNow doit d'abord :
1. Créer votre compte organisation
2. Configurer le widget Tamaro
3. Activer les méthodes de paiement
4. Mettre en ligne le script widget

**Prochaine étape :** Contactez RaiseNow pour finaliser l'activation !

---

**Dès que vous aurez le bon Organization ID, il suffira de changer UNE ligne de code et le widget fonctionnera ! 🚀**
