Ce fichier :


représente la configuration complète Mawaqit de la mosquée Mosque Madretsch - Biel/Bienne


contient :


des options d’affichage (écran TV, appli, hadiths, fond d’écran, etc.)


les infos de la mosquée (nom, site, logo, coordonnées…)


la liste des annonces/images qui tournent sur les écrans


le calendrier annuel des prières (heures adhan)


le calendrier des iqama (heure de début de salat, souvent en + minutes après adhan)




La structure globale :
{
  "rawdata": {
    ...tous les champs...
  }
}

Donc dans le code tu accéderas toujours aux données par rawdata.

2. Paramètres d’affichage / comportement
Tous ces champs contrôlent comment Mawaqit affiche les choses (écran TV, appli, etc.) :
"showCityInTitle": true,
"showLogo": true,
"showPrayerTimesOnMessageScreen": true,
"duaAfterPrayerShowTimes": ["10","8","8","8","12"],
"hijriDateEnabled": true,
"hijriDateForceTo30": false,
"duaAfterAzanEnabled": true,
"duaAfterPrayerEnabled": true,
"alwaysDisplayHhMmFormat": false,
"iqamaDisplayTime": 30,
"iqamaBip": false,
"backgroundColor": "#1b1b1b",
"jumuaDhikrReminderEnabled": true,
"jumuaTimeout": 30,
"randomHadithEnabled": true,
"blackScreenWhenPraying": true,
"wakeForFajrTime": null,
"jumuaBlackScreenEnabled": true,
"temperatureEnabled": true,
"temperatureUnit": "C",
"hadithLang": "fr-ar",
"iqamaEnabled": true,
"randomHadithIntervalDisabling": "",
"fajrFixationComparedToShuruq": null,
"adhanVoice": null,
"adhanEnabledByPrayer": ["1","1","1","1","1"],
"footer": true,
"iqamaMoreImportant": false,
"timeDisplayFormat": "24",
"backgroundType": "motif",
"backgroundMotif": "19",
"iqamaFullScreenCountdown": true,
"theme": "summer",
"adhanDuration": 150,
"displayingSabahImsak": false

Explication rapide des principaux :


showCityInTitle: afficher la ville dans le titre de la mosquée.


showLogo: afficher le logo de la mosquée.


showPrayerTimesOnMessageScreen: même quand un message/annonce est affiché, les horaires de prière restent visibles.


duaAfterPrayerShowTimes: temps d’affichage (en secondes) des invocations après la prière (par prière).


hijriDateEnabled: afficher la date hijri.


hijriDateForceTo30: si true, le mois hijri reste bloqué à 30 jours.


duaAfterAzanEnabled: afficher la dou’aa après l’adhan.


duaAfterPrayerEnabled: afficher la dou’aa après la prière.


iqamaDisplayTime: combien de minutes avant l’iqama on affiche le compte à rebours.


blackScreenWhenPraying: écran noir pendant la prière (pour ne pas distraire).


jumuaDhikrReminderEnabled: rappel de dhikr avant Joumou’a.


jumuaTimeout: durée liée au rappel / affichage spécial joumou’a.


randomHadithEnabled: affichage de hadiths aléatoires.


hadithLang: "fr-ar" : hadiths bilingues (français/arabe).


temperatureEnabled: afficher la température.


temperatureUnit: "C": en Celsius.


adhanEnabledByPrayer: tableau de 5 valeurs (Fajr, Dhuhr, Asr, Maghrib, Isha). "1" = adhan activé, "0" = désactivé.


timeDisplayFormat: "24": format 24h.


backgroundType: "motif", backgroundMotif: "19": style de fond d’écran.


theme: "summer": thème graphique global.


adhanDuration: 150: durée de l’adhan (en secondes).


displayingSabahImsak: si l’imsak est affiché ou pas.



3. Type et partenaire
"type": "MOSQUE",
"partner": true



type: le type de lieu (ici mosquée).


partner: la mosquée fait partie des partenaires Mawaqit (options supplémentaires).



4. Infos de la mosquée
C’est la “fiche d’identité” de ta mosquée :
"name": "Mosque Madretsch - Biel/bienne",
"label": "Mosque Madretsch - Biel/bienne",
"paymentWebsite": "https://www.paypal.com/...",
"countryCode": "CH",
"timezone": "Europe/Zurich",
"site": "https://mosque-madretsch.ch",
"association": "Mosque Madretsch",
"image": "https://cdn.mawaqit.net/...jpg",
"interiorPicture": "https://cdn.mawaqit.net/...jpg",
"exteriorPicture": "https://cdn.mawaqit.net/...jpg",
"logo": "https://cdn.mawaqit.net/...png",
"url": "http://mawaqit.net/fr/mosque-madretsch-biel-bienne",
"latitude": 47.1342491,
"longitude": 7.255157,
"womenSpace": true,
"janazaPrayer": true,
"aidPrayer": true,
"childrenCourses": false,
"adultCourses": false,
"ramadanMeal": true,
"handicapAccessibility": true,
"ablutions": true,
"parking": false,
"otherInfo": "La Mosquée Madretsch, également nommée Centre Salah..."



paymentWebsite: lien pour les dons (PayPal).


image / interiorPicture / exteriorPicture / logo: ressources images pour le site / écran.


latitude, longitude: coordonnées GPS (utile pour la carte, ou calculs de prière).


womenSpace, janazaPrayer, etc. : booléens pour afficher les services proposés.


otherInfo: texte descriptif libre.



5. Annonces (carrousel de messages/images)
"announcements": [
  {
    "id": 32994,
    "uuid": "40a8...",
    "title": "Application Mawaqit",
    "content": null,
    "image": "https://cdn.mawaqit.net/...jpg",
    "video": null,
    "startDate": null,
    "endDate": null,
    "updated": "2022-05-11 18:52",
    "duration": 20,
    "isMobile": false,
    "isDesktop": true,
    "tvOrientation": "LANDSCAPE"
  },
  ...
]

Pour chaque annonce :


title: titre du message (ex. “Dons / Spende”).


content: texte (parfois null si c’est une image sans texte).


image / video: média affiché.


duration: temps d’affichage en secondes.


isMobile / isDesktop: où on affiche (mobile, écran TV…).


tvOrientation: "LANDSCAPE" ou "PORTRAIT".


👉 Dans ton site, tu peux récupérer cette liste et faire un slider de bannières ou une section “Annonces de la mosquée”.

6. Événements
"events": []



Actuellement vide, mais prévu pour des événements spéciaux (conférences, cours…).



7. Joumou’a & prières de l’Aïd
"aidPrayerTime": null,
"aidPrayerTime2": null,
"jumua": "12:10",
"jumua2": "13:15",
"jumua3": null,
"jumuaAsDuhr": false



aidPrayerTime, aidPrayerTime2: horaires spéciaux de Salat al-Aïd (pas remplis ici).


jumua, jumua2, jumua3: une ou plusieurs séances de Joumou’a.


jumuaAsDuhr: si true, Joumou’a est gérée comme Dhuhr.



8. Réglages Hijri / Imsak
"imsakNbMinBeforeFajr": 0,
"hijriAdjustment": 0



imsakNbMinBeforeFajr: nombre de minutes avant Fajr pour l’Imsak.


hijriAdjustment: ajustement du calendrier hijri en jours (-1, 0, +1…).



9. Horaires du jour courant
"times": ["06:21","12:19","14:27","16:46","18:16"],
"shuruq": "07:50"



times: tableau des horaires du jour en cours, ordre Mawaqit classique, en général :


Fajr


Dhuhr


Asr


Maghrib


Isha




shuruq: lever du soleil (Shuruq).


👉 Pour ton site, tu peux afficher directement ces valeurs comme “Horaires d’aujourd’hui”.

10. calendar : calendrier annuel des adhans
"calendar": [
  { ... }, // mois 1 (janvier)
  { ... }, // mois 2 (février)
  ...
  { ... }  // mois 12 (décembre)
]

Chaque entrée de calendar est un objet pour un mois.
Les clés = le numéro du jour ("1", "2", … "31").
La valeur = un tableau de 6 horaires :
"1": ["06:45","08:17","12:35","14:35","16:52","18:22"]

Ordre typique (à confirmer avec la doc Mawaqit, mais en général) :


Fajr


Shuruq


Dhuhr


Asr


Maghrib


Isha


Donc pour lire les horaires du 15 mars par exemple :
const marsIndex = 2; // 0 = janvier, 1 = février, 2 = mars...
const day = "15";

const dayTimes = rawdata.calendar[marsIndex][day];
// dayTimes = ["06:42","08:13","12:41","14:49","17:08","18:38"]


11. iqamaCalendar : calendrier annuel des iqama
Même principe que calendar, mais pour les horaires d’iqama :
"iqamaCalendar": [
  { ... }, // mois 1
  { ... }, // mois 2
  ...
]

Pour chaque jour :
"9": ["06:45","+7","+7","+5","19:00"]

Le tableau contient 5 valeurs (Fajr, Dhuhr, Asr, Maghrib, Isha) :


soit un horaire fixe "19:00" → iqama à 19h00


soit "+7" ou "+5" → iqama N minutes après l’adhan de cette prière


Exemple d’interprétation :


"06:45" → Fajr iqama à 06:45 (heure fixe)


"+7" → Dhuhr iqama = Dhuhr adhan + 7 minutes


"+7" → Asr iqama = Asr adhan + 7 minutes


"+5" → Maghrib iqama = Maghrib adhan + 5 minutes


"19:00" → Isha iqama à 19:00 fixe (et pas basé sur l’adhan du jour)


👉 Dans ton code, tu dois :


récupérer les horaires adhan du jour (avec calendar)


lire les valeurs de iqamaCalendar


calculer l’iqama finale si c’est un +N, ou prendre l’horaire tel quel si c’est HH:mm.



12. Comment exploiter ça dans ton projet (Next.js / Cursor)
12.1. Interface TypeScript simplifiée
Tu n’es pas obligé de tout typer au début. Tu peux commencer simple :
export interface MosqueAnnouncement {
  id: number;
  uuid: string;
  title: string;
  content: string | null;
  image: string | null;
  video: string | null;
  startDate: string | null;
  endDate: string | null;
  updated: string;
  duration: number;
  isMobile: boolean;
  isDesktop: boolean;
  tvOrientation: "LANDSCAPE" | "PORTRAIT";
}

export interface MosqueConfig {
  name: string;
  label: string;
  countryCode: string;
  timezone: string;
  site: string | null;
  association: string | null;
  latitude: number;
  longitude: number;
  times: string[];      // horaires du jour
  shuruq: string;
  calendar: any[];      // tu peux affiner plus tard
  iqamaCalendar: any[]; // idem
  announcements: MosqueAnnouncement[];
  // ... + autres champs si tu en as besoin
}

export interface MawaqitResponse {
  rawdata: MosqueConfig;
}

12.2. Exemple d’utilisation dans une route Next.js
// app/api/madretsch/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // normalement tu feras un fetch sur l'API Mawaqit
  // mais si tu stockes ce JSON en local tu peux l'importer
  const data = require("@/data/mawaqit-madretsch.json");

  return NextResponse.json(data.rawdata);
}

12.3. Exemple d’affichage simple des horaires du jour
// app/(public)/madretsch/page.tsx

async function getConfig() {
  const res = await fetch("http://localhost:3000/api/madretsch");
  return res.json();
}

export default async function MadretschPage() {
  const config = await getConfig();

  const [fajr, dhuhr, asr, maghrib, isha] = config.times;
  const shuruq = config.shuruq;

  return (
    <div>
      <h1>{config.name}</h1>
      <p>Ville / pays : {config.countryCode}</p>

      <h2>Horaires d&apos;aujourd&apos;hui</h2>
      <ul>
        <li>Fajr : {fajr}</li>
        <li>Shuruq : {shuruq}</li>
        <li>Dhuhr : {dhuhr}</li>
        <li>Asr : {asr}</li>
        <li>Maghrib : {maghrib}</li>
        <li>Isha : {isha}</li>
      </ul>
    </div>
  );
}


13. Résumé


rawdata = tout le bloc de config de la mosquée.


Options d’affichage → gèrent le thème, les hadiths, l’écran noir, la date hijri, etc.


Infos mosquée → nom, site, images, géoloc, services proposés.


announcements → carrousel de messages/images (dons, réseaux sociaux, etc.).


times & shuruq → horaires du jour courant.


calendar → horaires d’adhan pour chaque jour de l’année.


iqamaCalendar → horaires d’iqama (soit fixes, soit +N minutes après l’adhan).


Si tu veux, au prochain message je peux te générer un vrai fichier mawaqit-config.md complet au format que tu utilises dans ton repo (avec sections TODO, idées de composants React, etc.).