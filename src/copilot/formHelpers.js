// Small, framework-free helpers that make the form easier to fill in: money formatting, the 10%
// equity math, ZIP-to-state, phone and file checks, and per-section progress. No UI code, so the
// add-on for Invest Detroit's real form can reuse them. English text is the translation key.

import { visibleSections, validate, INPUT_TYPES } from './formDefinition.js'

// ---- Money ---------------------------------------------------------------------------------

/** "$1,450,000" or "1450000" -> 1450000; null when it isn't a number. */
export function parseMoney(v) {
  const s = String(v ?? '').replace(/[$,\s]/g, '')
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null
  return Number(s)
}

/** What the applicant typed -> digits with thousands commas, keeping cents if typed. "1450000" -> "1,450,000". */
export function formatMoneyInput(raw) {
  const s = String(raw ?? '').replace(/[^\d.]/g, '')
  if (!s) return ''
  const [whole, ...rest] = s.split('.')
  const int = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return rest.length ? `${int || '0'}.${rest.join('').slice(0, 2)}` : int
}

export const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

export const MONEY_TEXT = {
  millions: 'About {amount} million',
  thousands: 'About {amount} thousand',
}

/** "About $1.45 million" style note for a money answer, or null for small or empty amounts. */
export function moneyNote(v) {
  const n = parseMoney(v)
  if (n === null || n < 1000) return null
  if (n >= 1e6) return { text: MONEY_TEXT.millions, params: { amount: '$' + String(Number((n / 1e6).toFixed(2))) } }
  return { text: MONEY_TEXT.thousands, params: { amount: '$' + String(Math.round(n / 1e3)) } }
}

// ---- 10% equity ----------------------------------------------------------------------------

export const EQUITY_TEXT = '10% of {budget} = {ten}'

/** "10% of $1,450,000 = $145,000", shown next to the equity question once a budget is entered. */
export function equityMath(values) {
  const budget = parseMoney(values.total_budget)
  if (!budget) return null
  return { text: EQUITY_TEXT, params: { budget: money(budget), ten: money(Math.ceil(budget * 0.1)) } }
}

// ---- ZIP and state -------------------------------------------------------------------------

/** Pairs of ZIP and state fields on the form. */
export const ZIP_STATE = { home_zip: 'home_state', business_zip: 'business_state', project_zip: 'project_state' }

/**
 * State for a ZIP code, only where it is certain: Michigan ZIP codes start 480–499.
 * (The city is never filled in: a ZIP code doesn't decide the city. Detroit-area ZIP codes
 * also cover Hamtramck and Highland Park, which the form excludes.)
 */
export function stateForZip(zip) {
  const s = String(zip ?? '').trim()
  if (!/^\d{5}$/.test(s)) return null
  const p = Number(s.slice(0, 3))
  return p >= 480 && p <= 499 ? 'MI' : null
}

export const ZIP_TEXT = 'This ZIP code is in Michigan. Please check the state.'

// ---- Files (checked without opening them) --------------------------------------------------

const OK_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png'])
const LARGE = 10 * 1024 * 1024
const GENERIC_NAME = /^(scan|scanned|img|image|dsc|dcim|pxl|photo|picture|screenshot|screen shot|document|doc|file|untitled|new document|attachment|download|cam|camscanner)?[\s_-]*\(?\d*\)?(\s*\(\d+\))?$/i

export const FILE_EXAMPLES = {
  doc_project_plan: 'Project-Plan.pdf',
  doc_dev_budget: 'Development-Budget.pdf',
  doc_team_list: 'Team-List.pdf',
  doc_pfs: 'Personal-Financial-Statement.pdf',
  doc_tax_returns: 'Tax-Returns-2023-2025.pdf',
  doc_bank_statements: 'Bank-Statements.pdf',
}

export const FILE_TEXT = {
  empty: 'This file is empty (0 bytes). Please choose the file again.',
  type: 'Files ending in .{ext} may not open for Invest Detroit staff. A PDF works best.',
  large: 'This file is large ({size}). If it doesn’t upload, try saving a smaller PDF.',
  name: 'Consider renaming this file so staff can tell what it is, for example "{example}".',
}

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * Checks on a chosen file using only its name, size and type: the contents are never read.
 * @param {string} fieldId
 * @param {{ name: string, size: number }} file
 * @returns {{ level: 'blocker'|'warning'|'info', key: string, text: string, params?: object }[]}
 */
export function checkFile(fieldId, file) {
  if (!file?.name) return []
  const out = []
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
  const base = file.name.replace(/\.[^.]*$/, '').trim()
  if (file.size === 0) out.push({ level: 'blocker', key: 'empty', text: FILE_TEXT.empty })
  if (!OK_EXT.has(ext)) out.push({ level: 'warning', key: 'type', text: FILE_TEXT.type, params: { ext: ext || '?' } })
  if (file.size > LARGE) out.push({ level: 'warning', key: 'large', text: FILE_TEXT.large, params: { size: mb(file.size) } })
  if (!base || GENERIC_NAME.test(base) || /^\d+$/.test(base)) {
    out.push({ level: 'info', key: 'name', text: FILE_TEXT.name, params: { example: FILE_EXAMPLES[fieldId] || 'Project-Plan.pdf' } })
  }
  return out
}

// ---- Progress by section -------------------------------------------------------------------

export const SECTION_SHORT = {
  contact: 'Contact',
  company: 'Company',
  project_address: 'Project',
  questions: 'Questions',
  business_info: 'Business',
  construction: 'Construction',
  retail: 'Retail',
  office: 'Office',
  residential: 'Residential',
  impact: 'Impact',
  required_docs: 'Documents',
  supporting_docs: 'Supporting documents',
  acknowledgements: 'Sign-off',
}

const filled = (v) => !(v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0))

/**
 * Required answers done per visible section (only sections with required questions).
 * An answer counts as done when it is filled in and passes the form's format checks.
 * @returns {{ sections: { id: string, label: string, done: number, total: number, isDocs: boolean }[], done: number, total: number }}
 */
export function formProgress(values) {
  const errors = validate(values)
  const sections = []
  for (const s of visibleSections(values)) {
    const req = s.fields.filter((f) => f.required && INPUT_TYPES.has(f.type))
    if (!req.length) continue
    const done = req.filter((f) => filled(values[f.id]) && !errors[f.id]).length
    sections.push({ id: s.id, label: SECTION_SHORT[s.id] || s.title, done, total: req.length, isDocs: s.id === 'required_docs' })
  }
  return {
    sections,
    done: sections.reduce((n, s) => n + s.done, 0),
    total: sections.reduce((n, s) => n + s.total, 0),
  }
}
