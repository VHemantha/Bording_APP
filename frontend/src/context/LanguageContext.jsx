import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { LANGUAGES, translations } from '../i18n/translations'

const STORAGE_KEY = 'nestwell.lang'

const LanguageContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // localStorage can be unavailable (private mode); fall through to the default.
  }
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    setLangState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }, [])

  // t('nav.hi', { name: 'Sam' }) -> "Hi, Sam". Missing translations fall back to English.
  const t = useCallback(
    (key, vars) => {
      let text = translations[lang]?.[key] ?? translations.en[key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, value)
        }
      }
      return text
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
