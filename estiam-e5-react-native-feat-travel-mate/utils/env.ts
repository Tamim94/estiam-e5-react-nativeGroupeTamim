/**
 * Configuration centralisée des variables d'environnement
 * 
 * Approche pro (Approach 2):
 * - Centralisée (une source de vérité)
 * - Typée (TypeScript IntelliSense)
 * - Avec fallbacks
 * - Scalable et maintenable
 * 
 * Recommandation Expo: https://docs.expo.dev/guides/environment-variables/
 */
import { Platform } from 'react-native';

const defaultBackend =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000'
    : 'http://localhost:4000';

export const config = {  //modif du fallback
  mockBackendUrl:
    process.env.EXPO_PUBLIC_MOCK_BACKEND_URL || defaultBackend,
  jsonplaceholderUrl:
    process.env.EXPO_PUBLIC_JSONPLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com',
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
};

// Type pour l'autocomplétion
export type Config = typeof config;
