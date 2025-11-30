# 🕌 Carte Unifiée des Horaires de Prière

## 📋 Vue d'ensemble

La **UnifiedPrayerCard** est une carte unique et complète qui regroupe **TOUS** les horaires de prière :
- ✅ Les 5 prières quotidiennes (Fajr, Dhuhr, Asr, Maghrib, Isha)
- ✅ La prière du Joumou'a (vendredi)
- ✅ Les prières de l'Aïd (si configurées dans l'API)
- ✅ Les horaires de Ramadan : Imsak et Iftar (si période de Ramadan)

---

## 🎨 Structure visuelle

```
┌─────────────────────────────────────────────────────────────────┐
│ 🕐 Horaires de Prière                                           │
│                                                                  │
│ ╔═══════════════════════════════════════════════════════════╗  │
│ ║ 📅 SECTION JOUMOU'A                                       ║  │
│ ║ ─────────────────────────────────────────────────────────  ║  │
│ ║ │ Message du vendredi        │  1er Prêche   12:10      │ ║  │
│ ║ │ Message personnalisable... │  2ème Prêche  13:15      │ ║  │
│ ║ │ depuis l'API Mawaqit       │  3ème Prêche  15:00      │ ║  │
│ ║ │                            │                           │ ║  │
│ ║ │ Fond ROSE (vendredi)       │  Jusqu'à 3 horaires      │ ║  │
│ ║ │ ou BLEU (autres jours)     │  configurables           │ ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Prières Quotidiennes                                             │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│ │  🌅    │  │  ☀️     │  │  ☁️     │  │  🌇    │  │  🌙    │   │
│ │ Fajr   │  │ Dhuhr  │  │  Asr   │  │Maghrib │  │ Isha   │   │
│ │ 06:28  │  │ 12:16  │  │ 14:23  │  │ 16:44  │  │ 18:20  │   │
│ │        │  │        │  │        │  │        │  │        │   │
│ │ Iqama: │  │ Iqama: │  │ Iqama: │  │ Iqama: │  │ Iqama: │   │
│ │ 06:45  │  │ 12:30  │  │ 14:45  │  │ 16:49  │  │ 18:45  │   │
│ │ (+17min│  │ (fixe) │  │ (+22min│  │ (+5min)│  │ (+25min│   │
│ └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Horaires Spéciaux                                                │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ ┌──────────────────────────┐  ┌────────────────────────────┐  │
│ │ 🌙 Prières de l'Aïd      │  │ ☀️ Ramadan                  │  │
│ │ ──────────────────────── │  │ ─────────────────────────── │  │
│ │                          │  │                             │  │
│ │ 1ère Prière    08:00    │  │ Imsak           04:30      │  │
│ │ 2ème Prière    09:00    │  │ Arrêt du Suhoor            │  │
│ │                          │  │                             │  │
│ │ Prières spéciales de     │  │ Iftar           18:45      │  │
│ │ l'Aïd al-Fitr ou al-Adha │  │ Rupture du jeûne (Maghrib) │  │
│ │                          │  │                             │  │
│ │ 🎨 Fond dégradé orange   │  │ 🎨 Fond dégradé violet     │  │
│ └──────────────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Logique d'affichage conditionnelle

### 1️⃣ Joumou'a (Prière du Vendredi)

**Condition d'affichage :**
```typescript
jumua && jumua.length > 0
```

**Comportement :**
- ✅ **Toujours affiché** si l'API fournit des horaires (1 à 3 prêches)
- 🎨 **Fond rose/rouge** le vendredi (`currentDay === 5`)
- 🎨 **Fond bleu/indigo** les autres jours (info du vendredi prochain)
- 📝 **Message personnalisé** depuis `jumuaMessage` ou message par défaut

**Source API :**
```
data.jumua    → 1er prêche
data.jumua2   → 2ème prêche (optionnel)
data.jumua3   → 3ème prêche (optionnel)
```

---

### 2️⃣ Prières Quotidiennes

**Toujours affichées :**
- Fajr, Dhuhr, Asr, Maghrib, Isha
- Avec horaires Adhan et Iqama
- Indication si Iqama est relative (+N min) ou fixe
- Mise en évidence de la **prochaine prière**

---

### 3️⃣ Prières de l'Aïd

**Condition d'affichage :**
```typescript
aidPrayer && aidPrayer.length > 0
```

**Comportement :**
- ✅ Affiché si `aidPrayerTime` ou `aidPrayerTime2` configurés dans l'API
- ❌ **Caché** si aucun horaire configuré
- 🎨 Fond dégradé **orange/ambre** avec icône lune

**Source API :**
```
data.aidPrayerTime   → 1ère prière
data.aidPrayerTime2  → 2ème prière (optionnel)
```

---

### 4️⃣ Ramadan (Imsak & Iftar)

**Condition d'affichage :**
```typescript
isRamadan && (imsak || iftar)
```

**Comportement :**
- ✅ Affiché **UNIQUEMENT** pendant le mois de Ramadan (mois hijri 9)
- ❌ **Caché** en dehors de Ramadan (même si données disponibles)
- 🎨 Fond dégradé **violet** avec icône soleil

**Calcul des horaires :**
```javascript
// Imsak = Fajr - X minutes
imsak = Fajr - data.imsakNbMinBeforeFajr

// Iftar = Maghrib
iftar = todayPrayer[4]  // Index Maghrib
```

---

## 📂 Fichiers du projet

### ✅ Nouveau composant créé

**`components/UnifiedPrayerCard.tsx`**
- Carte unique regroupant tous les horaires
- 280+ lignes de code
- Gestion conditionnelle intelligente
- Design responsive et moderne

### 🔄 Fichier modifié

**`app/page.tsx`**
```typescript
import { UnifiedPrayerCard } from '@/components/UnifiedPrayerCard'

// Utilisation
<UnifiedPrayerCard
  timings={prayerData.timings}
  iqama={prayerData.iqama}
  iqamaDetailed={prayerDetailsData.iqamaDetailed}
  nextPrayer={nextPrayer}
  specialInfo={specialInfo}  // Contient jumua, aidPrayer, imsak, iftar
  currentDay={currentDay}
  isRamadan={isRamadanMonth}
/>
```

### ❌ Fichiers supprimés

- ~~`components/SpecialPrayersSection.tsx`~~ (fusionné dans UnifiedPrayerCard)
- ~~Ancienne version de `PrayerTimesCard.tsx`~~ (remplacée)

---

## 🎯 Avantages de la carte unifiée

| Avant | Après |
|-------|-------|
| **3 composants séparés** | **1 composant unifié** |
| PrayerTimesCard | UnifiedPrayerCard |
| SpecialPrayersSection | ✨ Tout inclus |
| Logique dispersée | Logique centralisée |
| 2 sections distinctes | 1 carte cohérente |
| Difficile à maintenir | Facile à maintenir |

---

## 🎨 Palette de couleurs

| Section | Couleur principale | Utilisation |
|---------|-------------------|-------------|
| **Joumou'a (Vendredi)** | Rose/Rouge/Orange | `from-rose-50 via-red-50 to-orange-50` |
| **Joumou'a (Autres jours)** | Bleu/Indigo/Violet | `from-blue-50 via-indigo-50 to-purple-50` |
| **Aïd** | Orange/Ambre | `from-amber-500 to-amber-600` |
| **Ramadan** | Violet/Pourpre | `from-purple-500 to-purple-600` |
| **Prochaine prière** | Vert primaire | `bg-primary text-white` |
| **Prières normales** | Gris clair | `bg-gray-50 dark:bg-gray-700` |

---

## 🚀 Comment tester

### 1. Tester Joumou'a
L'API fournit déjà 3 horaires :
```json
{
  "jumua": "12:10",
  "jumua2": "13:15",
  "jumua3": "15:00"
}
```
✅ **Déjà visible** sur http://localhost:3000

### 2. Tester l'Aïd
Ajouter dans l'API Mawaqit :
```json
{
  "aidPrayerTime": "08:00",
  "aidPrayerTime2": "09:00"
}
```
⏳ Visible après **max 60 minutes** (cache)

### 3. Tester Ramadan
Deux conditions requises :
1. **Configurer Imsak** dans l'API :
   ```json
   {
     "imsakNbMinBeforeFajr": 10
   }
   ```
2. **Attendre Ramadan** (mois hijri 9) ou modifier la date hijri dans l'API

⏳ Visible uniquement **pendant Ramadan**

---

## 📊 Données actuelles (30 Nov 2025)

### ✅ Actuellement visibles
- **Joumou'a** : 3 horaires (12:10, 13:15, 15:00)
- **5 prières** : Fajr, Dhuhr, Asr, Maghrib, Isha
- **Iqama** : Pour chaque prière

### ❌ Actuellement cachés
- **Aïd** : Non configuré dans l'API
- **Imsak** : Non configuré (`imsakNbMinBeforeFajr` absent)
- **Iftar** : Calculé (16:44) mais caché car hors Ramadan

---

## ⏰ Compte à rebours

Le compte à rebours (`PrayerCountdown`) reste **SÉPARÉ** de la carte, comme demandé :

```typescript
<PrayerCountdown nextPrayer={nextPrayer} />
<UnifiedPrayerCard ... />
```

Position : **Au-dessus** de la carte unifiée

---

## 📝 Notes importantes

1. **Cache API** : Les modifications dans l'API Mawaqit sont visibles après **max 60 minutes**
2. **Ramadan** : La section Ramadan n'apparaît que si `isRamadan = true` (mois hijri 9)
3. **Responsive** : La carte s'adapte automatiquement aux mobiles, tablettes et desktop
4. **Dark mode** : Support complet du mode sombre avec Tailwind CSS
5. **Accessibilité** : Icônes, contrastes et hiérarchie visuelle optimisés

---

## 🔧 Maintenance future

Pour ajouter un nouvel horaire spécial :

1. **Ajouter les props** dans `UnifiedPrayerCardProps`
2. **Récupérer les données** depuis l'API dans `getSpecialPrayerInfo()`
3. **Ajouter la section** dans le JSX avec logique conditionnelle
4. **Définir les couleurs** et le design
5. **Tester** l'affichage et la logique

---

## ✨ Résumé

La **UnifiedPrayerCard** centralise tous les horaires de prière dans une interface élégante et cohérente, avec une logique d'affichage conditionnelle intelligente qui s'adapte automatiquement au contexte (jour de la semaine, Ramadan, configuration API).

**Une carte. Tous les horaires. Zéro complexité.** 🎯
