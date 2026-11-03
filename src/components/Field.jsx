// Draws one question from the field definition. Used by the prototype form only;
// on Invest Detroit's site the real form draws its own questions.

function Label({ field, htmlFor, as = 'label' }) {
  const Tag = as
  let content = field.label
  if (field.emphasis) {
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

function Hint({ field }) {
  if (field.hintLink) {
    const { before, text, href, after } = field.hintLink
    return (
      <p className="hint">
        {before}
        <a href={href} target="_blank" rel="noreferrer">{text}</a>
        {after}
      </p>
    )
  }
  return field.hint ? <p className="hint" id={`${field.id}-hint`}>{field.hint}</p> : null
}

export default function Field({ field, value, error, onChange }) {
  const id = field.id
  const errId = `${id}-error`
  const common = {
    id,
    name: id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [field.hint ? `${id}-hint` : '', error ? errId : ''].filter(Boolean).join(' ') || undefined,
    'aria-required': field.required ? 'true' : undefined,
  }
  const errorEl = error ? <p className="error" id={errId}>{error}</p> : null
  const cls = `field w-${field.width || 'full'}${error ? ' has-error' : ''}`

  switch (field.type) {
    case 'subheading':
      return <h4 className={`subheading${field.plain ? ' plain' : ''}`}>{field.text}</h4>
    case 'paragraph':
      return <p className="section-paragraph">{field.text}</p>
    case 'disabled':
      return (
        <div data-field-id={id} className={`${cls} is-disabled`}>
          <Label field={field} htmlFor={id} />
          <input {...common} type="text" disabled value="" placeholder="Not collected in prototype" />
          <p className="hint">{field.disabledNote}</p>
        </div>
      )
    case 'textarea':
      return (
        <div data-field-id={id} className={cls}>
          <Label field={field} htmlFor={id} />
          <textarea {...common} rows={5} maxLength={field.maxLength} value={value || ''} onChange={(e) => onChange(id, e.target.value)} />
          {field.maxLength && <p className="hint counter">{(value || '').length}/{field.maxLength}</p>}
          {errorEl}
        </div>
      )
    case 'radio':
      return (
        <div data-field-id={id} className={cls} role="radiogroup" aria-labelledby={`${id}-label`} id={id}>
          <Label field={field} as="p" />
          <div className={`choices ${field.layout === 'vertical' ? 'vertical' : 'horizontal'}`}>
            {field.options.map((opt) => (
              <label key={opt} className="choice">
                <input type="radio" name={id} id={`${id}-${opt}`} value={opt} checked={value === opt} onChange={() => onChange(id, opt)} />
                <span>{opt}</span>
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
          <Label field={field} as="p" />
          <Hint field={field} />
          <div className="choices grid">
            {field.options.map((opt, i) => (
              <label key={opt} className="choice">
                <input type="checkbox" id={`${id}-${i}`} checked={list.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
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
          <Label field={field} htmlFor={id} />
          <select {...common} value={value || ''} onChange={(e) => onChange(id, e.target.value)}>
            <option value="">Please select...</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {field.prototypeNote && <p className="hint proto-note">{field.prototypeNote}</p>}
          {errorEl}
        </div>
      )
    case 'file':
      return (
        <div data-field-id={id} className={cls}>
          <Label field={field} htmlFor={id} />
          <input {...common} type="file" onChange={(e) => onChange(id, e.target.files?.[0]?.name || '')} />
          {value && <p className="hint">Selected: {value} (stays on your device)</p>}
          <Hint field={field} />
          {errorEl}
        </div>
      )
    case 'ack':
      return (
        <div data-field-id={id} className={`${cls} ack`}>
          <label className="choice">
            <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(id, e.target.checked)} />
            <span>{field.label}{field.required && <span className="req" aria-hidden="true">*</span>}</span>
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
          <Label field={field} htmlFor={id} />
          <div className={field.type === 'money' ? 'money' : undefined}>
            <input
              {...common}
              {...inputProps}
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
