# 🧪 GUIDE DE TEST DANS LE NAVIGATEUR

**Date**: 1er décembre 2025
**Système testé**: Gestion des enfants (CRUD complet)

---

## 🎯 OBJECTIF

Tester en conditions réelles toutes les fonctionnalités de gestion des enfants :
- ✅ Ajout d'un enfant
- ✅ Affichage de la liste des enfants
- ✅ Modification d'un enfant
- ✅ Suppression d'un enfant
- ✅ Statistiques et compteurs
- ✅ Validation des formulaires

---

## 📋 PRÉREQUIS

### 1. Serveur en cours d'exécution
```bash
# Vérifier que le serveur Next.js tourne
curl http://localhost:3000
```
✅ **Statut**: Le serveur répond correctement

### 2. Base de données migrée
```bash
npx prisma db push --accept-data-loss
```
✅ **Statut**: Migration appliquée avec succès

### 3. Utilisateur connecté
Vous devez avoir un compte utilisateur et être connecté.

---

## 🧪 SCÉNARIOS DE TEST

### TEST 1: Accéder à la page de gestion des enfants

#### Étapes:
1. Ouvrir le navigateur
2. Aller sur **http://localhost:3000**
3. Se connecter si nécessaire
4. Naviguer vers **/membre/dashboard/enfants**

#### Résultat attendu:
- ✅ La page charge sans erreur
- ✅ Le titre "Mes Enfants" s'affiche
- ✅ Message "Aucun enfant ajouté" si liste vide
- ✅ Bouton "Ajouter un enfant" visible
- ✅ Statistiques à 0 (Total: 0, Activités: 0, Événements: 0)

---

### TEST 2: Ajouter un premier enfant

#### Étapes:
1. Sur la page `/membre/dashboard/enfants`
2. Cliquer sur **"Ajouter un enfant"**
3. Remplir le formulaire:
   - **Prénom**: Amira
   - **Nom**: Benali
   - **Surnom**: Mimi (optionnel)
   - **Date de naissance**: 15/05/2018 (environ 6 ans)
   - **Genre**: 👧 Fille
   - **Notes**: Allergie aux arachides
4. Cliquer sur **"Ajouter"**

#### Résultat attendu:
- ✅ Modal se ferme automatiquement
- ✅ Message "Enfant enregistré avec succès"
- ✅ La liste se recharge
- ✅ Une carte "Amira Benali" apparaît
- ✅ Initiales "AB" ou photo si URL fournie
- ✅ Âge "6 ans" affiché
- ✅ Icône 👧 visible
- ✅ Note affichée dans le bandeau jaune
- ✅ Compteur "Total enfants" = 1
- ✅ Statistiques activités et événements = 0

---

### TEST 3: Ajouter un deuxième enfant

#### Étapes:
1. Cliquer sur **"Ajouter un enfant"**
2. Remplir le formulaire:
   - **Prénom**: Youssef
   - **Nom**: Benali
   - **Date de naissance**: 10/03/2015 (environ 9 ans)
   - **Genre**: 👦 Garçon
   - **Notes**: Asthme
3. Cliquer sur **"Ajouter"**

#### Résultat attendu:
- ✅ Deuxième carte apparaît
- ✅ "Youssef Benali" visible
- ✅ Âge "9 ans"
- ✅ Icône 👦
- ✅ Compteur "Total enfants" = 2
- ✅ Les deux cartes sont visibles côte à côte

---

### TEST 4: Modifier un enfant

#### Étapes:
1. Sur la carte "Amira Benali"
2. Cliquer sur **"Modifier"**
3. Modifier les informations:
   - **Surnom**: Amoura (au lieu de Mimi)
   - **Notes**: Allergie aux arachides et aux noix
4. Cliquer sur **"Modifier"**

#### Résultat attendu:
- ✅ Modal se ferme
- ✅ Message "Enfant modifié avec succès"
- ✅ Carte se met à jour avec "Amoura"
- ✅ Notes mises à jour dans le bandeau jaune

---

### TEST 5: Tenter de supprimer un enfant sans inscriptions

#### Étapes:
1. Sur la carte "Youssef Benali"
2. Cliquer sur **"Supprimer"**
3. Confirmer la suppression dans la boîte de dialogue

#### Résultat attendu:
- ✅ Message de confirmation du navigateur apparaît
- ✅ Après confirmation: "Enfant supprimé avec succès"
- ✅ La carte "Youssef Benali" disparaît
- ✅ Compteur "Total enfants" = 1
- ✅ Seule "Amira Benali" reste affichée

---

### TEST 6: Validation du formulaire

#### Étapes:
1. Cliquer sur **"Ajouter un enfant"**
2. Essayer de soumettre le formulaire VIDE
3. Remplir uniquement le prénom
4. Essayer de soumettre

#### Résultat attendu:
- ✅ Formulaire vide : messages d'erreur HTML5
- ✅ Champs requis marqués en rouge
- ✅ Impossible de soumettre sans remplir tous les champs obligatoires
- ✅ Messages d'erreur clairs (ex: "Le prénom doit contenir au moins 2 caractères")

---

### TEST 7: Ajouter un enfant avec photo

#### Étapes:
1. Cliquer sur **"Ajouter un enfant"**
2. Remplir le formulaire:
   - **Prénom**: Leila
   - **Nom**: Benali
   - **Date de naissance**: 20/08/2016
   - **Genre**: 👧 Fille
   - **URL de la photo**: https://via.placeholder.com/150
3. Cliquer sur **"Ajouter"**

#### Résultat attendu:
- ✅ Aperçu de la photo dans le formulaire
- ✅ Carte affiche la photo au lieu des initiales
- ✅ Photo ronde, bien dimensionnée

---

### TEST 8: Statistiques après inscriptions (À tester plus tard)

#### Étapes:
1. Inscrire "Amira" à un événement (via `/evenements`)
2. Inscrire "Leila" à une activité (via `/activites`)
3. Retourner sur `/membre/dashboard/enfants`

#### Résultat attendu:
- ✅ Carte "Amira" : Événements = 1
- ✅ Carte "Leila" : Activités = 1
- ✅ Statistiques globales mises à jour
- ✅ Tentative de supprimer "Amira" : message d'erreur
  - "Impossible de supprimer cet enfant. Inscriptions actives: Événements: 1"

---

## ✅ CHECKLIST COMPLÈTE

### Interface
- [ ] Page charge sans erreur 404
- [ ] Design responsive (mobile, tablette, desktop)
- [ ] Animations fluides
- [ ] Icônes affichées correctement (Lucide React)
- [ ] Couleurs cohérentes avec le thème

### Fonctionnalités
- [ ] Ajout d'enfant fonctionne
- [ ] Modification d'enfant fonctionne
- [ ] Suppression d'enfant (sans inscriptions) fonctionne
- [ ] Suppression bloquée si inscriptions actives
- [ ] Statistiques mises à jour en temps réel
- [ ] Modal s'ouvre et se ferme correctement
- [ ] Validation des champs obligatoires
- [ ] Calcul d'âge correct

### API
- [ ] GET /api/account/children retourne la liste
- [ ] POST /api/account/children ajoute un enfant
- [ ] PATCH /api/account/children/[id] met à jour
- [ ] DELETE /api/account/children/[id] supprime
- [ ] Messages d'erreur en français
- [ ] Codes HTTP corrects (200, 201, 400, 404, 500)

### Sécurité
- [ ] Impossible d'accéder sans authentification
- [ ] Un parent ne voit que SES enfants
- [ ] Impossible de modifier l'enfant d'un autre parent
- [ ] Protection contre les injections SQL (Prisma)

---

## 🐛 BUGS POTENTIELS À VÉRIFIER

### 1. Date de naissance dans le futur
**Test**: Essayer d'entrer une date future
**Attendu**: Champ date bloque les dates futures (max=today)

### 2. URL d'avatar invalide
**Test**: Entrer une URL cassée (ex: "abc")
**Attendu**: Validation HTML5 empêche la soumission OU photo ne s'affiche pas mais formulaire fonctionne

### 3. Âge négatif
**Test**: Date de naissance > aujourd'hui
**Attendu**: Impossible grâce à max=today

### 4. Surnom très long
**Test**: Entrer 500 caractères dans le surnom
**Attendu**: Champ accepte mais affichage tronqué avec ellipsis (...)

### 5. Notes très longues
**Test**: Entrer 5000 caractères dans les notes
**Attendu**: Champ accepte, scrollbar dans le textarea

---

## 📊 TESTS DE PERFORMANCE

### Chargement initial
- **Cible**: < 2 secondes
- **Test**: Temps entre navigation et affichage complet

### Ajout d'enfant
- **Cible**: < 1 seconde
- **Test**: Temps entre clic "Ajouter" et affichage de la carte

### Suppression d'enfant
- **Cible**: < 500ms
- **Test**: Temps entre confirmation et disparition de la carte

---

## 📱 TESTS CROSS-BROWSER

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🎯 TESTS ACCESSIBILITÉ

- [ ] Navigation au clavier (Tab, Enter, Esc)
- [ ] Labels associés aux inputs (for="...")
- [ ] Contraste des couleurs suffisant
- [ ] Textes alt sur les images
- [ ] Messages d'erreur lisibles par screen readers

---

## 📸 CAPTURES D'ÉCRAN RECOMMANDÉES

1. Page vide (aucun enfant)
2. Liste avec 2-3 enfants
3. Modal d'ajout ouvert
4. Modal d'édition ouvert
5. Carte enfant avec photo
6. Carte enfant avec initiales
7. Message d'erreur de suppression

---

## 🚀 PROCHAINS TESTS

Après validation de la gestion des enfants:
1. **Test d'intégration**: Inscription d'un enfant à un événement
2. **Test d'intégration**: Inscription d'un enfant à une activité
3. **Test workflow**: Sélectionner un enfant dans SmartEventRegistrationModal
4. **Test paiements**: Payer pour un enfant inscrit (Stripe)
5. **Test notifications**: Recevoir email de confirmation

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025
**Statut**: Prêt pour test manuel

🎊 **Le système de gestion des enfants est complet et prêt à être testé !**
