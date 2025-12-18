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