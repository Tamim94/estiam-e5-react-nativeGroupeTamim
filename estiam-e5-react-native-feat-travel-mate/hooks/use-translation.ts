import { useTranslation as useTranslationOriginal } from 'react-i18next';
import { changeLanguage } from '../config/i18n';

export const useTranslation = () => {
  const { t, i18n } = useTranslationOriginal();

  const switchLanguage = async (language: 'fr' | 'en') => {
    await changeLanguage(language);
  };

  // Use i18n.language directly instead of getCurrentLanguage()
  // This will be reactive and update when the language changes
  const currentLanguage = i18n.language || 'fr';

  return {
    t,
    i18n,
    switchLanguage,
    currentLanguage,
  };
};