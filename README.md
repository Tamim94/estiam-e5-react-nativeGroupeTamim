# TravelMate — React Native / Expo Router

> Projet Fil Rouge — Native Cross Platform Development  
> Année académique 2025–2026  
> **Groupe E5 WMD** : Tamim GOLAM HOSSAIN - Hamid OKETOKOUN - Quentin GAUTIER

---

## 🚀 Description

TravelMate est une application mobile de gestion de voyages développée avec **React Native** et **Expo Router**.  
Elle permet aux utilisateurs de créer, consulter et organiser leurs voyages, avec support **offline**, **upload d'images**, **authentification JWT** et **notifications**.

---

## 🛠️ Stack technique

- React Native (Expo)
- Expo Router
- TypeScript
- Backend mock Express.js
- JWT Authentication
- AsyncStorage (cache & offline)
- Expo Image Picker / Location
- Notifications Expo (aucune modification apportée j'ai garder celui du prof )

---

## 📦 Installation et démarrage

### Prérequis
- Node.js installé
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet** et naviguer vers les dossiers appropriés

2. **Terminal 1 - Backend Mock**
   ```bash
   cd estiam-e5-react-native-mock-backend-nodejs-clean
   npm install
   npm run dev
   ```
   Le serveur backend sera disponible sur `http://localhost:4000`

3. **Terminal 2 - Application Mobile**
   ```bash
   cd estiam-e5-react-native-feat-travel-mate
   npm install
   npx expo start
   ```

### ⚠️ Notes importantes
- Sur émulateur Android, l'URL `10.0.2.2` est utilisée au lieu de `localhost`
- Le backend mock a été adapté pour gérer correctement Android et iOS (uploads, URLs publiques)
- Modifications apportées pour améliorer la compatibilité du debugging web et mobile (importation de la librairie Platform dans `env.ts`)

---

## ✅ Fonctionnalités implémentées

### 🔐 Authentification
- Login / Register
- Refresh token
- Auth Guard avec Expo Router
- Déconnexion complète

### ✈️ Trips (Voyages)
- Création de voyage avec validation
- Upload réel des images avec progression
- Listing des voyages depuis l'API (`GET /trips`)
- Support offline (création mise en queue)
- CRUD complet avec modification dans le backend mock DELETE / PUT / POST (DOSSIER MODAL  POUR Ajout +  Edition) 
- Cache local des voyages
- Recherche (titre + destination)
- CARTE DE VOYAGE avec localisation INTERACTIVE avec Leaflet + OpenStreetMap 
-  Mapview des voyages avec localisation (react native webview + leaflet + OpenStreetMap PSK JE NAI PAS DE CLE API GOOGLE MAPP!!)
- Filtres disponibles :
    - All
    - Upcoming
    - Past
    - Favorites

### ⭐ Favorites
- Possibilité de marquer un voyage comme favori
- Gestion locale via état + cache offline
- Les favoris sont gérés localement via AsyncStorage afin d'éviter une sur-implémentation backend non requise dans le cadre d'un backend mock
- Compatible avec le mode hors ligne
- Aucun endpoint backend spécifique requis

### 🏠 Home
- Données réelles (pas de données en dur)
- Statistiques calculées à partir des voyages
- Voyages à venir
- Actions rapides fonctionnelles

### 📱 Offline
- Détection hors ligne
- File d'attente des actions
- Synchronisation automatique au retour en ligne
- Cache persistant des voyages

### 👤 Profile
- Visualisation et modification du profil (nom, avatar)
- Affichage des statistiques : photos, favoris, voyages
- Selection de la langue (FR / EN) avec persistance (avec hook use.translation.ts et config i18n.ts + fichiers de traduction locales fr.json et en.json)
- Sélection du thème (Light / Dark / System) avec persistance (avec hook useTheme.ts) automatique selon les préférences système
---

## 📐 Décisions techniques

### Gestion des favoris
Le backend mock ne fournissant pas de relation utilisateur–favori, les favoris sont gérés localement (état + cache offline). Ce choix permet de respecter les consignes tout en évitant une sur-implémentation backend non demandée.

### Normalisation des dates
Les dates sont normalisées côté frontend (DD/MM/YYYY → ISO) afin d'éviter les erreurs d'affichage et de filtrage.

### Compatibilité Android / iOS
Des ajustements ont été faits côté backend (`server.js`) pour assurer la compatibilité Android (gestion des uploads, URLs localhost adaptées).

---

## 🔒 Sécurité

- Aucun secret exposé dans le frontend
- Tokens JWT stockés de manière sécurisée
- Permissions (caméra, galerie, localisation) gérées avec UX adaptée

---

## 📌 Limites connues

- Modification / suppression de voyage non implémentées (non requises explicitement)
- Favoris non persistés côté backend (choix volontaire documenté)

---

## 🔧 Modifications techniques apportées

- **Fichier `env.ts`** : Amélioration du fallback pour une meilleure compatibilité debugging web et mobile (avec importation de la librairie Platform)
- **Nouveau fix iOS** : Corrections spécifiques pour le fonctionnement sur iOS
- **Fichier `server.js`** : Adaptation de la gestion des URLs et des uploads pour assurer la compatibilité iOS/Android (le backend fourni ne gérait pas correctement Android avec localhost et uploads)

## Notifications aucune modification probleme de compatibilite avec expo sdk 53 donc le modifier serait risque pour la stabilite de lapp