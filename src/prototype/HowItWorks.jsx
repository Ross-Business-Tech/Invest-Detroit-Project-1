// "How it works": who Invest Detroit helps, which form fits which project, and the steps of
// applying. Same facts as the official page, laid out so an applicant can scan it.
import { useI18n } from '../components/i18nContext.js'
import Icon from './Icon.jsx'
import { ROUTES, STEPS } from './howItWorksText.js'

export default function HowItWorks() {
  const { t } = useI18n()
  return (
    <section className="band how-it-works">
      <div className="inner wide">
        <h3>{t('How it works')}</h3>
        <p className="hiw-lead">{t('Invest Detroit works with developers, business owners, entrepreneurs, and startup founders to help accomplish our mission to be a financial catalyst for economic growth in underserved communities and markets in Detroit and the region. We believe in one Detroit for all and welcome funding interest from Detroit residents, entrepreneurs of color, women, and immigrants.')}</p>

        <h4 className="hiw-heading">{t('Which form is right for you?')}</h4>
        <ul className="route-cards">
          {ROUTES.map((r) => {
            const external = !r.href.startsWith('#')
            return (
              <li key={r.title} className={`route-card${r.current ? ' current' : ''}`}>
                {r.current && <span className="route-badge">{t('This form')}</span>}
                <span className="route-icon"><Icon name={r.icon} size={26} /></span>
                <h5>{t(r.title)}</h5>
                <p>{t(r.text)}</p>
                <a className={r.current ? 'route-action primary' : 'route-action'} href={r.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                  {t(r.action)} <Icon name={external ? 'external' : 'arrowDown'} size={16} />
                </a>
              </li>
            )
          })}
        </ul>

        <h4 className="hiw-heading">{t('How applying works')}</h4>
        <ol className="apply-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <div>
                <strong>{t(s.title)}</strong>
                <span>{t(s.text)}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
