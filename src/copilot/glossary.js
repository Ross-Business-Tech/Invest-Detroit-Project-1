// Glossary: plain-language definitions of lending and real estate terms applicants meet on this
// form and later in the process. General education from federal and standards sources (see
// SOURCES in config.js), NOT Invest Detroit policy. Where Invest Detroit hasn't published its own
// requirement (for example a minimum DSCR or maximum LTV), the entry says so.
//
// Same shape as TOPICS entries. English only for now.

const NOT_PUBLISHED = 'Invest Detroit doesn\'t publish its own requirement for this, so ask the team.'

export const GLOSSARY = [
  {
    id: 'g_dscr',
    program: 'general_education',
    keywords: ['dscr', 'debt service coverage', 'debt coverage', 'coverage ratio', 'debt service'],
    explain: 'DSCR (debt service coverage ratio) compares a property\'s income to its loan payments: net operating income (NOI) divided by the year\'s loan payments ("debt service"). Above 1.0 means income covers the payments; lenders usually want a cushion above that. ' + NOT_PUBLISHED,
    example: '$130,000 NOI ÷ $100,000 of yearly loan payments = a DSCR of 1.30.',
    source_ids: ['occ_cre'],
  },
  {
    id: 'g_noi',
    program: 'general_education',
    keywords: ['noi', 'net operating income'],
    explain: 'NOI (net operating income) is a property\'s yearly income (rent plus things like parking, laundry and vending) minus its operating expenses (taxes, insurance, utilities, repairs, management). It leaves out loan payments, so it shows what the property earns before debt.',
    example: '$200,000 rent and other income - $70,000 operating expenses = $130,000 NOI.',
    source_ids: ['occ_cre'],
  },
  {
    id: 'g_ltv_ltc',
    program: 'general_education',
    keywords: ['ltv', 'loan-to-value', 'loan to value', 'ltc', 'loan-to-cost', 'loan to cost', 'debt yield'],
    explain: 'Loan-to-value (LTV) is the loan divided by the property\'s market value. Loan-to-cost (LTC) is the loan divided by the total cost of buying and building the project. Both show how much of the project is borrowed; the rest comes from your equity and other sources. If a lender\'s loan sits behind another lender, it counts both loans against the value. ' + NOT_PUBLISHED,
    example: 'A $700,000 loan on a $1,000,000 property is 70% LTV. A $1,600,000 loan on a $2,000,000 total cost is 80% LTC.',
    source_ids: ['occ_cre'],
  },
  {
    id: 'g_hard_soft',
    program: 'general_education',
    keywords: ['hard costs', 'hard cost', 'soft costs', 'soft cost', 'developer fee'],
    explain: 'Hard costs are the physical construction: site work, the building itself, the general contractor\'s fee and general conditions. Soft costs are everything else that comes with building but isn\'t labor or materials: architecture and engineering, permits, legal, insurance, predevelopment costs and interest during construction. A reasonable developer fee is often counted as a soft cost. Both belong in your total budget and on the "uses" side of your sources and uses.',
    source_ids: ['occ_cre'],
  },
  {
    id: 'g_contingency',
    program: 'general_education',
    keywords: ['contingency', 'cost overrun', 'overruns', 'unexpected costs'],
    explain: 'A contingency is a budget line for surprises, such as higher material prices or problems found during construction. Bank examiners (OCC) say contingencies vary with a project\'s size and complexity but usually run 5% to 10% of the budget. ' + NOT_PUBLISHED,
    example: 'A $1,450,000 project with a 7% contingency adds about $101,500.',
    source_ids: ['occ_cre'],
  },
  {
    id: 'g_pro_forma',
    program: 'general_education',
    keywords: ['pro forma', 'proforma', 'cash flow projection', 'cash flow projections', 'financial projections', 'projections', 'projected income'],
    explain: 'A pro forma (or financial projection) estimates how the project or business will perform: rents or sales, vacancy, expenses, NOI and loan payments, usually by year. Lenders check that the assumptions are reasonable for the market. The SBA suggests five years of projected income statements, balance sheets and cash flow (monthly or quarterly for the first year), plus 3–5 years of past statements for an existing business. Invest Detroit\'s 2020 checklist asks for 1–3 years of projections with your assumptions written out.',
    mistakes: ['Projections with no stated assumptions.', 'Rents or sales far above what similar properties nearby get.'],
    source_ids: ['occ_cre', 'sba_plan', 'sb_process_2020'],
  },
  {
    id: 'g_title',
    program: 'general_education',
    keywords: ['title commitment', 'title binder', 'title report', 'title insurance'],
    explain: 'A title commitment comes from a title insurance company before closing. It describes who owns the property and what affects the title (mortgages, liens, easements), lists what must be cleared before closing, and lists what the title policy won\'t cover. It is on the lending guide\'s closing checklist.',
    source_ids: ['cfpb_title', 'lending_guide'],
  },
  {
    id: 'g_survey',
    program: 'general_education',
    keywords: ['survey', 'alta survey', 'land title survey', 'easement', 'encroachment'],
    explain: 'An ALTA/NSPS Land Title Survey is a commercial property survey done to a national standard. It shows boundaries, easements, encroachments, access and other things that affect the title. The current 2026 standards took effect February 23, 2026. A survey is on the lending guide\'s closing checklist.',
    source_ids: ['alta_standards', 'lending_guide'],
  },
  {
    id: 'g_phase1',
    program: 'general_education',
    keywords: ['phase i', 'phase 1', 'environmental', 'environmental report', 'environmental site assessment', 'contamination', 'all appropriate inquiries'],
    explain: 'A Phase I Environmental Site Assessment (ESA) reviews a property\'s history and condition for possible contamination. The EPA calls this "All Appropriate Inquiries". Under federal law, owners can be liable for cleanup, and a proper Phase I can help an owner who didn\'t cause contamination seek protection. Environmental reports are on the lending guide\'s closing checklist when they apply.',
    source_ids: ['epa_aai', 'lending_guide'],
  },
  {
    id: 'g_borrowing_resolution',
    program: 'general_education',
    keywords: ['borrowing resolution', 'resolution to borrow', 'authorized signer', 'who can sign'],
    explain: 'A borrowing resolution is a written approval from a company\'s members, managers or board that lets the company take the loan and names who may sign the loan documents. It is on the lending guide\'s closing checklist with the other organization documents.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'g_amortization',
    program: 'general_education',
    keywords: ['amortization', 'amortize', 'amortizing', 'amortized', 'balloon payment', 'fully amortizing'],
    explain: 'Amortization means paying a loan down with regular payments over a set period. "Fully amortizing" means it is paid off by the end of its term. A 5-year term with 15–20 year amortization means payments are sized as if the loan lasted 15–20 years, and the remaining balance (a "balloon") is due at year 5.',
    source_ids: ['occ_cre'],
  },
]
