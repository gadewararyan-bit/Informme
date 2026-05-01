
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../constants/translations';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (user?.language) {
      setLanguageState(user.language as Language);
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: lang });
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
