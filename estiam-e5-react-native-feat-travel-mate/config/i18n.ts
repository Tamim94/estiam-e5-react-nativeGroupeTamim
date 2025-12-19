import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  },
};

// Initialize i18n
const initI18n = async () => {
  let savedLanguage = 'fr'; // Default to French

  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      savedLanguage = storedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'fr',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false,
      },
    });
};

// Initialize on module load
initI18n();

// Function to change language and save preference
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Function to get current language
export const getCurrentLanguage = () => {
  return i18n.language || 'fr';
};

export default i18n;

