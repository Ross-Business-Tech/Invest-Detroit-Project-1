// "Before you start" checklist shown above the form. The form can't be saved partway through,
// so this tells applicants what to gather first.
import { FIELDS_BY_ID } from '../copilot/formDefinition.js'
import { useI18n } from '../components/i18nContext.js'
import { NUMBERS } from './beforeYouStartText.js'

const REQUIRED = ['doc_project_plan', 'doc_dev_budget', 'doc_team_list']
const HELPFUL = ['doc_pfs', 'doc_tax_returns', 'doc_bank_statements']

function List({ title, items }) {
  return (
    <div className="bys-group">
      <h4>{title}</h4>
      <ul>
        {items.map((label) => <li key={label}>{label}</li>)}
      </ul>
    </div>
  )
}

export default function BeforeYouStart() {
  const { t } = useI18n()
  return (
    <details className="before-you-start" open>
      <summary>{t('Before you start')}</summary>
      <p>{t('This form can’t be saved partway through, so it helps to have these ready before you begin.')}</p>
      <div className="bys-grid">
        <List title={t('Required Documents')} items={REQUIRED.map((id) => t(FIELDS_BY_ID[id].label))} />
        <List title={t('Helpful if you have them')} items={HELPFUL.map((id) => t(FIELDS_BY_ID[id].label))} />
        <List title={t('Numbers you’ll be asked for')} items={NUMBERS.map((s) => t(s))} />
      </div>
      <p className="bys-note">{t('Some questions ask about eligibility, legal history and the owners’ backgrounds. For the background questions you can always choose “Prefer not to say”.')}</p>
    </details>
  )
}
