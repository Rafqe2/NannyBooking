import { createContext, useContext } from 'react';

export type Language = 'en' | 'lv' | 'ru';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation function with variable substitution
export const translate = (
  translations: Record<Language, string>,
  language: Language,
  variables?: Record<string, string | number>
): string => {
  let text = translations[language] || translations.en;
  
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
  }
  
  return text;
};

// Language configuration
export const LANGUAGES = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'lv' as Language, name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'ru' as Language, name: 'Russian', nativeName: 'Русский' },
];

// Get browser language or default to English
export const getBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('lv')) return 'lv';
  if (browserLang.startsWith('ru')) return 'ru';
  return 'en';
};

// Save language preference to localStorage
export const saveLanguagePreference = (language: Language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nannybooking-language', language);
  }
};

// Load language preference from localStorage
export const loadLanguagePreference = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('nannybooking-language') as Language;
  if (saved && ['en', 'lv', 'ru'].includes(saved)) {
    return saved;
  }
  
  return getBrowserLanguage();
};

