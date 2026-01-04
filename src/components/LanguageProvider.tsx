"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  Language,
  LanguageContext,
  loadLanguagePreference,
  saveLanguagePreference,
} from "../lib/i18n";
import { translations, TranslationKey } from "../lib/translations";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load saved language preference on mount
    const savedLanguage = loadLanguagePreference();
    setLanguage(savedLanguage);
    setIsInitialized(true);
  }, []);

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveLanguagePreference(newLanguage);
  };

  const t = (
    key: TranslationKey,
    variables?: Record<string, string | number>
  ): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }

    let text = translation[language] || translation.en;

    if (variables) {
      Object.entries(variables).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`{{${varKey}}}`, "g"), String(value));
      });
    }

    return text;
  };

  // Don't render children until language is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};

