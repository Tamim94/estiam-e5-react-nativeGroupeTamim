# estiam-e5-react-native
React Native Project
modification du fallback fichier env.ts pour une meilleur compatibilite debuggage web et mobile (avec importation de librarie platforme)
new fix pour les IOS
Le backend fourni ne gérait pas correctement Android (localhost, uploads).
J’ai adapté la gestion des URLs et des uploads pour assurer la compatibilité iOS / Android.(dans le fichier server.js)
# Pour start le project ouvrez 2 terminal , 1 dans le dossier estiam-e5-react-native-feat-travel-mate et l'autre dans le dossier estiam-e5-react-native-mock-backend-nodejs-clean.
# Commande npm install dans les 2 terminal .
# Dans le terminal estiam-e5-react-native-mock-backend-nodejs-clean lancez la commande npm run dev pour demarrer le serveur backend mock.
# Dans le terminal estiam-e5-react-native-feat-travel-mate lancez la commande npx expo start pour demarrer l'application mobile.

# Groupe E5 WMD :  Tamim GOLAM HOSSAIN - Hamid OKETOKOUN - Quentin GAUTIER
-------------------------------- README de l exam V1 ----------------------- 

# TravelMate — React Native / Expo Router

Projet Fil Rouge — Native Cross Platform Development  
Année académique 2025–2026

---

## 🚀 Description

TravelMate est une application mobile de gestion de voyages développée avec **React Native** et **Expo Router**.  
Elle permet aux utilisateurs de créer, consulter et organiser leurs voyages, avec support **offline**, **upload d’images**, **authentification JWT** et **notifications**.

---

## 🛠️ Stack technique

- React Native (Expo)
- Expo Router
- TypeScript
- Backend mock Express.js
- JWT Authentication
- AsyncStorage (cache & offline)
- Expo Image Picker / Location
- Notifications Expo

---

## ▶️ Lancer le projet

### Frontend
```bash
npm install
npx expo start
Backend mock
bash
Copy code
cd ./estiam-e5-react-native-mock-backend-nodejs-clean
npm install
npm start
Serveur disponible sur http://localhost:4000

⚠️ Sur Android émulateur, l’URL 10.0.2.2 est utilisée au lieu de localhost.

✅ Fonctionnalités implémentées
Authentification
Login / Register

Refresh token

Auth Guard avec Expo Router

Déconnexion complète

Trips
Création de voyage avec validation

Upload réel des images avec progression

Listing des voyages depuis l’API (GET /trips)

Support offline (création mise en queue)

Cache local des voyages

Recherche (titre + destination)

Filtres :

All

Upcoming

Past

Favorites

Favorites
Possibilité de marquer un voyage comme favori
Les favoris sont gérés localement via AsyncStorage afin d’éviter une sur-implémentation backend non requise dans le cadre d’un backend mock. Cette solution est compatible avec le mode hors ligne.
Gestion locale via état + cache offline

Aucun endpoint backend spécifique requis (backend mock)

Home
Données réelles (pas de données en dur)

Statistiques calculées à partir des voyages

Voyages à venir

Actions rapides fonctionnelles

Offline
Détection hors ligne

File d’attente des actions

Synchronisation automatique au retour en ligne

Cache persistant des voyages

📐 Décisions techniques
Favoris
Le backend mock ne fournissant pas de relation utilisateur–favori, les favoris sont gérés localement (état + cache offline).
Ce choix permet de respecter les consignes tout en évitant une sur-implémentation backend non demandée.

Dates
Les dates sont normalisées côté frontend (DD/MM/YYYY → ISO) afin d’éviter les erreurs d’affichage et de filtrage.

Android / iOS
Des ajustements ont été faits côté backend pour assurer la compatibilité Android (uploads, URLs publiques).

Profile 
L'utilisateur peut voir et modifier son profil (nom, avatar). Les stats photos favori voyage sont affichées.

🔒 Sécurité
Aucun secret exposé dans le frontend

Tokens JWT stockés de manière sécurisée

Permissions (caméra, galerie, localisation) gérées avec UX adaptée

📌 Limites connues
Modification / suppression de voyage non implémentées (non requises explicitement)

Favoris non persistés côté backend (choix volontaire documenté)