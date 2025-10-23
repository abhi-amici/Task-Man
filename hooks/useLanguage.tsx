import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/locales';
import { translateText } from '../services/translationService';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  translateDynamic: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations;
    try {
      for (const k of keys) {
        result = result[k];
      }
      return result[language] || key;
    } catch (error) {
      return key;
    }
  }, [language]);

  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    return translateText(text, language);
  }, [language]);
  
  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    translateDynamic
  }), [language, t, translateDynamic]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
