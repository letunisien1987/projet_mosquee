# 🎯 Guide: Ajouter les Restrictions d'Inscription dans Directus

**Date**: 1er décembre 2025
**Durée**: 10 minutes

---

## 📋 Étapes à Suivre

### Étape 1: Se Connecter à Directus

1. Ouvrez http://localhost:8055
2. Connectez-vous avec vos identifiants admin

### Étape 2: Ajouter le Champ "restrictions" aux Événements

#### 2.1. Aller dans Data Model

1. Cliquez sur **Settings** (⚙️) dans le menu latéral
2. Cliquez sur **Data Model**
3. Trouvez la collection **events**
4. Cliquez dessus

#### 2.2. Créer le Champ JSON "restrictions"

1. Cliquez sur **"+ Create Field"** (bouton en haut à droite)
2. Choisissez le type: **"JSON"**
3. Configurez:
   - **Field Name**: `restrictions`
   - **Display Label**: `Restrictions d'inscription`
   - **Note**: `Conditions pour s'inscrire à cet événement`

4. Dans l'onglet **Schema**:
   - ✅ Cochez **"Nullable"**
   - Laissez le reste par défaut

5. Dans l'onglet **Interface**:
   - Interface: **"Input (JSON)"** ou **"Code Editor"**

6. Cliquez sur **"Save"** (💾)

#### 2.3. Valeur par Défaut Recommandée

Dans Directus, quand vous créez un nouvel événement, mettez ceci dans le champ `restrictions`:

```json
{
  "enabled": false,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

### Étape 3: Ajouter le Même Champ aux Activités

Répétez exactement les mêmes étapes pour la collection **activities**:

1. **Settings** → **Data Model** → **activities**
2. **"+ Create Field"** → **JSON**
3. **Field Name**: `restrictions`
4. **Save**

---

## 📝 Exemples de Configuration

### Exemple 1: Cours de Coran - Enfants 6-12 ans

Dans Directus, créez un événement avec:

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "CHILD",
  "min_age": 6,
  "max_age": 12
}
```

### Exemple 2: Conférence - Femmes 18+

```json
{
  "enabled": true,
  "participation_type": "INDIVIDUAL",
  "allowed_gender": "FEMALE",
  "min_age": 18,
  "max_age": null
}
```

### Exemple 3: Sortie Familiale

```json
{
  "enabled": true,
  "participation_type": "FAMILY",
  "allowed_gender": "ALL",
  "min_age": null,
  "max_age": null
}
```

### Exemple 4: Événement Sans Restriction

```json
{
  "enabled": false
}
```

---

## ✅ Vérification

Une fois terminé, vérifiez que:
- [ ] Le champ `restrictions` existe dans **events**
- [ ] Le champ `restrictions` existe dans **activities**
- [ ] Vous pouvez éditer le JSON pour un événement de test

---

**C'est tout!** Le reste du code Next.js gère automatiquement ces restrictions.
