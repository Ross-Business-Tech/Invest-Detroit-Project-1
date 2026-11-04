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
  mi_entity_search: {
    title: 'Michigan business entity search (LARA)',
    url: 'https://cofs.lara.state.mi.us/searchapi/search/search',
    provider: 'State of Michigan',
    category: 'educational',
    last_verified: '2026-11-03',
  },
}

/**
 * How the assistant gets its answers.
 *   'guide':       no AI; answers from the draft field guide in the browser (current prototype).
 *   'placeholder': no AI; replies say the assistant isn't connected yet.
 *   'http':        POST to `endpoint` (a here.now proxy route, or an Invest Detroit backend).
 * Never put an API key here: this file ships to every visitor's browser.
 */
export const ASSISTANT = {
  mode: 'guide',
  endpoint: './.herenow/proxy/assistant',
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
  // "Meaningful interaction": the applicant has sent at least 2 messages and received at least 1 real answer.
  min_user_messages: 2,
  min_answers: 1,
}
