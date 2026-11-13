import { createContext, useContext } from 'react'
import { makeT, localeInfo } from '../copilot/i18n/index.js'

export const I18nContext = createContext({ locale: 'en', info: localeInfo('en'), t: makeT('en') })

/** { locale, info, t } for the language the applicant picked. */
export const useI18n = () => useContext(I18nContext)
