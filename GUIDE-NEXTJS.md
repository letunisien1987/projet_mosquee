# Documentation API Mawaqit

API REST pour récupérer les horaires de prière de plus de 8000 mosquées dans le monde.

**URL de base :** `https://mawaqit.elghoudi.net/api/v1`

---

## 📚 Table des matières

1. [Endpoints disponibles](#endpoints-disponibles)
2. [Explication détaillée de chaque endpoint](#explication-détaillée)
3. [Utilisation avec Next.js](#utilisation-avec-nextjs)
4. [Notes importantes](#notes-importantes)

---

## 🔗 Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/` | GET | Message d'accueil |
| `/api/v1/{masjid_id}/prayer-times` | GET | Horaires de prière du jour |
| `/api/v1/{masjid_id}/calendar` | GET | Calendrier annuel complet |
| `/api/v1/{masjid_id}/calendar/{month}` | GET | Calendrier d'un mois spécifique |
| `/api/v1/{masjid_id}/calendar-iqama/{month}` | GET | Horaires iqama d'un mois |
| `/api/v1/{masjid_id}/announcements` | GET | Annonces de la mosquée |
| `/api/v1/{masjid_id}/services` | GET | Services disponibles |
| `/api/v1/{masjid_id}/` | GET | Données brutes |

---

## 📖 Explication détaillée

### 1. Message d'accueil

```
GET /api/v1/
```

**Rôle :**
Endpoint de test pour vérifier que l'API est en ligne et fonctionnelle.

**Utilité :**
- Vérifier la disponibilité de l'API
- Tester la connexion réseau
- Point d'entrée pour découvrir l'API

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/
```

**Réponse :**
```json
{
  "Greetings": "Hello and Welcome to this Api, this api use the mawaqit.net as data source of prayers time in more than 8000 masjid, this api can be used to fetch data in json, you can find our docs on /docs."
}
```

**Cas d'usage :**
- Health check de l'API
- Page d'accueil de votre application
- Monitoring de disponibilité

---

### 2. Horaires de prière du jour

```
GET /api/v1/{masjid_id}/prayer-times
```

**Rôle :**
Récupère les horaires de prière pour la journée en cours d'une mosquée spécifique.

**Utilité :**
- Afficher les horaires du jour sur votre site/app
- Calculer le temps restant avant la prochaine prière
- Envoyer des notifications de prière

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/prayer-times
```

**Réponse :**
```json
{
  "fajr": "06:30",
  "sunrise": "08:15",
  "dohr": "13:00",
  "asr": "15:30",
  "maghreb": "17:45",
  "icha": "19:15"
}
```

**Détails des champs :**
| Champ | Type | Description |
|-------|------|-------------|
| `fajr` | string | Heure de la prière du Fajr (aube) |
| `sunrise` | string | Heure du lever du soleil (pas une prière, référence) |
| `dohr` | string | Heure de la prière du Dohr (midi) |
| `asr` | string | Heure de la prière du Asr (après-midi) |
| `maghreb` | string | Heure de la prière du Maghreb (coucher du soleil) |
| `icha` | string | Heure de la prière du Icha (nuit) |

**Cas d'usage :**
- Affichage sur une page d'accueil
- Widget d'horaires de prière
- Application mobile de prière
- Écrans d'affichage dans les mosquées
- Calculer le temps avant la prochaine prière

**Exemple d'utilisation Next.js :**
```typescript
// Afficher l'heure de la prochaine prière
const getNextPrayer = (times) => {
  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes()}`;

  const prayers = ['fajr', 'dohr', 'asr', 'maghreb', 'icha'];

  for (const prayer of prayers) {
    if (times[prayer] > currentTime) {
      return { name: prayer, time: times[prayer] };
    }
  }

  return { name: 'fajr', time: times.fajr }; // Prochaine prière = Fajr du lendemain
};
```

---

### 3. Calendrier annuel

```
GET /api/v1/{masjid_id}/calendar
```

**Rôle :**
Récupère le calendrier complet des horaires de prière pour toute l'année (12 mois).

**Utilité :**
- Obtenir tous les horaires de l'année en une seule requête
- Créer un calendrier annuel imprimable
- Planification à long terme
- Réduire le nombre d'appels API

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/calendar
```

**Réponse :**
```json
{
  "calendar": {
    "1": [
      {
        "fajr": "06:45",
        "sunrise": "08:30",
        "dohr": "13:15",
        "asr": "15:00",
        "maghreb": "17:30",
        "icha": "19:00"
      },
      // ... 30 autres jours
    ],
    "2": [...],
    "3": [...],
    // ... jusqu'au mois 12
  }
}
```

**Structure des données :**
- Clé principale : `calendar`
- Sous-clés : `"1"` à `"12"` (mois de l'année)
- Chaque mois contient un tableau de 28-31 objets (jours)
- Chaque jour contient les 6 horaires (fajr, sunrise, dohr, asr, maghreb, icha)

**Cas d'usage :**
- Créer un PDF de calendrier annuel
- Application offline (stocker toutes les données localement)
- Analyse statistique des horaires
- Réduire les appels API en chargeant tout d'un coup

**Exemple d'utilisation Next.js :**
```typescript
// Obtenir les horaires d'un jour spécifique
const getPrayerTimesForDate = (calendar, month, day) => {
  return calendar[month][day - 1]; // day - 1 car les tableaux commencent à 0
};

// Exemple : horaires du 15 décembre
const decemberTimes = getPrayerTimesForDate(calendar, "12", 15);
```

---

### 4. Calendrier mensuel

```
GET /api/v1/{masjid_id}/calendar/{month_number}
```

**Rôle :**
Récupère les horaires de prière pour un mois spécifique (1 à 12).

**Utilité :**
- Afficher un calendrier mensuel
- Obtenir les horaires d'un mois précis
- Réduire la taille de la réponse (comparé au calendrier annuel)
- Meilleure performance pour un usage mensuel

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée
- `month_number` (integer, requis) : Numéro du mois (1=Janvier, 12=Décembre)

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/calendar/12
```

**Réponse :**
```json
[
  {
    "fajr": "06:30",
    "sunrise": "08:15",
    "dohr": "13:00",
    "asr": "15:30",
    "maghreb": "17:45",
    "icha": "19:15"
  },
  {
    "fajr": "06:31",
    "sunrise": "08:16",
    "dohr": "13:00",
    "asr": "15:30",
    "maghreb": "17:46",
    "icha": "19:16"
  },
  // ... 29 autres jours (total 31 jours pour décembre)
]
```

**Structure des données :**
- Tableau de 28 à 31 objets (selon le nombre de jours du mois)
- Index 0 = jour 1, index 1 = jour 2, etc.
- Chaque objet contient les 6 horaires

**Cas d'usage :**
- Calendrier mensuel à afficher
- Planification du mois
- Comparaison des horaires jour par jour
- Application qui se met à jour mensuellement

**Exemple d'utilisation Next.js :**
```typescript
// Créer un tableau de calendrier mensuel
const MonthCalendar = ({ month, year, masjidId }) => {
  const [calendar, setCalendar] = useState([]);

  useEffect(() => {
    fetch(`https://mawaqit.elghoudi.net/api/v1/${masjidId}/calendar/${month}`)
      .then(res => res.json())
      .then(setCalendar);
  }, [month, masjidId]);

  return (
    <div>
      {calendar.map((day, index) => (
        <div key={index}>
          <h3>Jour {index + 1}</h3>
          <p>Fajr: {day.fajr}</p>
          <p>Dohr: {day.dohr}</p>
          <p>Asr: {day.asr}</p>
          <p>Maghreb: {day.maghreb}</p>
          <p>Icha: {day.icha}</p>
        </div>
      ))}
    </div>
  );
};
```

---

### 5. Horaires Iqama mensuels

```
GET /api/v1/{masjid_id}/calendar-iqama/{month_number}
```

**Rôle :**
Récupère les horaires de l'iqama (heure du début de la prière en groupe) pour un mois spécifique.

**Utilité :**
- Afficher l'heure réelle à laquelle la prière commence à la mosquée
- Planifier sa venue à la mosquée
- L'iqama est différente de l'adhan (appel à la prière)

**Différence Adhan vs Iqama :**
- **Adhan** : Appel à la prière (horaires dans `/prayer-times`)
- **Iqama** : Début effectif de la prière en groupe (généralement 10-20 min après l'adhan)

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée
- `month_number` (integer, requis) : Numéro du mois (1-12)

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/calendar-iqama/12
```

**Réponse :**
```json
[
  {
    "fajr": "06:45",
    "dohr": "13:15",
    "asr": "15:45",
    "maghreb": "17:50",
    "icha": "19:30"
  },
  {
    "fajr": "06:46",
    "dohr": "13:15",
    "asr": "15:45",
    "maghreb": "17:51",
    "icha": "19:31"
  },
  // ... 29 autres jours
]
```

**Détails des champs :**
| Champ | Type | Description |
|-------|------|-------------|
| `fajr` | string | Heure de l'iqama du Fajr |
| `dohr` | string | Heure de l'iqama du Dohr |
| `asr` | string | Heure de l'iqama du Asr |
| `maghreb` | string | Heure de l'iqama du Maghreb |
| `icha` | string | Heure de l'iqama du Icha |

**Note :** Pas de `sunrise` car ce n'est pas une prière.

**Cas d'usage :**
- Savoir quand arriver à la mosquée
- Application de rappel pour ne pas rater la prière en groupe
- Affichage dans la mosquée
- Comparaison entre adhan et iqama

**Exemple d'utilisation Next.js :**
```typescript
// Comparer adhan et iqama
const PrayerComparison = ({ masjidId, month, day }) => {
  const [adhan, setAdhan] = useState(null);
  const [iqama, setIqama] = useState(null);

  useEffect(() => {
    // Récupérer les deux calendriers
    Promise.all([
      fetch(`/api/v1/${masjidId}/calendar/${month}`).then(r => r.json()),
      fetch(`/api/v1/${masjidId}/calendar-iqama/${month}`).then(r => r.json())
    ]).then(([adhanData, iqamaData]) => {
      setAdhan(adhanData[day - 1]);
      setIqama(iqamaData[day - 1]);
    });
  }, [masjidId, month, day]);

  if (!adhan || !iqama) return <div>Chargement...</div>;

  return (
    <div>
      <h3>Fajr</h3>
      <p>Adhan: {adhan.fajr}</p>
      <p>Iqama: {iqama.fajr}</p>
      <p>Délai: {calculateDelay(adhan.fajr, iqama.fajr)} min</p>
    </div>
  );
};
```

---

### 6. Annonces de la mosquée

```
GET /api/v1/{masjid_id}/announcements
```

**Rôle :**
Récupère toutes les annonces actives publiées par la mosquée.

**Utilité :**
- Informer les fidèles des événements
- Afficher les actualités de la mosquée
- Notifications push pour événements importants
- Panneaux d'affichage numériques

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/announcements
```

**Réponse :**
```json
[
  {
    "id": 12345,
    "uuid": "abc-123-def-456",
    "title": "Cours de Coran pour enfants",
    "content": "Inscription ouverte pour les cours de Coran tous les samedis de 14h à 16h.",
    "image": "https://example.com/image.jpg",
    "video": "https://youtube.com/watch?v=...",
    "startDate": "2025-11-01T00:00:00",
    "endDate": "2025-12-31T23:59:59",
    "updated": "2025-11-28T10:30:00",
    "duration": 15,
    "isMobile": true,
    "isDesktop": true
  },
  {
    "id": 12346,
    "uuid": "xyz-789-ghi-012",
    "title": "Collecte pour les nécessiteux",
    "content": "Participation à la collecte de vêtements et nourriture.",
    "image": null,
    "video": null,
    "startDate": "2025-11-15T00:00:00",
    "endDate": "2025-11-30T23:59:59",
    "updated": "2025-11-20T15:00:00",
    "duration": 10,
    "isMobile": true,
    "isDesktop": false
  }
]
```

**Détails des champs :**
| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | integer | Identifiant unique de l'annonce | Oui |
| `uuid` | string | UUID unique de l'annonce | Oui |
| `title` | string | Titre de l'annonce | Oui |
| `content` | string | Contenu détaillé de l'annonce | Non |
| `image` | string (URL) | URL de l'image associée | Non |
| `video` | string (URL) | URL de la vidéo associée | Non |
| `startDate` | datetime | Date de début d'affichage | Non |
| `endDate` | datetime | Date de fin d'affichage | Non |
| `updated` | datetime | Dernière mise à jour | Oui |
| `duration` | integer | Durée d'affichage en secondes (pour écrans) | Non |
| `isMobile` | boolean | Afficher sur mobile ? | Oui |
| `isDesktop` | boolean | Afficher sur desktop ? | Oui |

**Cas d'usage :**
- Section "Actualités" sur votre site
- Notifications push dans une app mobile
- Écrans d'affichage rotatifs dans la mosquée
- Page événements
- Newsletter automatique

**Exemple d'utilisation Next.js :**
```typescript
// Filtrer les annonces actives
const ActiveAnnouncements = ({ masjidId }) => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch(`https://mawaqit.elghoudi.net/api/v1/${masjidId}/announcements`)
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        const active = data.filter(ann => {
          const start = ann.startDate ? new Date(ann.startDate) : null;
          const end = ann.endDate ? new Date(ann.endDate) : null;

          if (start && now < start) return false;
          if (end && now > end) return false;

          return true;
        });
        setAnnouncements(active);
      });
  }, [masjidId]);

  return (
    <div>
      {announcements.map(ann => (
        <div key={ann.id}>
          <h3>{ann.title}</h3>
          {ann.image && <img src={ann.image} alt={ann.title} />}
          <p>{ann.content}</p>
          {ann.video && <a href={ann.video}>Voir la vidéo</a>}
        </div>
      ))}
    </div>
  );
};
```

---

### 7. Services de la mosquée

```
GET /api/v1/{masjid_id}/services
```

**Rôle :**
Récupère la liste des services et équipements disponibles dans la mosquée.

**Utilité :**
- Informer les visiteurs des installations disponibles
- Aider les personnes à mobilité réduite
- Planifier sa visite (parking, ablutions, etc.)
- Attirer de nouveaux fidèles

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/services
```

**Réponse :**
```json
{
  "womenSpace": true,
  "janazaPrayer": true,
  "aidPrayer": true,
  "childrenCourses": true,
  "adultCourses": false,
  "ramadanMeal": true,
  "handicapAccessibility": true,
  "ablutions": true,
  "parking": false
}
```

**Détails des champs :**
| Champ | Type | Description |
|-------|------|-------------|
| `womenSpace` | boolean | Espace dédié aux femmes disponible |
| `janazaPrayer` | boolean | Prières funéraires (janaza) organisées |
| `aidPrayer` | boolean | Prières de l'Aïd organisées |
| `childrenCourses` | boolean | Cours pour enfants disponibles |
| `adultCourses` | boolean | Cours pour adultes disponibles |
| `ramadanMeal` | boolean | Repas du Ramadan (iftar) proposés |
| `handicapAccessibility` | boolean | Accessibilité PMR (personnes à mobilité réduite) |
| `ablutions` | boolean | Installations pour les ablutions disponibles |
| `parking` | boolean | Parking disponible |

**Cas d'usage :**
- Page "À propos" de la mosquée
- Filtrer les mosquées par services dans une app
- Informations pratiques pour visiteurs
- Icônes de services sur une carte interactive

**Exemple d'utilisation Next.js :**
```typescript
// Afficher les services avec icônes
const ServicesDisplay = ({ masjidId }) => {
  const [services, setServices] = useState(null);

  const serviceIcons = {
    womenSpace: '👩',
    janazaPrayer: '🤲',
    aidPrayer: '🌙',
    childrenCourses: '👶',
    adultCourses: '📚',
    ramadanMeal: '🍽️',
    handicapAccessibility: '♿',
    ablutions: '💧',
    parking: '🅿️'
  };

  const serviceNames = {
    womenSpace: 'Espace femmes',
    janazaPrayer: 'Prière janaza',
    aidPrayer: 'Prière Aïd',
    childrenCourses: 'Cours enfants',
    adultCourses: 'Cours adultes',
    ramadanMeal: 'Iftar Ramadan',
    handicapAccessibility: 'Accès PMR',
    ablutions: 'Ablutions',
    parking: 'Parking'
  };

  useEffect(() => {
    fetch(`https://mawaqit.elghoudi.net/api/v1/${masjidId}/services`)
      .then(res => res.json())
      .then(setServices);
  }, [masjidId]);

  if (!services) return <div>Chargement...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(services).map(([key, available]) => (
        <div
          key={key}
          className={available ? 'text-green-600' : 'text-gray-400'}
        >
          <span className="text-2xl">{serviceIcons[key]}</span>
          <p>{serviceNames[key]}</p>
          <span>{available ? '✓' : '✗'}</span>
        </div>
      ))}
    </div>
  );
};
```

---

### 8. Données brutes

```
GET /api/v1/{masjid_id}/
```

**Rôle :**
Récupère toutes les données brutes non formatées depuis mawaqit.net.

**Utilité :**
- Accéder à des données non exposées par les autres endpoints
- Debugging et développement
- Extraire des informations supplémentaires
- Analyse de données complètes

**⚠️ Attention :**
Cet endpoint retourne des données non structurées. Il est recommandé d'utiliser les endpoints spécifiques pour un usage normal.

**Paramètres :**
- `masjid_id` (string, requis) : Identifiant unique de la mosquée

**Exemple de requête :**
```bash
curl https://mawaqit.elghoudi.net/api/v1/mosquee-de-paris-75011/
```

**Réponse :**
```json
{
  "rawdata": {
    // Données complètes et non formatées de mawaqit.net
    // Structure peut varier
  }
}
```

**Cas d'usage :**
- Développement et tests
- Extraction de données non disponibles ailleurs
- Migration de données
- Analyse approfondie

**Note :** Préférez toujours les endpoints spécifiques (`/prayer-times`, `/announcements`, etc.) pour un usage en production.

---

## 💻 Utilisation avec Next.js

### Installation des dépendances

```bash
npm install axios
```

### Configuration de base

Créez un fichier `lib/mawaqit.ts` :

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://mawaqit.elghoudi.net/api/v1';

// Client API configuré
const mawaqitAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 secondes
});

// Gestion des erreurs
mawaqitAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error('Trop de requêtes. Limite: 60/minute');
    }
    return Promise.reject(error);
  }
);

// Fonctions d'API
export const MawaqitAPI = {
  // Horaires du jour
  getPrayerTimes: async (masjidId: string) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/prayer-times`);
    return data;
  },

  // Calendrier annuel
  getYearCalendar: async (masjidId: string) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/calendar`);
    return data.calendar;
  },

  // Calendrier mensuel
  getMonthCalendar: async (masjidId: string, month: number) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/calendar/${month}`);
    return data;
  },

  // Horaires iqama mensuels
  getMonthIqama: async (masjidId: string, month: number) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/calendar-iqama/${month}`);
    return data;
  },

  // Annonces
  getAnnouncements: async (masjidId: string) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/announcements`);
    return data;
  },

  // Services
  getServices: async (masjidId: string) => {
    const { data } = await mawaqitAPI.get(`/${masjidId}/services`);
    return data;
  },
};
```

### Types TypeScript

Créez un fichier `types/mawaqit.ts` :

```typescript
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dohr: string;
  asr: string;
  maghreb: string;
  icha: string;
}

export interface IqamaPrayerTimes {
  fajr: string;
  dohr: string;
  asr: string;
  maghreb: string;
  icha: string;
}

export interface Announcement {
  id: number;
  uuid: string;
  title: string;
  content?: string;
  image?: string;
  video?: string;
  startDate?: string;
  endDate?: string;
  updated: string;
  duration?: number;
  isMobile: boolean;
  isDesktop: boolean;
}

export interface MosqueServices {
  womenSpace: boolean;
  janazaPrayer: boolean;
  aidPrayer: boolean;
  childrenCourses: boolean;
  adultCourses: boolean;
  ramadanMeal: boolean;
  handicapAccessibility: boolean;
  ablutions: boolean;
  parking: boolean;
}
```

### Exemple de composant complet

```typescript
'use client';

import { useEffect, useState } from 'react';
import { MawaqitAPI } from '@/lib/mawaqit';
import type { PrayerTimes, Announcement, MosqueServices } from '@/types/mawaqit';

export default function MosquePage() {
  const MASJID_ID = 'mosquee-de-paris-75011';

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [services, setServices] = useState<MosqueServices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [times, anncs, srvcs] = await Promise.all([
          MawaqitAPI.getPrayerTimes(MASJID_ID),
          MawaqitAPI.getAnnouncements(MASJID_ID),
          MawaqitAPI.getServices(MASJID_ID),
        ]);

        setPrayerTimes(times);
        setAnnouncements(anncs);
        setServices(srvcs);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6">
      {/* Horaires de prière */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Horaires du jour</h2>
        {prayerTimes && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PrayerCard name="Fajr" time={prayerTimes.fajr} />
            <PrayerCard name="Sunrise" time={prayerTimes.sunrise} />
            <PrayerCard name="Dohr" time={prayerTimes.dohr} />
            <PrayerCard name="Asr" time={prayerTimes.asr} />
            <PrayerCard name="Maghreb" time={prayerTimes.maghreb} />
            <PrayerCard name="Icha" time={prayerTimes.icha} />
          </div>
        )}
      </section>

      {/* Annonces */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Annonces</h2>
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="border p-4 rounded-lg">
              <h3 className="font-bold text-lg">{ann.title}</h3>
              {ann.content && <p className="mt-2">{ann.content}</p>}
              {ann.image && (
                <img src={ann.image} alt={ann.title} className="mt-2 rounded" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Services disponibles</h2>
        {services && (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(services).map(([key, available]) => (
              <ServiceCard key={key} name={key} available={available} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PrayerCard({ name, time }: { name: string; time: string }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="text-gray-600 text-sm">{name}</div>
      <div className="text-2xl font-bold text-blue-900">{time}</div>
    </div>
  );
}

function ServiceCard({ name, available }: { name: string; available: boolean }) {
  const serviceNames: Record<string, string> = {
    womenSpace: 'Espace femmes',
    janazaPrayer: 'Prière janaza',
    aidPrayer: 'Prière Aïd',
    childrenCourses: 'Cours enfants',
    adultCourses: 'Cours adultes',
    ramadanMeal: 'Iftar Ramadan',
    handicapAccessibility: 'Accès PMR',
    ablutions: 'Ablutions',
    parking: 'Parking',
  };

  return (
    <div className={`p-3 rounded ${available ? 'bg-green-50' : 'bg-gray-50'}`}>
      <span className={available ? 'text-green-700' : 'text-gray-400'}>
        {available ? '✓' : '✗'} {serviceNames[name] || name}
      </span>
    </div>
  );
}
```

---

## 📝 Notes importantes

### Limites et restrictions

**Rate Limiting :**
- 60 requêtes par minute par adresse IP
- Si dépassement : erreur HTTP 429 (Too Many Requests)
- Solution : implémenter un cache côté client

**Authentification :**
- Actuellement non requise (peut être activée via `ENABLE_AUTH`)
- Si activée, ajouter le header : `Authorization: Bearer {token}`

### Comment trouver le masjid_id

Le `masjid_id` est visible dans l'URL de mawaqit.net :

**Exemple :**
```
https://mawaqit.net/fr/mosquee-de-paris-75011
                        ^^^^^^^^^^^^^^^^^^^^^^^^
                        C'est le masjid_id
```

**Autres exemples :**
- `mosquee-de-lyon-69001`
- `grande-mosquee-de-bruxelles`
- `mosquee-de-geneve`

### Optimisation des performances

**1. Caching côté client :**
```typescript
// Utiliser React Query pour le caching
import { useQuery } from '@tanstack/react-query';

function usePrayerTimes(masjidId: string) {
  return useQuery({
    queryKey: ['prayer-times', masjidId],
    queryFn: () => MawaqitAPI.getPrayerTimes(masjidId),
    staleTime: 1000 * 60 * 60, // 1 heure (les horaires changent peu)
  });
}
```

**2. Charger les données en une fois :**
```typescript
// Au lieu de 3 requêtes séparées :
const times = await MawaqitAPI.getPrayerTimes(id);
const announcements = await MawaqitAPI.getAnnouncements(id);
const services = await MawaqitAPI.getServices(id);

// Faire en parallèle :
const [times, announcements, services] = await Promise.all([
  MawaqitAPI.getPrayerTimes(id),
  MawaqitAPI.getAnnouncements(id),
  MawaqitAPI.getServices(id),
]);
```

**3. Utiliser le calendrier mensuel plutôt que quotidien :**
```typescript
// Charger une fois par mois au lieu de chaque jour
const monthCalendar = await MawaqitAPI.getMonthCalendar(id, 12);
const todayTimes = monthCalendar[new Date().getDate() - 1];
```

### Gestion des erreurs

```typescript
async function fetchWithErrorHandling(masjidId: string) {
  try {
    const data = await MawaqitAPI.getPrayerTimes(masjidId);
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Mosquée non trouvée' };
    }
    if (error.response?.status === 429) {
      return { success: false, error: 'Trop de requêtes, réessayez dans 1 minute' };
    }
    return { success: false, error: 'Erreur de connexion' };
  }
}
```

---

## 🔗 Ressources

- **Documentation interactive Swagger :** `https://mawaqit.elghoudi.net/docs`
- **Documentation ReDoc :** `https://mawaqit.elghoudi.net/redoc`
- **Repository GitHub :** [mrsofiane/mawaqit-api](https://github.com/mrsofiane/mawaqit-api)
- **Site source :** [mawaqit.net](https://mawaqit.net)

---

**Dernière mise à jour :** 2025-11-28
