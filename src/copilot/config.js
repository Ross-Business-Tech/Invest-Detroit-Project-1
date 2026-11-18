// Program, form and source settings for the copilot.
// Everything that would differ between the prototype and Invest Detroit's real site lives here
// or in the adapter, so the review rules and assistant code don't need to change.

export const PROGRAM = {
  program: 'real_estate_ci',
  form_id: 'need_support_intake',
  // Version of the official form this field definition was copied from (FormAssembly form 4907942,
  // tfa_dbVersionId 59, page source reviewed 3 Nov 2026). If Invest Detroit edits the form,
  // re-check formDefinition.js and adapters/formAssemblyMap.js against the new version.
  form_version: 'formassembly-4907942-v59',
  locale: 'en-US',
}

/**
 * Official sources the reviewer and assistant may cite. Each record follows the "resource
 * fallback library" fields in the project brief. Only Invest Detroit material is marked
 * `official_policy`; anything else must be labeled as general education.
 */
export const SOURCES = {
  intake_form_v59: {
    title: 'Real Estate/C&I In-Take Form',
    url: 'https://investdetroit.com/need-support/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-03',
  },
  pfs_template: {
    title: 'Personal Financial Statement template',
    url: 'https://investdetroit.com/wp-content/uploads/2025/08/Invest-Detroit-PFS-Form.pdf',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-03',
  },
  program_overviews: {
    title: 'Program Overviews',
    url: 'https://investdetroit.com/program-overviews/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-01',
  },
  language_assistance: {
    title: 'Language Assistance Plan and Policy (2024)',
    url: 'https://investdetroit.com/wp-content/uploads/2024/06/Language-Assistance-Plan-and-Policy-Final-6.17.24.pdf',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-01',
  },
  // The four documents below were shared by Invest Detroit with the student team (Nov 2026) and
  // are treated as public. Rates and fees in them are published ranges, "subject to change".
  re_flyer: {
    title: 'Real Estate Support (program flyer)',
    url: 'https://investdetroit.com/program-overviews/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'real_estate',
    last_verified: '2026-11-04',
  },
  sb_flyer: {
    title: 'Small Business Support (program flyer)',
    url: 'https://investdetroit.com/program-overviews/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'small_business',
    last_verified: '2026-11-04',
  },
  lending_guide: {
    // No public link yet. Draft document: staff should confirm it before real use.
    title: 'Lending Process Overview, Closing Checklist & Client Guide',
    url: null,
    provider: 'Invest Detroit',
    category: 'official_policy',
    status: 'draft',
    last_verified: '2026-11-04',
  },
  about_id: {
    title: 'Who is Invest Detroit?',
    url: 'https://investdetroit.com/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-04',
  },
  // Found by web search (Nov 2026). investdetroit.com could not be opened from the build
  // session, so these were checked from search excerpts only: staff should confirm them.
  cni_page: {
    title: 'Commercial and Industrial (program page)',
    url: 'https://investdetroit.com/commercial-industrial/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'commercial_industrial',
    last_verified: '2026-11-04',
  },
  developer_sheet: {
    title: 'Developers That Reflect Our City (2021 info sheet)',
    url: 'https://investdetroit.com/wp-content/uploads/2021/02/Developer-Info-Sheet_v21.pdf',
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'real_estate',
    last_verified: '2026-11-04',
  },
  snf_overview: {
    title: 'Strategic Neighborhood Fund harnesses the power of partnerships (Knight Foundation)',
    url: 'https://legacy.knightfoundation.org/articles/strategic-neighborhood-fund-harnesses-the-power-of-partnerships-to-revitalize-detroit-neighborhoods/',
    provider: 'Knight Foundation',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  // From the team's research brief (Nov 2026, see docs/RESEARCH-NOTES.md). Invest Detroit pages:
  id_website: {
    title: 'Invest Detroit website (Who We Are, What We Do)',
    url: 'https://investdetroit.com/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-04',
  },
  cni_factsheet_2023: {
    // The only published C&I fact sheet. Numbers may be outdated.
    title: 'Commercial & Industrial fact sheet (February 2023)',
    url: null,
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'commercial_industrial',
    last_verified: '2026-11-04',
  },
  sb_process_2020: {
    title: 'Small Business Lending Process (2020 infographic)',
    url: 'https://investdetroit.com/wp-content/uploads/2020/07/Small-Business-Loan-Process-Infographic.pdf',
    provider: 'Invest Detroit',
    category: 'official_policy',
    program: 'small_business',
    last_verified: '2026-11-04',
  },
  snf_page: {
    title: 'Strategic Neighborhood Fund (Invest Detroit)',
    url: null,
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-04',
  },
  id_ventures: {
    title: 'ID Ventures',
    url: 'https://idventures.com/',
    provider: 'Invest Detroit',
    category: 'official_policy',
    last_verified: '2026-11-04',
  },
  // Government and standards bodies (general education, not Invest Detroit policy).
  hud_income_limits: {
    title: 'HUD FY2026 Income Limits (Detroit-Warren-Livonia, MI HUD Metro FMR Area)',
    url: 'https://www.huduser.gov/portal/datasets/il.html',
    provider: 'U.S. Department of Housing and Urban Development',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  lara_filing: {
    title: 'Michigan LARA online filing (MiBusiness Registry)',
    url: 'https://www.michigan.gov/fileonline',
    provider: 'State of Michigan',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  detroit_parcel_viewer: {
    title: 'City of Detroit Parcel Viewer',
    url: 'https://data.detroitmi.gov/',
    provider: 'City of Detroit',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  detroit_bseed: {
    title: 'City of Detroit BSEED building permits',
    url: null,
    provider: 'City of Detroit',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  occ_cre: {
    title: 'OCC Comptroller\'s Handbook: Commercial Real Estate Lending',
    url: null,
    provider: 'Office of the Comptroller of the Currency',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  fdic_terms: {
    title: 'FDIC examples and definitions (term sheet, loan commitment)',
    url: null,
    provider: 'FDIC',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  cfpb_title: {
    title: 'CFPB: What is a title commitment?',
    url: null,
    provider: 'Consumer Financial Protection Bureau',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  epa_aai: {
    title: 'EPA: All Appropriate Inquiries (Phase I ESA)',
    url: null,
    provider: 'U.S. Environmental Protection Agency',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  alta_standards: {
    title: 'ALTA/NSPS Land Title Survey standards (2026)',
    url: null,
    provider: 'American Land Title Association',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  sba_plan: {
    title: 'SBA: Write your business plan',
    url: null,
    provider: 'U.S. Small Business Administration',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  cdfi_fund: {
    title: 'U.S. Treasury CDFI Fund: CDFI certification',
    url: null,
    provider: 'U.S. Department of the Treasury',
    category: 'educational',
    last_verified: '2026-11-04',
  },
  mi_entity_search: {
    // The official form still links the old search page, which no longer loads (Nov 2026).
    title: 'Michigan business entity search (LARA)',
    url: 'https://www.michigan.gov/corpentitysearch',
    provider: 'State of Michigan',
    category: 'educational',
    last_verified: '2026-11-03',
  },
}

/**
 * How the assistant gets its answers.
 *   'auto':        on a host listed in `server_hosts` (our Vercel site), ask the server at
 *                  `endpoint` (an AI service when its key is set, guardrails enforced server-side), and
 *                  fall back to the field guide if the server can't be reached. Elsewhere
 *                  (here.now, which can't run server code), use the field guide.
 *   'guide':       no AI; answers from the draft field guide in the browser.
 *   'placeholder': no AI; replies say the assistant isn't connected yet.
 *   'http':        always POST to `endpoint`.
 * Never put an API key here: this file ships to every visitor's browser. The key lives in
 * Vercel's environment variables (OPENAI_API_KEY), read only by api/assistant.js.
 */
export const ASSISTANT = {
  mode: 'auto',
  endpoint: '/api/assistant',
  server_hosts: ['.vercel.app', '.onrender.com', 'localhost'], // Vercel and Render run the server; add a custom domain here if one is used
  history_window: 6, // most recent messages sent with each question, not the whole chat
}

/**
 * Where chat feedback ratings are saved. here.now Site Data collection declared in
 * public/.herenow/data.json: visitors can add a rating, only the site owner can read them.
 * Only works on account-owned here.now sites (the team's previews, dev and public sites).
 * null turns the rating card off (the add-on's default on Invest Detroit's site).
 */
export const FEEDBACK = {
  endpoint: './.herenow/data/assistant_feedback',
  // here.now saves ratings in Site Data; our own server (Render/Vercel) saves them at
  // server_endpoint; anywhere else the rating card stays hidden.
  hosts: ['.here.now'],
  server_endpoint: '/api/feedback',
  // "Meaningful interaction": the applicant has sent at least 2 messages and received at least 1 real answer.
  min_user_messages: 2,
  min_answers: 1,
}
