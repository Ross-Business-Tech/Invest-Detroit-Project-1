// Draws one question from the field definition. Used by the prototype form only;
// on Invest Detroit's site the real form draws its own questions.
// Text is translated for display only: answers keep the English option values.
import { useLayoutEffect, useRef } from 'react'
import { useI18n } from './i18nContext.js'
import RichText from './RichText.jsx'
import { FIELD_GUIDE } from '../copilot/fieldGuide.js'
import { formatMoneyInput, moneyNote, checkFile } from '../copilot/formHelpers.js'

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

/**
 * Money box that adds thousands commas as you type ("1450000" -> "1,450,000") and keeps the
 * cursor in place. Stores the formatted text; the review reads it as a number.
 */
function MoneyInput({ inputProps, value, onChange, id }) {
  const ref = useRef(null)
  const caret = useRef(null)
  const shown = formatMoneyInput(value)
  useLayoutEffect(() => {
    if (caret.current === null || !ref.current) return
    // Put the cursor after the same number of digits it was after before formatting.
    let left = caret.current
    let i = 0
    while (i < shown.length && left > 0) { if (/[\d.]/.test(shown[i])) left--; i++ }
    ref.current.setSelectionRange(i, i)
    caret.current = null
  })
  return (
    <input
      {...inputProps}
      ref={ref}
      value={shown}
      onChange={(e) => {
        const el = e.target
        caret.current = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/[^\d.]/g, '').length
        onChange(id, formatMoneyInput(el.value))
      }}
    />
  )
}

/** Short notes under a field: live check results, calculations, file checks. */
function Notes({ id, notes }) {
  const { t } = useI18n()
  const list = (notes || []).filter(Boolean)
  if (!list.length) return null
  return list.map((n, i) => (
    <p key={i} className={`field-note ${n.level || 'calc'}`} id={i === 0 ? `${id}-note` : undefined}>
      {n.level === 'warning' && <span aria-hidden="true">⚠ </span>}
      {t(n.text, n.params)}
    </p>
  ))
}

// Numbers, codes and email addresses stay left-to-right even on Arabic pages.
const LTR_TYPES = new Set(['email', 'tel', 'state', 'zip', 'money', 'number', 'integer'])

/**
 * @param {object} props
 * @param {{ level?: 'blocker'|'warning'|'calc', text: string, params?: object }[]} [props.notes]
 *   live notes shown under the field (checked when the applicant leaves it)
 * @param {boolean} [props.readOnly]
 * @param {(id: string) => void} [props.onBlur]
 * @param {{ name: string, size: number }} [props.file]  the chosen file's name and size (never its contents)
 */
export default function Field({ field, value, error, onChange, onHelp, tips, notes, readOnly, onBlur, file }) {
  const { t } = useI18n()
  const id = field.id
  const errId = `${id}-error`
  const common = {
    id,
    name: id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [field.hint ? `${id}-hint` : '', error ? errId : '', notes?.some(Boolean) ? `${id}-note` : ''].filter(Boolean).join(' ') || undefined,
    'aria-required': field.required ? 'true' : undefined,
  }
  // A review error wins; otherwise show the live notes (an error from a live check looks the same).
  const errorEl = error
    ? <p className="error" id={errId}>{t(error)}</p>
    : <Notes id={id} notes={(notes || []).map((n) => n && (n.level === 'blocker' ? { ...n, level: 'error' } : n))} />
  const hasError = !!error || !!notes?.some((n) => n?.level === 'blocker')
  const cls = `field w-${field.width || 'full'}${hasError ? ' has-error' : ''}`
  const blurProps = onBlur ? { onBlur: () => onBlur(id) } : {}

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
        <div data-field-id={id} className={cls} {...blurProps}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <textarea {...common} rows={5} maxLength={field.maxLength} value={value || ''} onChange={(e) => onChange(id, e.target.value)} />
          {field.maxLength && <p className="hint counter">{(value || '').length}/{field.maxLength}</p>}
          {errorEl}
        </div>
      )
    case 'radio':
      return (
        <div data-field-id={id} className={cls} {...blurProps} role="radiogroup" aria-labelledby={`${id}-label`} id={id}>
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
        <div data-field-id={id} className={cls} {...blurProps} role="group" aria-labelledby={`${id}-label`} id={id}>
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
        <div data-field-id={id} className={cls} {...blurProps}>
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
          <input {...common} aria-describedby={[tips ? `${id}-tips` : '', common['aria-describedby']].filter(Boolean).join(' ') || undefined} type="file" onChange={(e) => { const f = e.target.files?.[0]; onChange(id, f?.name || '', f ? { name: f.name, size: f.size } : null) }} />
          {value && <p className="hint">{t('Selected: {file} (stays on your device)', { file: value })}</p>}
          {value && file?.name === value && <Notes id={`${id}-file`} notes={checkFile(id, file).map((c) => ({ ...c, level: c.level === 'blocker' ? 'error' : c.level === 'info' ? 'calc' : c.level }))} />}
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
        tel: { type: 'tel', maxLength: 16, inputMode: 'tel' },
        state: { type: 'text', maxLength: 2, autoCapitalize: 'characters' },
        zip: { type: 'text', maxLength: 5, inputMode: 'numeric' },
        money: { type: 'text', maxLength: 12, inputMode: 'decimal' },
        number: { type: 'text', inputMode: 'decimal' },
        integer: { type: 'text', inputMode: 'numeric' },
      }[field.type] || { type: 'text', maxLength: field.maxLength }
      return (
        <div data-field-id={id} className={`${cls}${readOnly ? ' is-readonly' : ''}`} {...blurProps}>
          <LabelRow field={field} htmlFor={id} onHelp={onHelp} />
          <div className={field.type === 'money' ? 'money' : undefined}>
            {field.type === 'money' ? (
              <MoneyInput id={id} value={value} onChange={onChange} inputProps={{ ...common, ...inputProps, maxLength: 16, dir: 'ltr', readOnly }} />
            ) : (
              <input
                {...common}
                {...inputProps}
                readOnly={readOnly}
                dir={LTR_TYPES.has(field.type) ? 'ltr' : undefined}
                autoComplete={field.autoComplete || inputProps.autoComplete}
                value={value || ''}
                onChange={(e) => onChange(id, field.type === 'state' ? e.target.value.toUpperCase() : e.target.value)}
              />
            )}
          </div>
          {field.type === 'money' && !error && <Notes id={`${id}-amount`} notes={[moneyNote(value)]} />}
          <Hint field={field} />
          {errorEl}
        </div>
      )
    }
  }
}
