# 🎯 Exemples Complets de Restrictions - Tous les Scénarios Possibles

**Date**: 1er décembre 2025
**Pour**: Événements ET Activités dans Directus

---

## 📊 Matrice de Toutes les Possibilités

### Types de Participation
- `INDIVIDUAL` - Inscription individuelle (1 personne)
- `FAMILY` - Inscription familiale/groupe (plusieurs personnes)
- `MIXED` - Les deux acceptés

### Genres Autorisés
- `ALL` - Tout le monde
- `MALE` - Hommes uniquement
- `FEMALE` - Femmes uniquement
- `CHILD` - Enfants uniquement

### Restrictions d'Âge
- `min_age` - Âge minimum (ou `null` si pas de min)
- `max_age` - Âge maximum (ou `null` si pas de max)

---

## 🎨 ÉVÉNEMENTS - Tous les Scénarios

### 1. Événement Ouvert à Tous (Par Défaut)

**Cas d'usage**: Conférence générale, Iftar communautaire, Fête de l'Aïd

```json
{
  "enabled": false
}
```

**Résultat**:
- Formulaire standard
- Pas de restrictions
- Tout le monde peut s'inscrire

---

### 2. Sortie Familiale - Tout Âge

**Cas d'usage**: Pique-nique familial, Sortie au parc, Visite musée

```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

**Formulaire affiché**:
- Combien d'adultes ? (1-10+)
- Combien d'enfants ? (0-10+)
- Nom, prénom de chaque adulte
- Nom, prénom, âge de chaque enfant
- Coordonnées du contact principal

**Exemple d'inscription**:
```json
{
  "participationType": "FAMILY",
  "contactFirstName": "Ahmed",
  "contactLastName": "El Ghoudi",
  "contactEmail": "ahmed@example.com",
  "contactPhone": "+41 76 123 45 67",
  "numberOfAdults": 2,
  "numberOfChildren": 3,
  "participants": {
    "adults": [
      {"firstName": "Ahmed", "lastName": "El Ghoudi"},
      {"firstName": "Fatima", "lastName": "El Ghoudi"}
    ],
    "children": [
      {"firstName": "Mohammed", "age": 8},
      {"firstName": "Aisha", "age": 6},
      {"firstName": "Omar", "age": 4}
    ]
  }
}
```

---

### 3. Conférence - Femmes Adultes

**Cas d'usage**: Conférence sur la maternité, Cours de Fiqh femmes, Rencontre sœurs

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "FEMALE",
  "min_age": 18,
  "max_age": null
}
```

**Formulaire affiché**:
- Message: "Cet événement est réservé aux femmes de 18 ans et plus"
- Date de naissance
- Case à cocher: "Je confirme être une femme"
- Contact (nom, prénom, email, téléphone)

**Validation**:
- Bloque si âge < 18
- Bloque si homme

---

### 4. Conférence - Hommes Adultes

**Cas d'usage**: Khutbah spéciale, Discussion hommes, Réunion frères

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "MALE",
  "min_age": 16,
  "max_age": null
}
```

**Formulaire affiché**:
- Message: "Cet événement est réservé aux hommes de 16 ans et plus"
- Date de naissance
- Case à cocher: "Je confirme être un homme"
- Contact

---

### 5. Camp d'Été - Enfants 8-14 ans

**Cas d'usage**: Camp d'été, Colonie de vacances, Stage vacances

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "CHILD",
  "min_age": 8,
  "max_age": 14
}
```

**Formulaire affiché**:
- Message: "Cet événement est réservé aux enfants de 8 à 14 ans"
- Prénom et nom de l'enfant
- Date de naissance de l'enfant
- Genre de l'enfant
- Coordonnées du parent (responsable légal)

**Validation**:
- Calcule l'âge automatiquement
- Bloque si < 8 ans ou > 14 ans

---

### 6. Hajj - Adultes 18+

**Cas d'usage**: Voyage Hajj, Omra, Pèlerinage

```json
{
  "enabled": true,
  "participation_type": "MIXED",
  "allowed_gender": "ALL",
  "min_age": 18,
  "max_age": null
}
```

**Résultat**:
- Accepte INDIVIDUAL ou FAMILY
- Minimum 18 ans
- Tous les genres acceptés

---

### 7. Sortie Senior - 60 ans et plus

**Cas d'usage**: Sortie pour aînés, Rencontre seniors

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": 60,
  "max_age": null
}
```

**Formulaire affiché**:
- Message: "Cet événement est réservé aux personnes de 60 ans et plus"
- Date de naissance
- Contact

---

### 8. Cours de Préparation au Mariage - Couples

**Cas d'usage**: Préparation au mariage

```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": 18,
  "max_age": null
}
```

**Note**: Type FAMILY permet au couple de s'inscrire ensemble (2 adultes)

---

## 🎓 ACTIVITÉS - Tous les Scénarios

### 1. Cours d'Arabe - Enfants Débutants 6-10 ans

**Cas d'usage**: Cours d'arabe pour jeunes enfants

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": 6,
  "max_age": 10
}
```

---

### 2. Cours de Coran - Enfants 7-12 ans

**Cas d'usage**: Apprentissage Coran enfants

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "CHILD",
  "min_age": 7,
  "max_age": 12
}
```

---

### 3. Cours de Coran - Adolescents 13-17 ans

**Cas d'usage**: Cours pour ados

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": 13,
  "max_age": 17
}
```

---

### 4. Cours de Fiqh - Femmes Adultes

**Cas d'usage**: Jurisprudence islamique pour femmes

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "FEMALE",
  "min_age": 18,
  "max_age": null
}
```

---

### 5. Cours de Tajwid - Hommes

**Cas d'usage**: Récitation coranique hommes

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "MALE",
  "min_age": 15,
  "max_age": null
}
```

---

### 6. École du Dimanche - Enfants 5-8 ans

**Cas d'usage**: Éveil religieux petits enfants

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "CHILD",
  "min_age": 5,
  "max_age": 8
}
```

---

### 7. Cours d'Arabe - Tous Niveaux Adultes

**Cas d'usage**: Cours de langue arabe adultes

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": 18,
  "max_age": null
}
```

---

### 8. Activité Sportive - Jeunes Hommes

**Cas d'usage**: Foot, basket pour jeunes frères

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "MALE",
  "min_age": 12,
  "max_age": 25
}
```

---

### 9. Atelier Cuisine - Familles

**Cas d'usage**: Atelier cuisine en famille

```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

---

### 10. Cours Intensif Ramadan - Mixte

**Cas d'usage**: Cours spécial durant Ramadan

```json
{
  "enabled": true,
  "participation_type": "MIXED",
  "allowed_gender": "ALL",
  "min_age": 10,
  "max_age": null
}
```

**Note**: MIXED accepte les inscriptions individuelles ET familiales

---

## 📋 Checklist de Test

Créez ces événements/activités de test dans Directus pour vérifier que tout fonctionne:

### Événements à Créer (5 minimum)
- [ ] "Test - Sortie Familiale" (FAMILY, ALL, pas d'âge)
- [ ] "Test - Conférence Femmes" (INDIVIDUAL, FEMALE, 18+)
- [ ] "Test - Camp Enfants" (INDIVIDUAL, CHILD, 8-14 ans)
- [ ] "Test - Événement Ouvert" (enabled: false)
- [ ] "Test - Hajj" (MIXED, ALL, 18+)

### Activités à Créer (5 minimum)
- [ ] "Test - Cours Coran Enfants" (INDIVIDUAL, CHILD, 7-12 ans)
- [ ] "Test - Cours Fiqh Femmes" (INDIVIDUAL, FEMALE, 18+)
- [ ] "Test - Cours Arabe Adultes" (INDIVIDUAL, ALL, 18+)
- [ ] "Test - Atelier Famille" (FAMILY, ALL, pas d'âge)
- [ ] "Test - Sport Jeunes Hommes" (INDIVIDUAL, MALE, 12-25 ans)

---

## 🔍 Comment Tester

### Étape 1: Créer les Événements/Activités de Test

1. Connectez-vous à Directus: http://localhost:8055
2. Email: `admin@mosquee.ch`
3. Mot de passe: `mosquee2024!`

### Étape 2: Ajouter le Champ `restrictions` si Pas Encore Fait

**Pour events**:
1. Settings → Data Model → events
2. Create Field → JSON
3. Field Name: `restrictions`
4. Save

**Pour activities**:
1. Settings → Data Model → activities
2. Create Field → JSON
3. Field Name: `restrictions`
4. Save

### Étape 3: Créer un Événement de Test

1. Content → events → Create New
2. Remplissez les champs de base (titre, description, date)
3. Dans le champ `restrictions`, copiez-collez un exemple JSON ci-dessus
4. Save

### Étape 4: Tester le Formulaire d'Inscription

1. Allez sur votre site: http://localhost:3000/evenements
2. Trouvez l'événement de test
3. Cliquez sur "S'inscrire"
4. Vérifiez que le formulaire s'adapte selon les restrictions

---

## 🎯 Scénarios de Test Complets

### Test 1: Famille avec 2 Adultes + 3 Enfants

**Événement**: Sortie Familiale
**Restrictions**: FAMILY, ALL, pas d'âge

**Attendu**:
- Formulaire demande nombre d'adultes: 2
- Formulaire demande nombre d'enfants: 3
- 2 champs pour noms des adultes
- 3 champs pour noms + âges des enfants
- 1 contact principal

### Test 2: Femme de 25 ans pour Conférence Femmes

**Événement**: Conférence Femmes
**Restrictions**: INDIVIDUAL, FEMALE, 18+

**Attendu**:
- Message: "Réservé aux femmes de 18 ans et plus"
- Champ date de naissance
- Case "Je confirme être une femme"
- ✅ Accepté (25 ans ≥ 18)

### Test 3: Homme essaie de s'inscrire à Conférence Femmes

**Événement**: Conférence Femmes
**Restrictions**: INDIVIDUAL, FEMALE, 18+

**Attendu**:
- ❌ Bloqué avec message: "Cet événement est réservé aux femmes"

### Test 4: Enfant de 7 ans pour Camp 8-14 ans

**Événement**: Camp Enfants
**Restrictions**: INDIVIDUAL, CHILD, 8-14 ans

**Attendu**:
- ❌ Bloqué avec message: "Réservé aux enfants de 8 à 14 ans"
- (7 < 8)

### Test 5: Enfant de 10 ans pour Camp 8-14 ans

**Événement**: Camp Enfants
**Restrictions**: INDIVIDUAL, CHILD, 8-14 ans

**Attendu**:
- ✅ Accepté
- Formulaire demande infos enfant + contact parent

---

## 💾 Données Sauvegardées - Exemples Réels

### Inscription Individuelle Femme

```json
{
  "participationType": "INDIVIDUAL",
  "contactFirstName": "Fatima",
  "contactLastName": "Ahmed",
  "contactEmail": "fatima@example.com",
  "contactPhone": "+41 76 234 56 78",
  "participantGender": "FEMALE",
  "participantBirthDate": "1990-05-15",
  "participantAge": 34
}
```

### Inscription Famille (2 adultes, 3 enfants)

```json
{
  "participationType": "FAMILY",
  "contactFirstName": "Ahmed",
  "contactLastName": "El Ghoudi",
  "contactEmail": "ahmed@example.com",
  "contactPhone": "+41 76 123 45 67",
  "numberOfAdults": 2,
  "numberOfChildren": 3,
  "participants": {
    "adults": [
      {"firstName": "Ahmed", "lastName": "El Ghoudi"},
      {"firstName": "Fatima", "lastName": "El Ghoudi"}
    ],
    "children": [
      {"firstName": "Mohammed", "lastName": "El Ghoudi", "age": 8},
      {"firstName": "Aisha", "lastName": "El Ghoudi", "age": 6},
      {"firstName": "Omar", "lastName": "El Ghoudi", "age": 4}
    ]
  }
}
```

### Inscription Enfant avec Contact Parent

```json
{
  "participationType": "INDIVIDUAL",
  "participantGender": "CHILD",
  "participantBirthDate": "2014-03-20",
  "participantAge": 10,
  "contactFirstName": "Youssef",
  "contactLastName": "Hassan",
  "contactEmail": "youssef.parent@example.com",
  "contactPhone": "+41 76 345 67 89",
  "notes": "Prénom enfant: Zainab Hassan"
}
```

---

## 🚀 Prochaines Étapes

1. **Vous**: Ajoutez le champ `restrictions` dans Directus (events + activities)
2. **Vous**: Créez 5-10 événements/activités de test avec différentes restrictions
3. **Moi**: Je crée le formulaire intelligent qui s'adapte automatiquement
4. **Nous**: On teste ensemble tous les scénarios

---

**Questions?** Consultez:
- `SYSTEME_RESTRICTIONS_COMPLET.md` - Vue d'ensemble
- `types/restrictions.ts` - Types TypeScript
- `scripts/add-restrictions-columns.sql` - Migration SQL

---

**Créé par**: Claude Code
**Date**: 1er décembre 2025
