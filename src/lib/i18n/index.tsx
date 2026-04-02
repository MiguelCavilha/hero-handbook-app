import { createContext, useContext, useState, useCallback } from 'react';
import { pt } from './pt';
import { en } from './en';
import type { Translations } from './pt';

export type Lang = 'pt' | 'en';

const DICTS: Record<Lang, Translations> = { pt, en };
const STORAGE_KEY = 'hh-lang';

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt' || stored === 'en') return stored;
  } catch {}
  return 'pt'; // PT-BR default
}

interface I18nContextValue {
  t: Translations;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: pt,
  lang: 'pt',
  setLang: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return (
    <I18nContext.Provider value={{ t: DICTS[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
