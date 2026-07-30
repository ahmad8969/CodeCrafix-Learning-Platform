import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const dictionaries = {
  en: {
    'nav.overview': 'Overview',
    'nav.courses': 'Courses',
    'nav.messages': 'Messages',
    'common.loading': 'Loading…',
    'common.retry': 'Retry',
    'common.empty': 'Nothing here yet',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children, defaultLocale = 'en' }) {
  const [locale, setLocale] = useState(defaultLocale)
  const dir = locale === 'ar' || locale === 'ur' || locale === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  const value = useMemo(
    () => ({
      locale,
      dir,
      setLocale,
      t: (key, fallback) => dictionaries[locale]?.[key] || dictionaries.en[key] || fallback || key,
      formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
      formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    }),
    [locale, dir]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
