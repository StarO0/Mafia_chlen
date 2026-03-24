/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { dictionaries } from '../i18n/dictionaries.js'

const I18nContext = createContext(null)

function readInitialLanguage() {
  const saved = window.localStorage.getItem('mafia-lang')
  return saved === 'en' ? 'en' : 'ru'
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage)

  const setLanguage = (nextLang) => {
    const normalized = nextLang === 'en' ? 'en' : 'ru'
    window.localStorage.setItem('mafia-lang', normalized)
    setLanguageState(normalized)
  }

  const t = useMemo(() => dictionaries[language], [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRu: language === 'ru',
    }),
    [language, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
