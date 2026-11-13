// Text for the "How it works" section (translated in src/copilot/i18n).

export const ROUTES = [
  { icon: 'building', title: 'Real estate & industrial', text: 'Buying, building, renovating or refinancing property, and industrial projects.', action: 'Start the form', href: '#form', current: true },
  { icon: 'store', title: 'Small business', text: 'Loans and support for a business you run in Detroit.', action: 'Go to the small business page', href: 'https://investdetroit.com/small-business/' },
  { icon: 'rocket', title: 'ID Ventures', text: 'Venture capital for startups, through Invest Detroit’s venture capital arm.', action: 'Visit ID Ventures', href: 'https://idventures.com/' },
]

export const STEPS = [
  { title: 'Gather your documents', text: 'Use the checklist below. The form can’t be saved partway through.' },
  { title: 'Fill in the form', text: 'Press ? next to any question for a plain-language explanation.' },
  { title: 'Review and submit', text: 'Review My Application checks your answers before you send them.' },
  { title: 'Hear from the team', text: 'Someone from Invest Detroit will be in touch about next steps.' },
]

/** Step 1's text when answers can be saved (the demo's drafts, or FormAssembly's Save & Resume). */
export const SAVE_STEP_TEXT = 'Use the checklist below. You can save and finish later.'

/** Every string above, for the translation check. */
export const HOW_IT_WORKS_TEXT = [
  ...ROUTES.flatMap((r) => [r.title, r.text, r.action]),
  ...STEPS.flatMap((s) => [s.title, s.text]),
  SAVE_STEP_TEXT,
]
