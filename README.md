# 🕌 Site Web Mosquée Madretsch

Site web complet pour une mosquée et association musulmane, développé avec Next.js 14, TypeScript et Tailwind CSS.

## ✨ Fonctionnalités

- **Horaires de Prières** : Intégration de l'API Aladhan pour les horaires quotidiens et mensuels
- **Compte à Rebours** : Affichage en temps réel du temps restant jusqu'à la prochaine prière
- **Date Hijri** : Affichage automatique de la date du calendrier islamique
- **Activités** : Présentation des cours de Coran, d'arabe et de l'école du dimanche
- **Événements** : Liste des événements avec système de filtrage par catégorie
- **Dons** : Section dédiée aux dons (Zakat, Sadaqa, cotisations) avec suivi des projets
- **Contact** : Formulaire de contact et carte Google Maps
- **Mode Sombre/Clair** : Toggle de thème avec persistance
- **Responsive** : Design mobile-first entièrement responsive
- **Multilingue** : Support RTL pour les sections en arabe

## 🎨 Design

- **Palette de couleurs** :
  - Vert émeraude (#059669) : Couleur principale
  - Doré (#D4AF37) : Accents
  - Motifs géométriques islamiques en arrière-plan
- **Typographie** :
  - Police Geist pour le contenu principal
  - Police Amiri pour les textes en arabe

## 🚀 Démarrage

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

1. Cloner le repository
```bash
git clone <repository-url>
cd mosquee
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## 📦 Technologies Utilisées

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4
- **Icônes** : Lucide React
- **Animations** : Framer Motion
- **Thème** : next-themes
- **API** : Aladhan Prayer Times API

## 📁 Structure du Projet

```
mosquee/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page d'accueil
│   ├── horaires/          # Horaires des prières
│   ├── about/             # À propos
│   ├── activites/         # Activités
│   ├── evenements/        # Événements
│   ├── dons/              # Dons
│   └── contact/           # Contact
├── components/            # Composants réutilisables
│   ├── Navbar.tsx         # Navigation principale
│   ├── Footer.tsx         # Pied de page
│   ├── ThemeProvider.tsx  # Provider de thème
│   ├── ThemeToggle.tsx    # Toggle mode sombre
│   ├── PrayerTimesCard.tsx
│   └── PrayerCountdown.tsx
├── lib/                   # Utilitaires et types
│   └── prayer-times.ts    # API Aladhan
└── public/                # Fichiers statiques
```

## 🔧 Configuration

### Personnalisation des Couleurs

Les couleurs peuvent être modifiées dans `app/globals.css` :

```css
:root {
  --primary: #059669;
  --primary-dark: #047857;
  --accent: #D4AF37;
  --accent-dark: #B8941F;
}
```

### Configuration de la Ville

Pour changer la ville des horaires de prière, modifier dans `app/page.tsx` et `app/horaires/page.tsx` :

```typescript
const prayerData = await getPrayerTimes('VotrVille', 'VotrePays')
```

## 📄 Pages Disponibles

1. **/** - Page d'accueil avec horaires du jour
2. **/horaires** - Tableau mensuel des prières
3. **/about** - Histoire, mission et équipe
4. **/activites** - Cours et programmes
5. **/evenements** - Liste des événements
6. **/dons** - Informations sur les dons
7. **/contact** - Formulaire et carte

## 🌙 Mode Sombre

Le site supporte automatiquement le mode sombre qui s'adapte aux préférences système de l'utilisateur, avec possibilité de basculer manuellement via le toggle dans la navigation.

## 📱 Responsive Design

Le site est entièrement responsive et optimisé pour :
- Mobile (< 768px)
- Tablette (768px - 1024px)
- Desktop (> 1024px)

## 🔄 API Aladhan

Le site utilise l'API Aladhan pour obtenir :
- Les horaires des 5 prières quotidiennes
- La date du calendrier Hijri
- Les horaires mensuels
- Méthode de calcul : UOIF (méthode 3)

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
npm run build
vercel deploy
```

### Autres plateformes

```bash
npm run build
npm start
```

## 📝 License

Ce projet est open source et disponible sous license MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Contact

Pour toute question concernant ce projet, veuillez ouvrir une issue sur GitHub.
# projet_mosquee
