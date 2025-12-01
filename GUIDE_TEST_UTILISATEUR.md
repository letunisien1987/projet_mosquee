# 🧪 Guide de Test Complet - Comme un Utilisateur Normal

**Date**: 1er décembre 2025
**Version**: 1.0

Ce guide vous permet de tester **TOUTES** les fonctionnalités de l'espace membre en tant qu'utilisateur normal, sans passer par des scripts.

---

## 🎯 Objectif

Tester chaque fonctionnalité depuis l'interface web, exactement comme un utilisateur réel le ferait.

---

## 🔐 Compte de Test

**Email**: `ahmedelghoudi@gmail.com`
**Mot de passe**: `password123`

---

## ✅ Checklist Complète de Test

### 1️⃣ CONNEXION ET DASHBOARD

#### ✅ Test de Connexion

1. Allez sur http://localhost:3000/connexion
2. Entrez :
   - Email: `ahmedelghoudi@gmail.com`
   - Mot de passe: `password123`
3. Cliquez sur **Se connecter**

**✅ Résultat attendu**:
- Redirection vers `/membre/dashboard`
- Message de bienvenue avec votre prénom
- 4 cartes statistiques affichées

#### ✅ Vérification Dashboard

Sur `/membre/dashboard`, vérifiez :

- [ ] **Mes Dons** : Affiche un nombre > 0
- [ ] **Mes Événements** : Affiche un nombre > 0
- [ ] **Mes Activités** : Affiche un nombre > 0
- [ ] **Mes Cotisations** : Affiche un nombre > 0

**✅ Résultat attendu**: Toutes les cartes affichent des nombres corrects

---

### 2️⃣ GESTION DES ÉVÉNEMENTS

#### ✅ Test 1: Voir mes inscriptions événements

1. Cliquez sur **Mes Événements** dans le menu
2. Ou allez sur http://localhost:3000/membre/evenements

**✅ Résultat attendu**:
- Liste de vos inscriptions événements
- Statistiques en haut (Total, Confirmées, En attente, Annulées)
- Chaque événement affiche :
  - Titre
  - Statut (badge coloré)
  - Notes si disponibles
  - Bouton "Annuler ma participation" si CONFIRMED

#### ✅ Test 2: Annuler une inscription événement

1. Sur `/membre/evenements`
2. Trouvez un événement avec statut **CONFIRMED** (badge vert)
3. Cliquez sur **"Annuler ma participation"**
4. Confirmez l'annulation dans la popup

**✅ Résultat attendu**:
- Popup de confirmation apparaît
- Après confirmation :
  - Message "Votre inscription a été annulée avec succès"
  - La page se rafraîchit automatiquement
  - Le statut change en **CANCELLED** (badge rouge)
  - Le bouton d'annulation disparaît
  - Email d'annulation envoyé à votre boîte mail

**📧 Vérifiez votre email**: Vous devriez recevoir "Annulation d'inscription - [Nom événement]"

#### ✅ Test 3: S'inscrire à un nouvel événement

1. Allez sur http://localhost:3000/evenements
2. Choisissez un événement
3. Cliquez sur **S'inscrire**
4. Remplissez le formulaire :
   - Prénom
   - Nom
   - Email
   - Téléphone
   - Nombre de participants
   - Notes (optionnel)
5. Cliquez sur **S'inscrire**

**✅ Résultat attendu**:
- Message de confirmation
- Redirection ou modal fermé
- L'événement apparaît dans `/membre/evenements`
- Email de confirmation reçu

**📧 Vérifiez votre email**: "Inscription confirmée - [Nom événement]"

---

### 3️⃣ GESTION DES ACTIVITÉS

#### ✅ Test 1: Voir mes inscriptions activités

1. Cliquez sur **Mes Activités** dans le menu
2. Ou allez sur http://localhost:3000/membre/activites

**✅ Résultat attendu**:
- Liste de vos inscriptions activités
- Pour chaque inscription :
  - Nom de l'activité
  - Nom de l'enfant
  - Statut (PENDING, APPROVED, etc.)
  - Notes

#### ✅ Test 2: Inscrire un enfant à une activité

1. Allez sur http://localhost:3000/activites
2. Choisissez une activité
3. Cliquez sur **S'inscrire**
4. Remplissez le formulaire :
   - Informations parent (pré-remplies si connecté)
   - Informations enfant :
     - Prénom
     - Nom
     - Date de naissance
   - Notes (optionnel)
5. Cliquez sur **Envoyer la demande**

**✅ Résultat attendu**:
- Message de confirmation
- L'inscription apparaît dans `/membre/activites`
- Statut: PENDING ou APPROVED selon la configuration
- Email de confirmation reçu

**📧 Vérifiez votre email**: "Inscription reçue" ou "Inscription confirmée - [Nom activité]"

---

### 4️⃣ GESTION DES DONS

#### ✅ Test 1: Voir mes dons

1. Cliquez sur **Mes Dons** dans le menu
2. Ou allez sur http://localhost:3000/membre/dons

**✅ Résultat attendu**:
- Liste de tous vos dons
- Pour chaque don :
  - Montant
  - Type (Zakat, Sadaqa, etc.)
  - Date
  - Projet (si applicable)
  - Message

#### ✅ Test 2: Faire un nouveau don

1. Allez sur http://localhost:3000/dons
2. Remplissez le formulaire :
   - Prénom, Nom
   - Email, Téléphone
   - Montant (ex: 100)
   - Type de don (Zakat, Sadaqa, etc.)
   - Projet (si applicable)
   - Message (optionnel)
   - Cochez "Don anonyme" si souhaité
3. Cliquez sur **Faire un don**

**✅ Résultat attendu**:
- Message de confirmation
- Le don apparaît dans `/membre/dons`
- Le total est mis à jour dans le dashboard
- Email de remerciement reçu

**📧 Vérifiez votre email**: "Merci pour votre don - Mosquée Madretsch"

---

### 5️⃣ GESTION DES COTISATIONS

#### ✅ Test 1: Voir mes cotisations

1. Cliquez sur **Mes Cotisations** dans le menu
2. Ou allez sur http://localhost:3000/membre/cotisations

**✅ Résultat attendu**:
- Liste de vos cotisations
- Pour chaque cotisation :
  - Type (INDIVIDUAL, FAMILY, etc.)
  - Montant
  - Date de début
  - Date de fin
  - Statut (ACTIVE, EXPIRED)

---

### 6️⃣ DEMANDES DE SERVICE

#### ✅ Test 1: Faire une demande de service

1. Allez sur http://localhost:3000/services
2. Choisissez un type de service :
   - Mariage
   - Funérailles
   - Shahada
   - Aqiqa
3. Remplissez le formulaire :
   - Prénom, Nom
   - Email, Téléphone
   - Date souhaitée (optionnel)
   - Détails de la demande
4. Cliquez sur **Envoyer la demande**

**✅ Résultat attendu**:
- Message de confirmation
- La demande est sauvegardée
- Statut: PENDING
- Email de confirmation reçu

**📧 Vérifiez votre email**: "Demande de service reçue - [Type de service]"

---

### 7️⃣ MESSAGES DE CONTACT

#### ✅ Test 1: Envoyer un message de contact

1. Allez sur http://localhost:3000/contact
2. Remplissez le formulaire :
   - Prénom, Nom
   - Email, Téléphone
   - Sujet
   - Message
3. Cliquez sur **Envoyer**

**✅ Résultat attendu**:
- Message de confirmation
- Le message est sauvegardé
- Email de confirmation reçu

**📧 Vérifiez votre email**: "Message reçu - Mosquée Madretsch"

---

### 8️⃣ GESTION DU PROFIL

#### ✅ Test 1: Voir et modifier mon profil

1. Cliquez sur **Mon Profil** dans le menu
2. Ou allez sur http://localhost:3000/membre/profil

**✅ Résultat attendu**:
- Affichage de vos informations personnelles
- Formulaire de modification disponible
- Bouton **Enregistrer** fonctionne

#### ✅ Test 2: Modifier mes informations

1. Sur `/membre/profil`
2. Modifiez un champ (ex: téléphone)
3. Cliquez sur **Enregistrer**

**✅ Résultat attendu**:
- Message de confirmation
- Les changements sont sauvegardés
- Rafraîchissez la page pour vérifier

---

### 9️⃣ GESTION DES ENFANTS

#### ✅ Test 1: Voir mes enfants

1. Sur `/membre/profil` ou dans la section enfants
2. Liste de tous vos enfants

**✅ Résultat attendu**:
- Affichage de :
  - Prénom, Nom
  - Date de naissance
  - Âge calculé
  - Inscriptions liées

#### ✅ Test 2: Ajouter un enfant

1. Cliquez sur **Ajouter un enfant**
2. Remplissez :
   - Prénom
   - Nom
   - Date de naissance
3. Cliquez sur **Enregistrer**

**✅ Résultat attendu**:
- L'enfant est ajouté à la liste
- Disponible pour les inscriptions activités

---

### 🔟 DÉCONNEXION

#### ✅ Test de Déconnexion

1. Cliquez sur votre nom en haut à droite
2. Cliquez sur **Se déconnecter**

**✅ Résultat attendu**:
- Redirection vers la page d'accueil
- Session fermée
- Impossible d'accéder à `/membre/*` sans se reconnecter

---

## 📧 Checklist des Emails

Après avoir effectué tous les tests, vérifiez votre boîte mail `ahmedelghoudi@gmail.com` :

- [ ] **Email de bienvenue** (si nouveau compte)
- [ ] **Confirmation inscription événement**
- [ ] **Annulation inscription événement**
- [ ] **Confirmation inscription activité**
- [ ] **Remerciement don**
- [ ] **Confirmation demande de service**
- [ ] **Confirmation message de contact**

**Total attendu**: 6-7 emails selon les tests effectués

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: "Non autorisé" lors de l'annulation

**Cause**: Pas connecté ou session expirée
**Solution**: Reconnectez-vous sur `/connexion`

### Problème 2: Aucun événement dans "Mes Événements"

**Cause**: Pas encore d'inscription
**Solution**: Inscrivez-vous à un événement depuis `/evenements`

### Problème 3: Email non reçu

**Cause**: Rate limit Resend (2 emails/seconde en gratuit)
**Solution**: Attendez quelques secondes entre chaque test

### Problème 4: Bouton d'annulation ne marche pas

**Cause**: JavaScript désactivé ou erreur réseau
**Solution**:
- Vérifiez la console du navigateur (F12)
- Vérifiez que le serveur Next.js tourne
- Essayez de rafraîchir la page

---

## 📊 Résultats Attendus

Après avoir complété TOUS les tests :

### Dans le Dashboard (`/membre/dashboard`)

```
✅ Mes Dons: [Nombre > 0]
✅ Mes Événements: [Nombre > 0]
✅ Mes Activités: [Nombre > 0]
✅ Mes Cotisations: [Nombre > 0]
```

### Dans la Base de Données

Pour l'utilisateur `ahmedelghoudi@gmail.com` :

- Dons : Augmenté de +1
- Événements : +1 inscription, +1 annulation
- Activités : +1 inscription
- Services : +1 demande
- Messages : +1 message
- Enfants : Peut-être +1 selon les tests

### Dans la Boîte Mail

Minimum **6 emails** reçus avec des sujets différents

---

## 🎯 Critères de Succès

Le test est **RÉUSSI** si :

- [x] Connexion fonctionne
- [x] Dashboard affiche les bonnes statistiques
- [x] Toutes les pages se chargent sans erreur
- [x] Inscription événement fonctionne + email reçu
- [x] **Annulation événement fonctionne + email reçu**
- [x] Inscription activité fonctionne + email reçu
- [x] Don fonctionne + email reçu
- [x] Demande service fonctionne + email reçu
- [x] Message contact fonctionne + email reçu
- [x] Profil modifiable
- [x] Déconnexion fonctionne

---

## 🔧 Commandes Utiles

### Vérifier le serveur Next.js

```bash
# Vérifier que le serveur tourne
curl http://localhost:3000
```

### Vérifier la base de données

```bash
# Ouvrir Prisma Studio
npx prisma studio --port 5556
```

### Consulter les logs

```bash
# Logs du serveur Next.js (terminal où vous avez lancé npm run dev)
# Cherchez les erreurs ou les messages de succès
```

---

## 📝 Rapport de Test

Après avoir effectué tous les tests, remplissez ce rapport :

### Informations Générales

- **Date du test**: ____________________
- **Navigateur**: ____________________
- **Email utilisé**: `ahmedelghoudi@gmail.com`

### Tests Réussis

- [ ] Connexion
- [ ] Dashboard
- [ ] Voir mes événements
- [ ] Annuler un événement
- [ ] S'inscrire à un événement
- [ ] Voir mes activités
- [ ] S'inscrire à une activité
- [ ] Voir mes dons
- [ ] Faire un don
- [ ] Voir mes cotisations
- [ ] Demande de service
- [ ] Message de contact
- [ ] Voir/modifier profil
- [ ] Déconnexion

### Emails Reçus

- [ ] Bienvenue (si nouveau compte)
- [ ] Confirmation événement
- [ ] Annulation événement
- [ ] Confirmation activité
- [ ] Remerciement don
- [ ] Confirmation service
- [ ] Confirmation contact

### Problèmes Rencontrés

_______________________________________________
_______________________________________________
_______________________________________________

### Notes

_______________________________________________
_______________________________________________
_______________________________________________

---

## ✅ Conclusion

Si TOUS les tests passent et que TOUS les emails sont reçus, alors l'espace membre fonctionne **parfaitement** ! 🎉

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025
**Version**: 1.0

Pour toute question ou problème, consultez les fichiers :
- `TESTS_COMPLETS_EFFECTUES.md` - Résultats des tests automatiques
- `CORRECTION_ESPACE_MEMBRE.md` - Corrections apportées
- `EMAIL_CONFIGURATION.md` - Configuration des emails
