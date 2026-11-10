// Slim progress bar that stays at the top while scrolling: required answers done, and a short list
// of sections ("Contact ✓ · Business info 2 left · Documents 0/3"). Tapping a section jumps to it.

import { useEffect, useState } from 'react'
import { formProgress } from '../copilot/formHelpers.js'
import { useI18n } from '../components/i18nContext.js'

export default function FormProgress({ values }) {
  const { t } = useI18n()
  const { sections, done, total } = formProgress(values)
  const pct = total ? Math.round((done / total) * 100) : 0
  const [top, setTop] = useState(0)

  // Sit just under the sticky site header, whatever its height on this screen.
  useEffect(() => {
    const header = document.querySelector('.site-header')
    if (!header) return
    const update = () => setTop(header.offsetHeight)
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(header)
    return () => ro?.disconnect()
  }, [])

  const jump = (id) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <nav className="form-progress" style={{ top }} aria-label={t('Form progress')}>
      <div className="fp-summary">
        <span className="fp-count">{t('{done} of {total} required answers', { done, total })}</span>
        <div className="fp-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('Form progress')}>
          <div className="fp-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ol className="fp-sections">
        {sections.map((s) => {
          const complete = s.done === s.total
          const left = t('{count} left', { count: s.total - s.done })
          const status = complete ? '✓' : s.isDocs ? `${s.done}/${s.total}` : String(s.total - s.done)
          return (
            <li key={s.id}>
              <button type="button" className={complete ? 'complete' : undefined} onClick={() => jump(s.id)} title={complete ? undefined : left} aria-label={complete ? `${t(s.label)} ✓` : `${t(s.label)} ${status} (${left})`}>
                {t(s.label)} <span className="fp-status">{status}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
