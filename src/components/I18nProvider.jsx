import { useMemo } from 'react'
import { makeT, localeInfo } from '../copilot/i18n/index.js'
import { I18nContext } from './i18nContext.js'

export default function I18nProvider({ locale = 'en', children }) {
  const value = useMemo(() => ({ locale, info: localeInfo(locale), t: makeT(locale) }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
