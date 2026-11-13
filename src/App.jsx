// Prototype page: a copy of investdetroit.com/need-support with the copilot attached.
// Copilot logic lives in src/copilot (no UI); reusable screens live in src/components.
import { useEffect, useState } from 'react'
import IntakeForm from './prototype/IntakeForm.jsx'
import HowItWorks from './prototype/HowItWorks.jsx'
import ChatAssistant from './components/ChatAssistant.jsx'
import I18nProvider from './components/I18nProvider.jsx'
import LanguagePicker from './components/LanguagePicker.jsx'
import { useI18n } from './components/i18nContext.js'
import { localeInfo, localeFromLang } from './copilot/i18n/index.js'
import { createAssistant } from './copilot/assistant.js'
import { createFeedbackClient } from './copilot/feedback.js'
import { track } from './copilot/events.js'
import { startMetrics } from './copilot/metrics.js'
import { onServerHost } from './copilot/hosting.js'
import './components/copilot.css'
import './App.css'

const STORAGE_KEY = 'idc-language'

function savedLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return localeFromLang(saved)
  } catch { /* storage blocked: fall back to English */ }
  return 'en'
}

function Page({ locale, onLocaleChange }) {
  const { t } = useI18n()
  const [assistant] = useState(() => createAssistant({ onEvent: track }))
  const [feedbackClient] = useState(() => createFeedbackClient({ onEvent: track }))
  const [activeFieldId, setActiveFieldId] = useState(null)
  const [helpRequest, setHelpRequest] = useState(null)
  const askForHelp = (fieldId) => {
    track({ type: 'field_help', field_id: fieldId })
    setHelpRequest((r) => ({ fieldId, n: (r?.n || 0) + 1 }))
  }
  // Anonymous usage counts, only where our server runs (see copilot/metrics.js).
  useEffect(() => startMetrics(), [])

  return (
    <>
      <aside aria-label={t('Prototype notice')}>
        <div className="proto-banner">
          {onServerHost() ? t('Student prototype for the Invest Detroit project. Not the official website. Form answers are not sent anywhere; chat questions are answered by an AI service.') : t('Student prototype for the Invest Detroit project. Not the official website. Nothing you enter is sent anywhere.')}
        </div>
        {locale !== 'en' && (
          <div className="translation-note">
            {t('This page was translated with AI and has not yet been reviewed by a professional translator. If anything is unclear, the English version is the official one.')}
          </div>
        )}
      </aside>

      <header className="site-header">
        <div className="container header-inner">
          <span className="logo">Invest Detroit</span>
          <div className="header-actions">
            <LanguagePicker value={locale} onChange={onLocaleChange} />
            <a href="#form" className="btn yellow">{t('Need Support?')}</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          {/* Photo from Invest Detroit's "Need Support?" page (2016 student service day). */}
          <img className="hero-img" src="/images/need-support-hero.webp" alt="" width="1600" height="900" fetchPriority="high" />
          <div className="hero-title">
            <div className="container">
              <h2>{t('Need Support?')}</h2>
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="band form-band" id="form">
          <div className="band-title"><span>{t('Get In Touch')}</span></div>
          <div className="form-holder">
            <IntakeForm onActiveFieldChange={setActiveFieldId} onHelp={askForHelp} />
          </div>
        </section>

        <section className="band contact-band">
          <div className="band-title"><span>{t('Contact Us')}</span></div>
          <address className="contact" dir="ltr">
            950 Selden Street, Suite 360<br />
            Detroit, MI 48201<br />
            info@investdetroit.com<br />
            313.259.6368
          </address>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>{t('Prototype built by students to test an AI application assistant. Content adapted from the public Invest Detroit intake form. Not affiliated with or endorsed by Invest Detroit.')}</p>
        </div>
      </footer>

      <ChatAssistant assistant={assistant} activeFieldId={activeFieldId} helpRequest={helpRequest} feedbackClient={feedbackClient} waitForReply={onServerHost()} />
    </>
  )
}

export default function App() {
  const [locale, setLocale] = useState(savedLocale)

  // Set the page language and reading direction (Arabic reads right to left).
  useEffect(() => {
    const info = localeInfo(locale)
    document.documentElement.lang = info.bcp47
    document.documentElement.dir = info.dir
    try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* not saved; fine */ }
  }, [locale])

  return (
    <I18nProvider locale={locale}>
      <Page locale={locale} onLocaleChange={setLocale} />
    </I18nProvider>
  )
}
