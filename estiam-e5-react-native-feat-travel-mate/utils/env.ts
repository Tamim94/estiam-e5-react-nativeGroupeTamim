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
import Constants from 'expo-constants';

const getDefaultBackend = () => {
  // For Android Emulator ( i use android studio btw)
  if (Platform.OS === 'android' && Constants.isDevice === false) {
    return 'http://10.0.2.2:4000';
  }

  //Pour expo go sur device physique
  // Replace with your actual local network IP (run `ipconfig` on Windows or `ifconfig` on Mac/Linux)!!!!!!
  return 'http://192.168.1.20:4000';
};

const defaultBackend = getDefaultBackend();


export const config = {  //modif du fallback
  mockBackendUrl:
    process.env.EXPO_PUBLIC_MOCK_BACKEND_URL || defaultBackend,
  jsonplaceholderUrl:
    process.env.EXPO_PUBLIC_JSONPLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com',
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
};

// Type pour l'autocomplétion
export type Config = typeof config;
