# 🧪 Test de la Fonctionnalité "Répondre par Email" - Admin Messages

**Date**: 1er décembre 2025
**Testeur**: Claude Code
**Compte Admin**: `admin@mosquee.com`
**Compte Client Test**: `ahmedelghoudi@gmail.com`

---

## 🎯 Objectif du Test

Vérifier que l'administrateur peut répondre aux messages de contact directement depuis l'interface admin avec:
1. **Bouton "Répondre" toujours visible** (colonne sticky)
2. **Modal avec éditeur de texte** (pas d'ouverture d'email client)
3. **Envoi via Resend** avec template professionnel
4. **Email reçu par le client** avec le bon template

---

## ✅ Checklist de Test

### Étape 1: Créer un Message de Contact (comme client)

1. [ ] Aller sur http://localhost:3000/contact
2. [ ] Remplir le formulaire avec `ahmedelghoudi@gmail.com`:
   - Prénom: Ahmed
   - Nom: El Ghoudi
   - Email: ahmedelghoudi@gmail.com
   - Téléphone: +41 76 123 45 67
   - Sujet: Test de la fonctionnalité de réponse
   - Message: Bonjour, je teste la nouvelle fonctionnalité qui permet de répondre directement depuis l'admin. Est-ce que cela fonctionne bien?
3. [ ] Cliquer sur **Envoyer**
4. [ ] Vérifier le message de confirmation

**✅ Résultat attendu**: Message envoyé avec succès

---

### Étape 2: Se Connecter à l'Admin

1. [ ] Aller sur http://localhost:3000/admin/login
2. [ ] Se connecter avec:
   - Email: `admin@mosquee.com`
   - Mot de passe: `Admin123!`
3. [ ] Redirection vers `/admin`

**✅ Résultat attendu**: Connexion réussie, dashboard affiché

---

### Étape 3: Accéder à la Page Messages

1. [ ] Cliquer sur **Messages** dans le menu latéral
2. [ ] Ou aller sur http://localhost:3000/admin/messages

**✅ Résultat attendu**: Liste des messages affichée

---

### Étape 4: Vérifier la Colonne "Actions" Sticky

1. [ ] Réduire la largeur de la fenêtre du navigateur
2. [ ] Scroller horizontalement dans le tableau
3. [ ] Vérifier que la colonne **Actions** reste toujours visible à droite

**✅ Résultat attendu**: Colonne "Actions" toujours visible, même en scrollant

---

### Étape 5: Ouvrir la Modal de Réponse

1. [ ] Trouver le message de "Ahmed El Ghoudi"
2. [ ] Cliquer sur le bouton **Répondre** (avec icône Reply)

**✅ Résultat attendu**:
- Une modal s'ouvre (pas de nouvelle page)
- Le fond est assombri (overlay)
- La modal affiche:
  - Titre: "Répondre par email"
  - Destinataire: Ahmed El Ghoudi (ahmedelghoudi@gmail.com)
  - Sujet pré-rempli: "Re: Test de la fonctionnalité de réponse"
  - Zone de texte vide pour le message
  - Message original cité en bas

---

### Étape 6: Écrire et Envoyer la Réponse

1. [ ] Dans la modal, écrire un message de réponse:
   ```
   Assalamu alaikum Ahmed,

   Merci pour votre message. La nouvelle fonctionnalité de réponse fonctionne parfaitement!

   Vous recevez cet email directement depuis notre interface d'administration, avec un template professionnel de la Mosquée Madretsch.

   N'hésitez pas à nous contacter si vous avez d'autres questions.

   Barakallahou fikoum!
   ```

2. [ ] Cliquer sur **Envoyer la réponse**

**✅ Résultat attendu**:
- Bouton désactivé pendant l'envoi
- Animation de chargement (⏳ Envoi en cours...)
- Après quelques secondes:
  - Message de succès: "✅ Email envoyé avec succès !"
  - La modal se ferme automatiquement
  - Le message est marqué comme lu (si ce n'était pas déjà fait)
  - La page se rafraîchit

---

### Étape 7: Vérifier l'Email Reçu

1. [ ] Ouvrir la boîte mail `ahmedelghoudi@gmail.com`
2. [ ] Chercher l'email de réponse

**✅ Résultat attendu**:
- **Expéditeur**: info@mosquee-madretsch.ch (ou votre email Resend configuré)
- **Sujet**: "Re: Test de la fonctionnalité de réponse"
- **Template professionnel** avec:
  - **Header** : Logo/Nom "Mosquée Madretsch" avec fond vert (gradient #059669 → #047857)
  - **Salutation** : "Assalamu alaikum Ahmed,"
  - **Contenu** : Le message écrit par l'admin
  - **Citation** : Le message original en bas, dans un bloc gris avec bordure verte
  - **Signature** : "Barakallahou fikoum, L'équipe de la Mosquée Madretsch"
  - **Footer** : Coordonnées de la mosquée (adresse, email)

---

### Étape 8: Tests Supplémentaires

#### Test 8.1: Annuler la Réponse

1. [ ] Ouvrir une nouvelle modal de réponse
2. [ ] Écrire quelque chose
3. [ ] Cliquer sur **Annuler**

**✅ Résultat attendu**: Modal fermée, rien n'est envoyé

#### Test 8.2: Fermer la Modal en Cliquant à l'Extérieur

1. [ ] Ouvrir la modal de réponse
2. [ ] Cliquer sur le fond gris/noir à l'extérieur de la modal

**✅ Résultat attendu**: Modal fermée

#### Test 8.3: Bouton Désactivé si Message Vide

1. [ ] Ouvrir la modal de réponse
2. [ ] Laisser le champ message vide
3. [ ] Essayer de cliquer sur **Envoyer la réponse**

**✅ Résultat attendu**: Bouton désactivé (grisé), impossible de cliquer

#### Test 8.4: Modifier le Sujet

1. [ ] Ouvrir la modal de réponse
2. [ ] Modifier le sujet (ex: "Réponse à votre question")
3. [ ] Écrire un message
4. [ ] Envoyer

**✅ Résultat attendu**: Email reçu avec le nouveau sujet

---

## 📋 Résultats du Test

### Tests Réussis

- [ ] Étape 1: Message de contact créé
- [ ] Étape 2: Connexion admin réussie
- [ ] Étape 3: Page Messages accessible
- [ ] Étape 4: Colonne Actions sticky
- [ ] Étape 5: Modal s'ouvre correctement
- [ ] Étape 6: Envoi de la réponse fonctionne
- [ ] Étape 7: Email reçu avec template professionnel
- [ ] Test 8.1: Annulation fonctionne
- [ ] Test 8.2: Fermeture par clic extérieur fonctionne
- [ ] Test 8.3: Bouton désactivé si message vide
- [ ] Test 8.4: Modification du sujet fonctionne

### Erreurs Rencontrées

_Aucune pour l'instant_

---

## 📧 Template Email Attendu

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mosquée Madretsch</h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Association Musulmane de Bienne</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; margin: 0 0 20px 0;">Assalamu alaikum Ahmed,</p>

              <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">[MESSAGE DE L'ADMIN]</div>

              <!-- Message original -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">Message original :</p>
                <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 15px; color: #4b5563; font-size: 14px; white-space: pre-wrap;">[MESSAGE ORIGINAL]</div>
              </div>

              <p style="color: #374151; margin: 30px 0 0 0;">
                Barakallahou fikoum,<br>
                L'équipe de la Mosquée Madretsch
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Mosquée Madretsch<br>
                Rue Centrale 49, 2503 Bienne<br>
                <a href="mailto:info@mosquee-madretsch.ch" style="color: #059669; text-decoration: none;">info@mosquee-madretsch.ch</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🎯 Critères de Succès

Le test est **RÉUSSI** si:

- ✅ La colonne "Actions" reste toujours visible (sticky)
- ✅ Le clic sur "Répondre" ouvre une modal (pas une nouvelle page)
- ✅ La modal contient un éditeur de texte simple (textarea)
- ✅ L'envoi fonctionne via l'API `/api/admin/reply-message`
- ✅ L'email est envoyé via Resend
- ✅ L'email reçu contient le template professionnel de la mosquée
- ✅ Le message original est cité dans l'email
- ✅ Le message est marqué comme lu après envoi

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025
