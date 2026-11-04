// Draws one question from the field definition. Used by the prototype form only;
// on Invest Detroit's site the real form draws its own questions.
// Text is translated for display only: answers keep the English option values.
import { useI18n } from './i18nContext.js'
import RichText from './RichText.jsx'
import { FIELD_GUIDE } from '../copilot/fieldGuide.js'

/** Collapsible tip shown before an upload button (see copilot/uploadTips.js). Closed by default. */
export function UploadTips({ tips, id }) {
  const { t } = useI18n()
  if (!tips) return null
  return (
    <details className="upload-tip">
      <summary>
        <span className="upload-tip-label">{t('Tip')}</span>
        <span className="upload-tip-summary">{t('What to check before uploading')}</span>
      </summary>
      <p id={id}>{t(tips.text, tips.params)}</p>
    </details>
  )
}

function Label({ field, htmlFor, as = 'label' }) {
  const { locale, t } = useI18n()
  const Tag = as
  // Translations mark emphasis themselves (__bruto__), so only English splits on field.emphasis.
  let content = <RichText text={t(field.label)} />
  if (field.emphasis && locale === 'en') {
    const [before, after] = field.label.split(` ${field.emphasis} `)
    content = (
      <>
        {before} <b><u>{field.emphasis}</u></b> {after}
      </>
    )
  }
  return (
    <Tag className="field-label" htmlFor={as === 'label' ? htmlFor : undefined} id={`${field.id}-label`}>
      {content}
      {field.required && <span className="req" aria-hidden="true"> *</span>}
    </Tag>
  )
}

/** Label plus a ? button that asks the chat to explain this question (when the guide covers it). */
function LabelRow({ field, htmlFor, as, onHelp }) {
  const { t } = useI18n()
  const label = <Label field={field} htmlFor={htmlFor} as={as} />
  if (!onHelp || !FIELD_GUIDE[field.id]) return label
  return (
    <div className="label-row">
      {label}
      <button type="button" className="help-btn" aria-label={t('Explain this question')} title={t('Explain this question')} onClick={() => onHelp(field.id)}>?</button>
    </div>
  )
}

function Hint({ field }) {
  const { t } = useI18n()
  if (field.hintLink) {
    const { before, text, href, after } = field.hintLink
    return (
      <p className="hint">
        {t(before)}
        <a href={href} target="_blank" rel="noreferrer">{t(text)}</a>
        {t(after)}
      </p>
    )
  }
  if (field.hintTemplate) return <p className="hint" id={`${field.id}-hint`}>{t(field.hintTemplate, field.hintParams)}</p>
  return field.hint ? <p className="hint" id={`${field.id}-hint`}>{t(field.hint)}</p> : null
}

// Numbers, codes and email addresses stay left-to-right even on Arabic pages.
const LTR_TYPES = new Set(['email', 'tel', 'state', 'zip', 'money', 'number', 'integer'])

export default function Field({ field, value, error, onChange, onHelp, tips }) {
  const { t } = useI18n()
  const id = field.id
  const errId = `${id}-error`
  const common = {
    id,
    name: id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [field.hint ? `${id}-hint` : '', error ? errId : ''].filter(Boolean).join(' ') || undefined,
    'aria-required': field.required ? 'true' : undefined,
  }
  const errorEl = error ? <p className="error" id={errId}>{t(error)}</p> : null
  const cls = `field w-${field.width || 'full'}${error ? ' has-error' : ''}`

  switch (field.type) {
    case 'subheading':
      return <h4 className={`subheading${field.plain ? ' plain' : ''}`}>{t(field.text)}</h4>
    case 'paragraph':
      return <p className="section-paragraph">{t(field.text)}</p>
    case 'disabled':
      return (
        <div data-field-id={id} className={`${cls} is-disabled`}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <input {...common} type="text" disabled value="" placeholder={t('Not collected in prototype')} />
          <p className="hint">{t(field.disabledNote)}</p>
        </div>
      )
    case 'textarea':
      return (
        <div data-field-id={id} className={cls}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <textarea {...common} rows={5} maxLength={field.maxLength} value={value || ''} onChange={(e) => onChange(id, e.target.value)} />
          {field.maxLength && <p className="hint counter">{(value || '').length}/{field.maxLength}</p>}
          {errorEl}
        </div>
      )
    case 'radio':
      return (
        <div data-field-id={id} className={cls} role="radiogroup" aria-labelledby={`${id}-label`} id={id}>
          <LabelRow field={field} as="p" onHelp={onHelp} />
          <div className={`choices ${field.layout === 'vertical' ? 'vertical' : 'horizontal'}`}>
            {field.options.map((opt) => (
              <label key={opt} className="choice">
                <input type="radio" name={id} id={`${id}-${opt}`} value={opt} checked={value === opt} onChange={() => onChange(id, opt)} />
                <span>{t(opt)}</span>
              </label>
            ))}
          </div>
          {errorEl}
        </div>
      )
    case 'checkboxes': {
      const list = Array.isArray(value) ? value : []
      const toggle = (opt) => onChange(id, list.includes(opt) ? list.filter((o) => o !== opt) : [...list, opt])
      return (
        <div data-field-id={id} className={cls} role="group" aria-labelledby={`${id}-label`} id={id}>
          <LabelRow field={field} as="p" onHelp={onHelp} />
          <Hint field={field} />
          <div className="choices grid">
            {field.options.map((opt, i) => (
              <label key={opt} className="choice">
                <input type="checkbox" id={`${id}-${i}`} checked={list.includes(opt)} onChange={() => toggle(opt)} />
                <span>{t(opt)}</span>
              </label>
            ))}
          </div>
          {errorEl}
        </div>
      )
    }
    case 'select':
      return (
        <div data-field-id={id} className={cls}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <select {...common} value={value || ''} onChange={(e) => onChange(id, e.target.value)}>
            <option value="">{t('Please select...')}</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{t(opt)}</option>)}
          </select>
          {field.prototypeNote && <p className="hint proto-note">{t(field.prototypeNote)}</p>}
          {errorEl}
        </div>
      )
    case 'file':
      return (
        <div data-field-id={id} className={cls}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <UploadTips tips={tips} id={`${id}-tips`} />
          <input {...common} aria-describedby={[tips ? `${id}-tips` : '', common['aria-describedby']].filter(Boolean).join(' ') || undefined} type="file" onChange={(e) => onChange(id, e.target.files?.[0]?.name || '')} />
          {value && <p className="hint">{t('Selected: {file} (stays on your device)', { file: value })}</p>}
          <Hint field={field} />
          {errorEl}
        </div>
      )
    case 'ack':
      return (
        <div data-field-id={id} className={`${cls} ack`}>
          <label className="choice">
            <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(id, e.target.checked)} />
            <span>{t(field.label)}{field.required && <span className="req" aria-hidden="true">*</span>}</span>
          </label>
          {errorEl}
        </div>
      )
    default: {
      const inputProps = {
        email: { type: 'email', autoComplete: 'email' },
        tel: { type: 'tel', maxLength: 12 },
        state: { type: 'text', maxLength: 2, autoCapitalize: 'characters' },
        zip: { type: 'text', maxLength: 5, inputMode: 'numeric' },
        money: { type: 'text', maxLength: 12, inputMode: 'decimal' },
        number: { type: 'text', inputMode: 'decimal' },
        integer: { type: 'text', inputMode: 'numeric' },
      }[field.type] || { type: 'text', maxLength: field.maxLength }
      return (
        <div data-field-id={id} className={cls}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <div className={field.type === 'money' ? 'money' : undefined}>
            <input
              {...common}
              {...inputProps}
              dir={LTR_TYPES.has(field.type) ? 'ltr' : undefined}
              autoComplete={field.autoComplete || inputProps.autoComplete}
              value={value || ''}
              onChange={(e) => onChange(id, field.type === 'state' ? e.target.value.toUpperCase() : e.target.value)}
            />
          </div>
          <Hint field={field} />
          {errorEl}
        </div>
      )
    }
  }
}
