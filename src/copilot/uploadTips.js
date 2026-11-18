// Short tips shown (collapsed) right above each upload button, so applicants check their file before
// uploading. Nothing here opens or reads the file. Based on the lending guide and Real Estate
// flyer (see knowledge.js). English text is the translation key (see i18n/).

const money = (v) => {
  const n = Number(String(v ?? '').replace(/[,$\s]/g, ''))
  return String(v ?? '').trim() && Number.isFinite(n) && n > 0 ? '$' + n.toLocaleString('en-US') : null
}

export const UPLOAD_TEXT = {
  plan: 'Before uploading, make sure your plan covers what you will build and where, the timeline (with construction starting only after the loan closes), your team’s experience, how it will be paid for, and what it does for the neighborhood.',
  budgetTotalLoan: 'Before uploading, make sure this budget totals {total} (your total budget above) and shows the Invest Detroit loan as {loan}. Sources and uses should add up to the same total and include a contingency.',
  budgetTotal: 'Before uploading, make sure this budget totals {total} (your total budget above). Sources and uses should add up to the same total and include a contingency.',
  budgetNoTotal: 'Enter your total budget above first, so you can check that this budget file matches it.',
  team: 'Before uploading, make sure the list gives each person’s name, role and relevant experience, including your lawyer and accountant if you have them.',
  supporting: 'Check that every page is included and easy to read. Upload sensitive documents here only: never send tax returns or bank statements by email.',
}

const T = UPLOAD_TEXT

/**
 * The tip for one upload field, or for the whole 'supporting_docs' section (shown once above
 * its three uploads), or null.
 * @returns {{ text: string, params?: object } | null}
 */
export function uploadTips(id, values = {}) {
  switch (id) {
    case 'doc_project_plan': return { text: T.plan }
    case 'doc_team_list': return { text: T.team }
    case 'supporting_docs': return { text: T.supporting }
    case 'doc_dev_budget': {
      const total = money(values.total_budget)
      const loan = money(values.loan_amount)
      if (!total) return { text: T.budgetNoTotal }
      return loan ? { text: T.budgetTotalLoan, params: { total, loan } } : { text: T.budgetTotal, params: { total } }
    }
    default: return null
  }
}
