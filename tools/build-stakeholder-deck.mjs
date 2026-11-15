// Builds the final presentation deck: docs/slides/Invest-Detroit-Copilot-Final-Presentation.pptx
// (opens in Google Slides). Written for Invest Detroit stakeholders: the need, how it is built
// (the backend), limits and cost, and ways to make it stronger. It deliberately has NO feature
// walkthrough: the presenter shows the features in the live demo. The older, screenshot-heavy
// deck (Invest-Detroit-Copilot-Client-Deck.pptx, built by build-client-deck.mjs) is the feature
// reference.
//
// Run (needs two packages that are not part of the app, so install them without saving):
//   npm install --no-save pptxgenjs sharp
//   node tools/build-stakeholder-deck.mjs
//
// Every number comes from the repository: 28 sources, 51 question help entries, 47 topics and
// ~14,000 prompt tokens (server/knowledgeContext.js), 17 review rules, 206 automated tests,
// the 46-example test set (docs/handoff/test-results.json) and node tools/measure-impact.mjs (2/10 vs 10/10).
import pptxgen from 'pptxgenjs'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMG = path.join(ROOT, 'docs/slides/deck-images')
const OUT = path.join(ROOT, 'docs/slides/Invest-Detroit-Copilot-Final-Presentation.pptx')
const LIVE = 'invest-detroit-project-1.onrender.com'

// ---- look ----
const INK = '1F2623', YEL = 'FFB81C', GRN = '1E7A4B', RED = 'B3261E', ORG = 'B26A00', BLU = '3A6EA5'
const GRAY = 'F4F5F4', MID = '5B6560', LINE = 'D9DDDA', WHITE = 'FFFFFF'
const PALEGRN = 'E3F1E9', PALERED = 'F9E4E2', PALEYEL = 'FFF4D6', PALEBLU = 'E6EFF8'
const HEAD = 'Cambria', BODY = 'Calibri'

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625 in
pres.title = 'Invest Detroit Application Copilot: final presentation'
pres.author = 'Invest Detroit Team #1'

pres.defineSlideMaster({
  title: 'CONTENT', background: { color: WHITE },
  objects: [{ text: { text: 'Invest Detroit Application Copilot  ·  Invest Detroit Team #1  ·  November 17, 2026', options: { x: 0.5, y: 5.28, w: 7, h: 0.25, fontFace: BODY, fontSize: 10, color: MID, margin: 0 } } }],
  slideNumber: { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 10, color: MID, align: 'right' },
})
pres.defineSlideMaster({ title: 'DARK', background: { color: INK } })

const SH = pres.ShapeType
const T = (s, text, x, y, w, h, o = {}) => s.addText(text, { x, y, w, h, fontFace: BODY, fontSize: 12, color: INK, margin: 0, valign: 'top', isTextBox: true, ...o })
const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: 5, ...o } }))
const rich = (parts) => parts.map(([text, bold, color], i) => ({ text, options: { bold: !!bold, color: color || INK, breakLine: false } }))

function chip(s, text, x = 0.5, y = 0.3, color = YEL, tcolor = INK) {
  const w = 0.35 + text.length * 0.092
  s.addShape(SH.roundRect, { x, y, w, h: 0.26, rectRadius: 0.13, fill: { color }, line: { color, width: 0 } })
  T(s, text.toUpperCase(), x, y, w, 0.26, { fontSize: 10.5, bold: true, color: tcolor, align: 'center', valign: 'middle', charSpacing: 1 })
}

function content(title, tag, notes) {
  const s = pres.addSlide({ masterName: 'CONTENT' })
  chip(s, tag)
  T(s, title, 0.5, 0.62, 9, 0.6, { fontFace: HEAD, fontSize: 27, bold: true, valign: 'middle' })
  if (notes) s.addNotes(notes)
  return s
}

function dark(notes) {
  const s = pres.addSlide({ masterName: 'DARK' })
  s.addShape(SH.ellipse, { x: 6.9, y: -1.7, w: 5.6, h: 5.6, fill: { color: YEL, transparency: 90 }, line: { color: YEL, width: 0 } })
  s.addShape(SH.ellipse, { x: 7.4, y: -1.2, w: 4.6, h: 4.6, fill: { color: INK, transparency: 100 }, line: { color: YEL, width: 1.25, transparency: 65 } })
  s.addShape(SH.ellipse, { x: 8.2, y: 4.3, w: 3.0, h: 3.0, fill: { color: WHITE, transparency: 95 }, line: { color: WHITE, width: 0 } })
  if (notes) s.addNotes(notes)
  return s
}

/** Section divider: a big number, the section name and a one-line promise. */
function divider(num, title, line, items, notes) {
  const s = dark(notes)
  T(s, num, 0.6, 1.0, 2.2, 1.3, { fontFace: HEAD, fontSize: 80, bold: true, color: YEL, valign: 'bottom' })
  T(s, title, 0.6, 2.4, 8.2, 0.9, { fontFace: HEAD, fontSize: 38, bold: true, color: WHITE, valign: 'top' })
  T(s, line, 0.6, 3.35, 7.6, 0.6, { fontSize: 16, color: 'D5DAD7' })
  if (items) T(s, items.join('   ·   '), 0.6, 4.55, 8.6, 0.4, { fontSize: 12, color: YEL, bold: true })
  return s
}

/** A soft card with a colored stripe on the left. */
function card(s, x, y, w, h, title, body, { color = INK, fill = GRAY, tsize = 14, bsize = 12, bodyColor = MID } = {}) {
  s.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: fill, width: 0 } })
  s.addShape(SH.rect, { x, y: y + 0.08, w: 0.06, h: h - 0.16, fill: { color }, line: { color, width: 0 } })
  T(s, title, x + 0.2, y + 0.1, w - 0.32, 0.32, { fontSize: tsize, bold: true })
  if (body) T(s, body, x + 0.2, y + 0.1 + tsize / 72 * 1.55, w - 0.32, h - 0.2 - tsize / 72 * 1.55, { fontSize: bsize, color: bodyColor })
}

/** A big number with a label. */
function stat(s, x, y, w, h, big, label, sub, { color = INK, fill = GRAY, bigSize = 34 } = {}) {
  s.addShape(SH.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: fill, width: 0 } })
  T(s, big, x, y + 0.1, w, h * 0.5, { fontFace: HEAD, fontSize: bigSize, bold: true, color, align: 'center', valign: 'middle' })
  T(s, label, x + 0.1, y + h * 0.5 + 0.1, w - 0.2, 0.3, { fontSize: 12, bold: true, align: 'center' })
  if (sub) T(s, sub, x + 0.12, y + h * 0.5 + 0.38, w - 0.24, h * 0.5 - 0.45, { fontSize: 10.5, color: MID, align: 'center' })
}

const arrow = (s, x1, y1, x2, y2, { color = MID, dash } = {}) => s.addShape(SH.line, {
  x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
  flipH: x2 < x1, flipV: y2 < y1, line: { color, width: 1.75, endArrowType: 'triangle', dashType: dash },
})

const numDot = (s, n, x, y, color = INK, tcolor = WHITE) => {
  s.addShape(SH.ellipse, { x, y, w: 0.32, h: 0.32, fill: { color }, line: { color, width: 0 } })
  T(s, String(n), x, y, 0.32, 0.32, { fontSize: 12, bold: true, color: tcolor, align: 'center', valign: 'middle' })
}

const footnote = (s, text) => {
  s.addShape(SH.roundRect, { x: 0.5, y: 4.72, w: 9, h: 0.4, rectRadius: 0.05, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
  T(s, text, 0.65, 4.72, 8.7, 0.4, { fontSize: 11, color: MID, valign: 'middle' })
}

async function pic(slide, file, box, alt) {
  const m = await sharp(path.join(IMG, file)).metadata()
  const k = Math.min(box.w / m.width, box.h / m.height)
  const pw = m.width * k, ph = m.height * k
  const x = box.x + (box.w - pw) / 2, y = box.y + (box.h - ph) / 2
  slide.addShape(SH.rect, { x, y, w: pw, h: ph, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 8, offset: 2, angle: 90 } })
  slide.addImage({ path: path.join(IMG, file), x, y, w: pw, h: ph, altText: alt })
  return { x, y, w: pw, h: ph }
}

// =========================================================================================
// OPENING
// =========================================================================================

{ // 1. Title
  const s = dark('Open with the one-sentence version: we built a copilot that sits on top of the form Invest Detroit already runs, helping applicants get it right the first time, and we are going to show you the product in a live demo and then spend most of our time on how it is built, what it costs and where it falls short. We are presenting this to you as the people who would run it.')
  T(s, 'INVEST DETROIT  ·  REAL ESTATE/C&I IN-TAKE FORM', 0.6, 0.7, 8, 0.3, { fontSize: 12, bold: true, color: YEL, charSpacing: 2 })
  T(s, 'Invest Detroit\nApplication Copilot', 0.6, 1.2, 8.4, 1.9, { fontFace: HEAD, fontSize: 48, bold: true, color: WHITE, valign: 'top' })
  T(s, 'Helping applicants get the form right the first time, and giving staff a head start. Built on the form you already use.', 0.6, 3.2, 6.8, 0.9, { fontSize: 18, color: 'D5DAD7' })
  T(s, 'Invest Detroit Team #1  ·  Johnny Lin, Ginny Liu, Shantanu Shah, Samantha Luu', 0.6, 4.55, 8.6, 0.3, { fontSize: 13, color: YEL, bold: true })
  T(s, 'Ross School of Business  ·  November 17, 2026', 0.6, 4.85, 8, 0.3, { fontSize: 12, color: 'AAB2AE' })
}

{ // 2. Agenda
  const s = content('What we will cover', 'Agenda', 'Walk through the agenda quickly. The shape of the talk: the people and the problem first, then the live demo of every feature, then the backend, which is the part you cannot see in the demo, then honest limits and cost, then how we would make it stronger.')
  const items = [
    ['1', 'The need', 'Who it is for and what they run into on the form today', YEL],
    ['', 'Live demo', 'A walkthrough of the whole site, feature by feature', GRN],
    ['2', 'How it is built', 'The backend: AI, knowledge base, safety, data, hosting', YEL],
    ['3', 'Limits and cost', 'What it cannot do yet, and what it costs to run', YEL],
    ['4', 'Making it stronger', 'The path from prototype to something you rely on', YEL],
  ]
  items.forEach(([n, t, d, c], i) => {
    const y = 1.45 + i * 0.7
    s.addShape(SH.roundRect, { x: 0.5, y, w: 9, h: 0.58, rectRadius: 0.06, fill: { color: n ? GRAY : PALEGRN }, line: { color: n ? GRAY : PALEGRN, width: 0 } })
    s.addShape(SH.rect, { x: 0.5, y: y + 0.07, w: 0.06, h: 0.44, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, n || 'DEMO', 0.7, y, 0.65, 0.58, { fontFace: n ? HEAD : BODY, fontSize: n ? 22 : 10.5, bold: true, color: n ? ORG : GRN, valign: 'middle', charSpacing: n ? 0 : 1 })
    T(s, t, 1.35, y, 2.7, 0.58, { fontSize: 16, bold: true, valign: 'middle' })
    T(s, d, 4.0, y, 5.4, 0.58, { fontSize: 13, color: MID, valign: 'middle' })
  })
}

// =========================================================================================
// 1. THE NEED
// =========================================================================================

divider('01', 'The need', 'Who we built this for, and what they run into on the form today.', ['Stakeholders', 'The process', 'The problem', 'Our approach'],
  'Section 1. Keep this short: the point is to make the problem concrete before the demo so every feature you show answers something real.')

{ // 4. Stakeholders
  const s = content('Who this is for', 'Stakeholders', 'These five groups are our understanding of who is affected. Tell Invest Detroit these are assumptions to correct, not facts we measured. The applicant and the screening staff member are the two people the form touches directly; the other three decide whether it can run at all.')
  const cards = [
    ['Applicants', 'Developers and business owners seeking Real Estate or C&I financing, including first-timers and non-English speakers.', 'Get it right the first time, in plain language.', YEL],
    ['Screening staff', 'The team that reads each new intake form and checks mission fit and feasibility.', 'Complete, consistent applications, with context up front.', BLU],
    ['Lending leadership', 'Responsible for the program and for what an AI is allowed to say in its name.', 'Evidence it works, and firm limits on what it can claim.', GRN],
    ['Web and IT team', 'Own the WordPress site and the FormAssembly form.', 'An easy install that cannot break the form, and a clear data flow.', ORG],
    ['Data and reporting team', 'Own Invest Detroit’s database and reports.', 'Usage data flowing into their own system.', RED],
  ]
  const pos = [[0.5, 1.4, 2.9], [3.55, 1.4, 2.9], [6.6, 1.4, 2.9], [0.5, 3.15, 4.425], [5.075, 3.15, 4.425]]
  cards.forEach(([t, who, need, c], i) => {
    const [x, y, w] = pos[i]
    s.addShape(SH.roundRect, { x, y, w, h: 1.58, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: y + 0.08, w: 0.06, h: 1.42, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.2, y + 0.1, w - 0.3, 0.3, { fontSize: 14.5, bold: true })
    T(s, who, x + 0.2, y + 0.45, w - 0.32, 0.65, { fontSize: 11, color: MID })
    T(s, [{ text: 'Needs: ', options: { bold: true, color: INK } }, { text: need, options: { color: INK } }], x + 0.2, y + 1.1, w - 0.32, 0.45, { fontSize: 11 })
  })
}

{ // 5. Where the intake form sits
  const s = content('The intake form is the front door', 'The process', 'This comes from Invest Detroit’s own lending guide. The intake form is the first step, and everything after it depends on what arrives here: the timeline, the questions staff ask, even how much follow-up is needed. Typical times are from the guide; every loan is different.')
  const steps = [['Intake form', 'the first step', YEL, INK], ['Screening', '1–2 weeks', GRAY, INK], ['Term sheet', '2–6 weeks', GRAY, INK], ['Commitment', '5–10 weeks', GRAY, INK], ['Closing', '4–6 weeks', GRAY, INK]]
  steps.forEach(([t, d, fill, tc], i) => {
    const x = 0.5 + i * 1.8
    s.addShape(SH.homePlate, { x, y: 1.45, w: 1.85, h: 0.95, fill: { color: fill }, line: { color: i === 0 ? YEL : LINE, width: 1 } })
    T(s, t, x + 0.12, 1.55, 1.45, 0.4, { fontSize: 14, bold: true, color: tc, valign: 'middle' })
    T(s, d, x + 0.12, 1.95, 1.45, 0.3, { fontSize: 11.5, color: i === 0 ? INK : MID })
  })
  T(s, 'Typical times from Invest Detroit’s lending guide. Every project is different.', 0.5, 2.5, 9, 0.25, { fontSize: 10.5, color: MID, italic: true })
  stat(s, 0.5, 2.95, 2.9, 1.65, '48', 'required answers', 'across 10 sections, from contact details to financials, impact and sign-off', { bigSize: 38 })
  stat(s, 3.55, 2.95, 2.9, 1.65, '3', 'required documents', 'project plan, development budget and team list, plus optional personal financial statement, tax returns and bank statements', { bigSize: 38 })
  card(s, 6.6, 2.95, 2.9, 1.65, 'Why it matters', 'A contradiction or a gap here is found later, by staff, during screening. The earlier it is caught, the less back-and-forth before the real work starts.', { color: ORG, fill: PALEYEL, tsize: 14, bsize: 11.5, bodyColor: INK })
}

{ // 6. What applicants run into
  const s = content('What applicants run into today', 'The problem', 'These two pictures are our practice copy of the original form’s behavior: the original only checks that required boxes are filled and that formats look right. Enter a loan larger than the whole project and it still says Submitted successfully. Nothing here is invented: we reproduced the original form’s checks and ran ten example mistakes through them. Only 2 of 10 were caught.')
  await pic(s, 'before-budget-fields.png', { x: 0.5, y: 1.45, w: 4.6, h: 0.9 }, 'Loan of 2,000,000 next to a total budget of 1,450,000')
  T(s, 'A $2,000,000 loan request on a $1,450,000 project…', 0.5, 2.4, 4.6, 0.3, { fontSize: 11, italic: true, color: MID })
  await pic(s, 'before-submitted.png', { x: 1.15, y: 2.8, w: 3.3, h: 1.85 }, 'Submitted successfully screen')
  T(s, '…and the original form accepts it.', 0.5, 4.68, 4.6, 0.3, { fontSize: 11, italic: true, color: MID })
  const pts = [
    ['A long form with no help', '48 required answers and terms like AMI, DSCR and “sources and uses”, with no explanation beside the question.', RED],
    ['Checks blanks and formats only', 'Numbers that contradict each other, such as units that do not add up or a loan larger than the budget, go straight through.', ORG],
    ['No saving partway', 'Leave the page and the answers are gone. Documents have to be gathered before starting.', BLU],
    ['Easy to guess wrong', 'Questions about equity, ownership percentages and what a document should contain are easy to misread.', GRN],
  ]
  pts.forEach(([t, d, c], i) => card(s, 5.35, 1.4 + i * 0.9, 4.15, 0.82, t, d, { color: c, tsize: 12.5, bsize: 10.5 }))
}

{ // 7. Problem statements
  const s = content('Problem statements', 'The problem', 'Frame these as How Might We questions. They are the design brief for everything you will see in the demo and in the backend. The measured fact at the bottom is the one number we can defend: we ran the same ten example mistakes through the original form’s checks and through our copilot. What we have NOT measured yet is time saved and follow-up emails; that needs a pilot with real applicants.')
  const hmw = [
    ['Applicant', 'How might we help someone submit a complete, consistent application without needing to know lending jargon?', YEL],
    ['Screening staff', 'How might we hand staff applications whose contradictions are already flagged, instead of finding them later by email?', BLU],
    ['Invest Detroit', 'How might we add help to the form you already run without replacing it, putting decisions in an AI’s hands, or exposing applicant data?', GRN],
  ]
  hmw.forEach(([who, q, c], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 2.45, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, who.toUpperCase(), x + 0.2, 1.6, 2.5, 0.25, { fontSize: 10.5, bold: true, color: MID, charSpacing: 1 })
    T(s, q, x + 0.2, 1.95, 2.55, 1.8, { fontFace: HEAD, fontSize: 15.5, bold: true })
  })
  s.addShape(SH.roundRect, { x: 0.5, y: 4.05, w: 9, h: 0.95, rectRadius: 0.06, fill: { color: PALEYEL }, line: { color: PALEYEL, width: 0 } })
  T(s, '2 of 10', 0.7, 4.05, 1.9, 0.95, { fontFace: HEAD, fontSize: 30, bold: true, color: RED, valign: 'middle' })
  T(s, [{ text: 'What we measured on the original form: ', options: { bold: true } }, { text: 'its own checks catch 2 of 10 common mistakes we tested (a blank required answer and a mistyped email). The other 8, including a loan larger than the budget, pass. Time saved and fewer follow-up emails are not measured yet; they need a pilot.', options: {} }], 2.5, 4.1, 6.9, 0.85, { fontSize: 11.5, valign: 'middle' })
}

{ // 8. Our approach
  const s = content('How we approached it', 'Our approach', 'This slide foreshadows the backend section. Each principle is a decision you can hold us to, and each one shows up as something concrete in how it is built: the split between rules and AI, the knowledge base, the guardrails, the add-on design.')
  const ps = [
    ['Help before Submit', 'Catch the problem while the applicant can still fix it, not after staff have found it.', YEL],
    ['Rules where it must be exact, AI where language helps', 'Checks that must always give the same answer are fixed rules. The AI only explains and answers questions.', BLU],
    ['Facts only from your documents', 'Rates, fees, steps and contacts come from Invest Detroit’s own material, with the source shown.', GRN],
    ['People decide', 'It never predicts approval, eligibility or anyone’s rate. Staff make every decision.', RED],
    ['Sit on top, never replace', 'It adds to the FormAssembly form you run. If it ever fails, the form still works.', ORG],
  ]
  ps.forEach(([t, d, c], i) => {
    const y = 1.4 + i * 0.72
    s.addShape(SH.roundRect, { x: 0.5, y, w: 9, h: 0.62, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x: 0.5, y: y + 0.07, w: 0.06, h: 0.48, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, i + 1, 0.75, y + 0.15, c, c === YEL ? INK : WHITE)
    T(s, t, 1.25, y, 3.6, 0.62, { fontSize: 13.5, bold: true, valign: 'middle' })
    T(s, d, 4.9, y, 4.5, 0.62, { fontSize: 11.5, color: MID, valign: 'middle' })
  })
}

{ // 9. Demo
  const s = dark('This slide is a bookmark: switch to the live site now. Use the sample applicant only. Suggested path: the page and the guided start, filling in the form with help buttons and live notes, Review My Application with an explanation note, the chat assistant including a question it should refuse, switching language to Arabic, then Submit and the staff summary. When you come back, move on to the backend section. If you prefer a different order, drag this slide.')
  T(s, 'LIVE DEMO', 0.6, 1.6, 8, 0.4, { fontSize: 14, bold: true, color: YEL, charSpacing: 3 })
  T(s, 'The whole website,\none feature at a time', 0.6, 2.1, 8.4, 1.7, { fontFace: HEAD, fontSize: 44, bold: true, color: WHITE })
  T(s, 'As an applicant, and as screening staff.', 0.6, 3.95, 8, 0.4, { fontSize: 18, color: 'D5DAD7' })
  T(s, LIVE, 0.6, 4.6, 8, 0.35, { fontSize: 15, bold: true, color: YEL })
}

// =========================================================================================
// 2. HOW IT IS BUILT
// =========================================================================================

divider('02', 'How it is built', 'The backend, and everything the demo does not show.', ['Architecture', 'AI and knowledge base', 'Safety and privacy', 'Hosting and data', 'Testing'],
  'Section 2 is the heart of this presentation. Frame it as: you have seen what it does, now here is how it works underneath and why you can trust it.')

{ // 11. Architecture
  const s = content('The big picture', 'Architecture', 'Walk left to right. The applicant is on Invest Detroit’s own WordPress page, filling in their own FormAssembly form. A single script tag, the add-on, adds our features on top. The add-on talks to a small server we host on Render. That server decides whether to call the AI, and keeps anonymous counts in a database. Applications themselves never come to us: Submit goes to FormAssembly exactly as today. The dashed box is Invest Detroit’s own database and reports, which you connect to ours.')
  // left: site
  s.addShape(SH.roundRect, { x: 0.5, y: 1.4, w: 2.8, h: 2.15, rectRadius: 0.06, fill: { color: GRAY }, line: { color: LINE, width: 1 } })
  T(s, 'investdetroit.com', 0.65, 1.47, 2.5, 0.25, { fontSize: 11, bold: true, color: MID })
  T(s, '(WordPress page)', 0.65, 1.68, 2.5, 0.22, { fontSize: 10, color: MID })
  s.addShape(SH.roundRect, { x: 0.7, y: 1.98, w: 2.4, h: 0.62, rectRadius: 0.05, fill: { color: WHITE }, line: { color: LINE, width: 1 } })
  T(s, 'FormAssembly form\n(unchanged)', 0.7, 1.98, 2.4, 0.62, { fontSize: 11.5, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 0.7, y: 2.75, w: 2.4, h: 0.62, rectRadius: 0.05, fill: { color: YEL }, line: { color: YEL, width: 0 } })
  T(s, 'Copilot add-on\n(one script tag)', 0.7, 2.75, 2.4, 0.62, { fontSize: 11.5, bold: true, align: 'center', valign: 'middle' })
  // middle: server
  s.addShape(SH.roundRect, { x: 3.85, y: 1.4, w: 2.75, h: 2.15, rectRadius: 0.06, fill: { color: INK }, line: { color: INK, width: 0 } })
  T(s, 'Copilot server', 4.0, 1.47, 2.5, 0.25, { fontSize: 12.5, bold: true, color: YEL })
  T(s, 'Node.js on Render', 4.0, 1.7, 2.5, 0.22, { fontSize: 10, color: 'AAB2AE' })
  T(s, bullets(['Safety checks (guardrails)', 'Knowledge base', 'AI connection and fallback', 'Limits and usage counts'], { color: WHITE }), 4.0, 2.05, 2.5, 1.4, { fontSize: 11.5, color: WHITE })
  // right column
  s.addShape(SH.roundRect, { x: 7.15, y: 1.4, w: 2.35, h: 0.95, rectRadius: 0.06, fill: { color: PALEBLU }, line: { color: BLU, width: 1 } })
  T(s, 'AI model\n(OpenAI API)', 7.15, 1.4, 2.35, 0.95, { fontSize: 12, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 7.15, y: 2.6, w: 2.35, h: 0.95, rectRadius: 0.06, fill: { color: PALEGRN }, line: { color: GRN, width: 1 } })
  T(s, 'Postgres database\n(anonymous counts, limits)', 7.15, 2.6, 2.35, 0.95, { fontSize: 11.5, bold: true, align: 'center', valign: 'middle' })
  // bottom row
  s.addShape(SH.roundRect, { x: 0.5, y: 3.85, w: 2.8, h: 0.75, rectRadius: 0.06, fill: { color: WHITE }, line: { color: LINE, width: 1 } })
  T(s, 'Invest Detroit’s FormAssembly account\napplications + staff summary, as today', 0.55, 3.85, 2.7, 0.75, { fontSize: 10.5, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 7.15, y: 3.85, w: 2.35, h: 0.75, rectRadius: 0.06, fill: { color: WHITE }, line: { color: RED, width: 1.25, dashType: 'dash' } })
  T(s, 'Invest Detroit’s database\nand reports (you connect)', 7.15, 3.85, 2.35, 0.75, { fontSize: 10.5, bold: true, align: 'center', valign: 'middle', color: RED })
  // arrows
  arrow(s, 3.1, 3.06, 3.85, 3.06, { color: INK })
  T(s, 'chat, ratings,\ncounts', 3.08, 2.55, 0.8, 0.4, { fontSize: 8.5, color: MID, align: 'center' })
  arrow(s, 6.6, 1.88, 7.15, 1.88, { color: BLU })
  arrow(s, 6.6, 3.07, 7.15, 3.07, { color: GRN })
  arrow(s, 1.9, 3.55, 1.9, 3.85, { color: INK })
  T(s, 'Submit', 1.98, 3.55, 0.7, 0.3, { fontSize: 9, color: MID, valign: 'middle' })
  arrow(s, 8.325, 3.55, 8.325, 3.85, { color: RED, dash: 'dash' })
  T(s, 'export / push', 8.4, 3.55, 1.1, 0.3, { fontSize: 9, color: RED, valign: 'middle' })
  footnote(s, 'Applications go to FormAssembly, never to our server. Only chat questions and anonymous counts reach it.')
}

{ // 12. AI vs fixed rules
  const s = content('What is AI, and what is fixed rules', 'Architecture', 'This is the slide to slow down on for the skeptical stakeholder. Most of the product is deliberately not AI. The review has to give the same answer every time and be explainable to an applicant, so it is a list of seventeen rules and some arithmetic. The safety checks are fixed pattern lists so they cannot be talked around. Only the chat answers use AI, and even those are grounded in a knowledge base. Nothing the AI says can block an applicant from submitting.')
  const rows = [
    ['Part', 'How it works', 'Why we built it that way'],
    ['Review My Application', 'Fixed rules and arithmetic (17 checks)', 'Same answer every time; explainable; the AI never blocks Submit'],
    ['Safety checks', 'Fixed pattern lists, before and after the AI', 'Cheap, predictable and cannot be talked around'],
    ['Chat answers', 'AI (OpenAI), grounded in our knowledge base', 'Understands natural questions in five languages'],
    ['Staff summary', 'Built in the browser from the review result', 'No AI; goes only to FormAssembly'],
    ['Upload checks', 'Fixed rules on file name, size and type', 'We never open an applicant’s files'],
  ]
  const hs = { bold: true, color: WHITE, fill: { color: INK }, fontSize: 12 }
  const cell = (t, o = {}) => ({ text: t, options: { fontSize: 11.5, color: INK, ...o } })
  s.addTable(rows.map((r, i) => r.map((t, j) => (i === 0 ? { text: t, options: hs } : cell(t, { bold: j === 0, fill: { color: j === 1 && (i === 3) ? PALEBLU : i % 2 ? WHITE : GRAY } })))), {
    x: 0.5, y: 1.45, w: 9, colW: [2.1, 3.4, 3.5], rowH: [0.38, 0.54, 0.54, 0.54, 0.54, 0.54], fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.04, 0.1, 0.04, 0.1],
  })
  footnote(s, 'Only one row is AI, and it is the one that has to understand free-form language.')
}

{ // 13. Chat pipeline
  const s = content('How one chat question is answered', 'AI infrastructure', 'Trace one question through the seven steps. Point out that the AI is step four and step five of seven: it is surrounded by checks. If a safety check stops the question at step three, the AI is never called, so it costs nothing and cannot be tricked. If anything fails at any point, the built-in guide answers instead, so the chat never breaks.')
  const steps = [
    ['Browser', 'Hides anything that looks like an SSN or account number. Sends the question, which form question it is on, and the last 6 messages.'],
    ['Server checks', 'Size, per-minute rate limit, and daily limits per visitor and for the whole site.'],
    ['Safety checks', 'Off-topic, falsifying, prompt tricks, requests for secrets: a fixed reply. The AI is never called.'],
    ['Build the request', 'Our instructions + the knowledge base (about 14,000 tokens, cached) + the question + the applicant’s language.'],
    ['AI answers', 'In a strict format: the answer, source ids, whether staff must take over, and whether it is in scope.'],
    ['Output check', 'Blocks leaked instructions or keys. Keeps only sources we know. Never shows a cut-off or refused answer.'],
    ['Reply', 'The answer with its sources. If anything failed along the way, the built-in guide answers instead.'],
  ]
  const xs = [0.5, 2.8, 5.1, 7.4, 0.5, 2.8, 5.1]
  const ys = [1.4, 1.4, 1.4, 1.4, 3.15, 3.15, 3.15]
  steps.forEach(([t, d, ], i) => {
    const x = xs[i], y = ys[i]
    const special = i === 2 ? PALERED : i === 4 ? PALEBLU : i === 6 ? PALEGRN : GRAY
    const col = i === 2 ? RED : i === 4 ? BLU : i === 6 ? GRN : INK
    s.addShape(SH.roundRect, { x, y, w: 2.1, h: 1.6, rectRadius: 0.06, fill: { color: special }, line: { color: special, width: 0 } })
    numDot(s, i + 1, x + 0.12, y + 0.12, col)
    T(s, t, x + 0.52, y + 0.12, 1.5, 0.32, { fontSize: 12.5, bold: true, valign: 'middle' })
    T(s, d, x + 0.14, y + 0.52, 1.85, 1.05, { fontSize: 10, color: i === 2 || i === 4 || i === 6 ? INK : MID })
  })
  ;[[2.6, 2.2], [4.9, 2.2], [7.2, 2.2], [2.6, 3.95], [4.9, 3.95]].forEach(([x, y]) => T(s, '›', x, y - 0.3, 0.2, 0.5, { fontSize: 22, bold: true, color: MID, align: 'center', valign: 'middle' }))
  card(s, 7.4, 3.15, 2.1, 1.6, 'If it fails', 'AI down, key wrong, answer cut off: the built-in guide answers. Failures are counted by type.', { color: ORG, fill: PALEYEL, tsize: 12.5, bsize: 10, bodyColor: INK })
}

{ // 14. Knowledge base
  const s = content('How the AI is grounded: the knowledge base', 'AI infrastructure', 'The question you will get is: how did you train the AI. The honest answer is that we did not train or fine-tune any model. We give the AI a curated knowledge base with every question and tell it to answer Invest Detroit specifics only from that. The four documents Invest Detroit shared always win any disagreement with web research, and a test enforces that. This is why it quotes your rates as published and says subject to change.')
  // pyramid-ish layers
  const layers = [
    ['1', 'The four Invest Detroit documents', 'Real Estate flyer, Small Business flyer, lending guide, “Who is Invest Detroit?”: these win every disagreement', GRN, PALEGRN],
    ['2', 'Other Invest Detroit material', 'The intake form itself, program pages, fact sheets, personal financial statement template, language policy', BLU, PALEBLU],
    ['3', 'Official public sources', 'HUD income limits, City of Detroit, Michigan LARA, OCC, FDIC, CFPB, EPA, SBA, CDFI Fund', MID, GRAY],
  ]
  layers.forEach(([n, t, d, c, f], i) => {
    const y = 1.4 + i * 0.98
    s.addShape(SH.roundRect, { x: 0.5, y, w: 5.35, h: 0.88, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x: 0.5, y: y + 0.08, w: 0.06, h: 0.72, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, n, 0.72, y + 0.28, c)
    T(s, t, 1.2, y + 0.08, 4.5, 0.3, { fontSize: 13, bold: true })
    T(s, d, 1.2, y + 0.38, 4.5, 0.5, { fontSize: 10.5, color: MID })
  })
  T(s, 'Higher layers win. A test fails if web research ever overrides a published Invest Detroit rate.', 0.5, 4.35, 5.35, 0.3, { fontSize: 10.5, italic: true, color: MID })
  stat(s, 6.1, 1.4, 1.65, 1.2, '28', 'sources', null, { bigSize: 30 })
  stat(s, 7.85, 1.4, 1.65, 1.2, '51', 'question guides', null, { bigSize: 30 })
  stat(s, 6.1, 2.7, 1.65, 1.2, '47', 'topics', null, { bigSize: 30 })
  stat(s, 7.85, 2.7, 1.65, 1.2, '~14k', 'tokens per question', null, { bigSize: 28 })
  card(s, 6.1, 4.0, 3.4, 0.62, 'Not trained: grounded', null, { color: YEL, fill: PALEYEL, tsize: 12 })
  T(s, 'No model is trained or fine-tuned. The knowledge base goes with each question.', 6.3, 4.28, 3.1, 0.34, { fontSize: 9.5, color: INK })
  footnote(s, 'Because facts live in documents, not in a model, a rate change is a document edit, not a retraining project.')
}

{ // 15. What the AI may and may not say
  const s = content('What the AI may and may not say', 'AI infrastructure', 'These rules are written into the AI’s instructions and checked by tests. The split that matters: Invest Detroit specifics come only from the knowledge base, with the source named. General help, like explaining a financial term, is allowed because refusing it would make the tool useless. And there are things it must never do, regardless of how the question is asked.')
  const cols = [
    ['Only from the knowledge base', GRN, PALEGRN, ['Rates, fees and loan sizes, quoted as published and “subject to change”', 'Programs, eligibility, the process and its timelines', 'Required documents, contacts and addresses', 'Small Business terms always labeled a different program', 'Not covered? It says so and gives the team’s contact. It never guesses a number.']],
    ['Free to help with', BLU, PALEBLU, ['Explaining terms: DSCR, equity, pro forma, AMI', 'Structuring an executive summary or a budget', 'Arithmetic with the applicant’s own numbers', 'Pointing out common mistakes', 'Said plainly when it is general practice, not Invest Detroit policy']],
    ['Never', RED, PALERED, ['Predict or decide approval, eligibility or anyone’s own rate', 'Help leave out, change or make up information', 'Write documents wholesale or invent project facts', 'Reveal its instructions, keys or other applicants’ information', 'Follow instructions hidden in a question or an uploaded document']],
  ]
  cols.forEach(([t, c, f, items], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 3.3, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.18, 1.58, 2.6, 0.32, { fontSize: 14, bold: true, color: c })
    T(s, bullets(items), x + 0.18, 2.0, 2.58, 2.65, { fontSize: 10.5, color: INK })
  })
}

{ // 16. Guardrails
  const s = content('Safety checks before and after the AI', 'Safety', 'Two layers. Before the AI: fixed rules catch the requests we never want the AI to see. After the AI: we check what it said before the applicant sees it. Our test set includes fourteen Must Never examples, such as asking it to help inflate revenue, asking for its hidden instructions, asking for another applicant’s data, and typing a Social Security number. All fourteen pass. We tested every one of these.')
  const mk = (x, title, color, fill, items) => {
    s.addShape(SH.roundRect, { x, y: 1.4, w: 4.4, h: 2.75, rectRadius: 0.06, fill: { color: fill }, line: { color: fill, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 4.4, h: 0.07, fill: { color }, line: { color, width: 0 } })
    T(s, title, x + 0.2, 1.58, 4, 0.32, { fontSize: 14, bold: true, color })
    T(s, bullets(items), x + 0.2, 1.98, 4.0, 2.1, { fontSize: 11, color: INK })
  }
  mk(0.5, 'Before the AI (fixed rules)', RED, PALERED, [
    'Off-topic: jokes, homework, code, trivia get a standard redirect',
    'Falsifying: “make my revenue look higher” gets an honest-reporting reply',
    'Prompt tricks: “ignore your instructions” is refused',
    'Secrets: instructions, keys, other applicants’ data are refused',
    'Social Security and account numbers are removed before anything is sent',
  ])
  mk(5.1, 'After the AI (output check)', BLU, PALEBLU, [
    'The answer is scanned for leaked instructions and key patterns',
    'Only sources on our list are shown; invented citations are dropped',
    'Cut-off, refused or unreadable answers are never shown',
    'An answer the AI marks off-topic is replaced with the standard reply',
    'Anything that fails falls back to the built-in guide',
  ])
  stat(s, 0.5, 4.3, 2.0, 0.78, '14 of 14', '', null, { bigSize: 22, color: GRN, fill: PALEGRN })
  T(s, 'Must Never test examples pass: approval, cheating, SSNs, prompt tricks, other people’s data, off-topic.', 2.65, 4.3, 6.85, 0.78, { fontSize: 11.5, valign: 'middle' })
}

{ // 17. Privacy
  const s = content('Privacy and data flow', 'Safety', 'This is the slide your web team and legal will want. The rule of thumb: the application stays in FormAssembly, exactly as today. What reaches our server is a chat question (with SSN-like numbers removed) and anonymous counts. We do not store chat text, and the request to the AI is sent with storing turned off. There is a one-page data-flow note for your IT team in the package.')
  card(s, 0.5, 1.4, 4.4, 3.2, 'Never stored by us, never read', null, { color: GRN, fill: PALEGRN, tsize: 14 })
  T(s, bullets(['Applicants’ answers: they go only to FormAssembly', 'Uploaded files: never opened, only name, size and type are checked', 'Chat messages: not stored (the AI request is sent with storing off)', 'Names, notes, IP addresses: not stored. Visitors appear only as a daily one-way hash, for limits', 'The SSN field is never read']), 0.7, 1.85, 4.05, 2.7, { fontSize: 12, color: INK })
  card(s, 5.1, 1.4, 4.4, 3.2, 'What is stored, and where', null, { color: BLU, fill: PALEBLU, tsize: 14 })
  const rows = [['Usage counts', 'Our database: day, category, item, number'], ['Staff summary', 'A hidden FormAssembly field, with the application'], ['Saved draft', 'The applicant’s own device, 7 days, never an SSN or files'], ['Keys', 'Render settings only, never in code']]
  rows.forEach(([a, b], i) => {
    const y = 1.9 + i * 0.68
    T(s, a, 5.3, y, 1.4, 0.6, { fontSize: 12, bold: true })
    T(s, b, 6.75, y, 2.65, 0.6, { fontSize: 11, color: INK })
  })
  footnote(s, 'All build and test data is fictional. No real applicant data was used.')
}

{ // 18. Fit with their stack
  const s = content('Fits the stack you already run', 'Integration', 'Invest Detroit runs WordPress for the site and FormAssembly for the form, so we built around both rather than asking you to change anything. WordPress cannot run our server, which is why the server lives on Render. The add-on is read-only on your form by default and removes itself if anything goes wrong. To switch it off, remove one script tag.')
  T(s, 'Three steps to install', 0.5, 1.4, 4.3, 0.3, { fontSize: 14, bold: true })
  const inst = [['Add a hidden field in FormAssembly', 'It receives the staff summary with each application.'], ['Add one script tag in WordPress', 'Or in the form’s own FormAssembly custom-code area.'], ['Run the server on Render', 'With Invest Detroit’s own AI key.']]
  inst.forEach(([t, d], i) => {
    const y = 1.8 + i * 0.95
    s.addShape(SH.roundRect, { x: 0.5, y, w: 4.3, h: 0.82, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    numDot(s, i + 1, 0.68, y + 0.25, YEL, INK)
    T(s, t, 1.15, y + 0.1, 3.55, 0.3, { fontSize: 12.5, bold: true })
    T(s, d, 1.15, y + 0.4, 3.55, 0.4, { fontSize: 10.5, color: MID })
  })
  T(s, 'How it behaves', 5.1, 1.4, 4.4, 0.3, { fontSize: 14, bold: true })
  const how = [
    ['Reads your real form', 'By FormAssembly field ids and option codes, so translated pages still work.', GRN],
    ['Cannot restyle your site', 'Drawn in isolated containers: its styles and yours cannot affect each other.', BLU],
    ['Fails safe', 'If anything breaks, it removes itself and unlocks Submit. The form keeps working on its own.', RED],
    ['Read-only by default', 'Never reads the SSN field or file contents. Two optional fill helpers are off by default.', ORG],
  ]
  how.forEach(([t, d, c], i) => card(s, 5.1, 1.78 + i * 0.73, 4.4, 0.67, t, d, { color: c, tsize: 11.5, bsize: 9 }))
  footnote(s, 'To switch it off: remove the script tag. Nothing else on the site changes.')
}

{ // 19. Hosting on Render
  const s = content('Hosting on Render', 'Infrastructure', 'We host the server on Render so the chat and the data export have somewhere to run. Everything is configured in the repository (render.yaml) and settings are environment variables, so the keys are never in the code. Render redeploys automatically when the code changes. In production Invest Detroit would use its own Render account and its own AI key, or move it to any host that runs Node.')
  card(s, 0.5, 1.4, 4.3, 3.3, 'How it is set up', null, { color: INK, tsize: 14 })
  T(s, bullets(['One Render Web Service running Node.js 22', 'Auto-deploys from GitHub when the code changes', 'A health check at /healthz', 'Serves our website and the API together', 'Only investdetroit.com may call the API (an allow-list)', 'Free plan sleeps after about 15 idle minutes; Starter (about $7 a month) stays awake']), 0.7, 1.85, 3.95, 2.8, { fontSize: 12, color: INK })
  T(s, 'Settings, not code', 5.1, 1.4, 4.4, 0.3, { fontSize: 14, bold: true })
  const rows = [
    ['OPENAI_API_KEY', 'The AI key'],
    ['OPENAI_BASE_URL / MODEL', 'Which AI service and model'],
    ['ALLOWED_ORIGINS', 'Which websites may call the API'],
    ['DATABASE_URL', 'Where usage counts are kept'],
    ['USAGE_EXPORT_TOKEN, USAGE_WEBHOOK_URL', 'Data export and push'],
    ['ASSISTANT_DAILY_LIMIT, ASSISTANT_VISITOR_DAILY', 'Daily AI limits'],
  ]
  s.addTable(rows.map((r, i) => [{ text: r[0], options: { fontFace: 'Consolas', fontSize: 9.5, bold: true, color: INK, fill: { color: i % 2 ? WHITE : GRAY } } }, { text: r[1], options: { fontSize: 10.5, color: MID, fill: { color: i % 2 ? WHITE : GRAY } } }]), {
    x: 5.1, y: 1.8, w: 4.4, colW: [2.55, 1.85], rowH: 0.48, fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.03, 0.08, 0.03, 0.08],
  })
}

{ // 20. Data pipeline
  const s = content('Connecting Invest Detroit’s database', 'Data pipeline', 'You told us Invest Detroit has its own system and will not use a dashboard from us, so we built four ways to feed the usage data into your database. Pick whichever fits: read our table directly, pull a JSON export on a schedule, receive a signed push, or collect events on your own page. They can be combined. The data is anonymous counts only: a day, a category, an item and a number. The staff summary arrives separately, through FormAssembly’s own integration like any other field.')
  const ways = [
    ['1', 'Read the table', 'A Postgres table, copilot_counts: day, key, count. Use a read-only user.', BLU],
    ['2', 'Pull a JSON export', 'GET /api/usage with a secret token, on your schedule.', GRN],
    ['3', 'Receive a push', 'A signed webhook posts each new count to your system.', ORG],
    ['4', 'Collect on the page', 'The add-on announces each count as a browser event for your analytics.', RED],
  ]
  ways.forEach(([n, t, d, c], i) => {
    const x = 0.5 + i * 2.28
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.15, h: 1.85, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.15, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, n, x + 0.14, 1.6, c)
    T(s, t, x + 0.55, 1.6, 1.5, 0.32, { fontSize: 12.5, bold: true, valign: 'middle' })
    T(s, d, x + 0.15, 2.08, 1.88, 1.1, { fontSize: 10.5, color: MID })
    arrow(s, x + 1.075, 3.25, x + 1.075, 3.62, { color: c })
  })
  s.addShape(SH.roundRect, { x: 0.5, y: 3.65, w: 9, h: 0.55, rectRadius: 0.06, fill: { color: WHITE }, line: { color: RED, width: 1.25, dashType: 'dash' } })
  T(s, 'Invest Detroit’s database and reports', 0.5, 3.65, 9, 0.55, { fontSize: 14, bold: true, color: RED, align: 'center', valign: 'middle' })
  footnote(s, 'Each count is: day · category · item · number, e.g. review_issue · loan_gt_budget · 3. Never an answer, message or name.')
}

{ // 21. Reliability
  const s = content('Built to keep running, and to control cost', 'Infrastructure', 'Everything here answers the question: what happens when something goes wrong. The chat never breaks because the built-in guide is always the fallback. Cost is controlled in three layers: per-minute and per-day limits in our code, and a monthly budget in the AI provider’s dashboard, which is the one cap nobody can bypass.')
  const items = [
    ['Always a fallback', 'If the AI is down or fails, the built-in guide answers. The chat never breaks.', GRN],
    ['Time limits', 'A 30-second timeout and one retry. If a gateway rejects an optional setting, we retry without it.', BLU],
    ['Usage limits', '20 questions a minute per visitor, 60 a day per visitor, 500 a day for the whole site. Past a limit, the guide answers.', ORG],
    ['A spending cap', 'A monthly budget in the AI dashboard is the one limit nobody can get around.', RED],
    ['Failures are counted', 'Wrong key, blocked model or budget exhausted: each is counted by type so it is easy to diagnose.', GRN],
    ['The add-on fails safe', 'If anything breaks on the page, it removes itself and unlocks Submit.', BLU],
  ]
  items.forEach(([t, d, c], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.4 + Math.floor(i / 3) * 1.7
    card(s, x, y, 2.9, 1.55, t, d, { color: c, tsize: 13.5, bsize: 11.5 })
  })
  footnote(s, 'Planned limits are settings, not code: Invest Detroit can raise or lower them.')
}

{ // 22. Testing
  const s = content('How we tested it', 'Quality', 'Be honest here, it builds trust. We wrote the expected answer for each test example before running it. Our first run scored 28 of 30 and found two real problems, which we fixed. We then added fresh examples we had not tuned on and found another gap. Each fix was followed by a new check. The final 46 of 46 is the best case, because the last fix was made with those questions in view, and it was measured on the built-in answers, not yet on the live AI.')
  stat(s, 0.5, 1.4, 1.7, 1.25, '206', 'automated tests', null, { bigSize: 28 })
  stat(s, 2.3, 1.4, 1.7, 1.25, '46', 'test examples', null, { bigSize: 28 })
  stat(s, 4.1, 1.4, 1.7, 1.25, '0', 'accessibility issues', null, { bigSize: 28, color: GRN, fill: PALEGRN })
  stat(s, 5.9, 1.4, 1.7, 1.25, '47', 'add-on checks', null, { bigSize: 28 })
  stat(s, 7.7, 1.4, 1.8, 1.25, '14/14', 'must-never pass', null, { bigSize: 26, color: GRN, fill: PALEGRN })
  T(s, 'Score history of the written test set (expected answers written first)', 0.5, 2.85, 9, 0.28, { fontSize: 12.5, bold: true })
  const hist = [['28/30', 'First run', 'two real misses'], ['30/36', 'New wordings', 'trickier phrasing'], ['36/36', 'After fixes', 'integrity, rates'], ['42/43', '7 fresh examples', 'one new gap'], ['42/46', '3 more written first', 'gap confirmed'], ['46/46', 'After the fix', 'best case']]
  hist.forEach(([n, t, d], i) => {
    const x = 0.5 + i * 1.5, last = i === 5
    s.addShape(SH.roundRect, { x, y: 3.2, w: 1.4, h: 1.15, rectRadius: 0.06, fill: { color: last ? PALEGRN : GRAY }, line: { color: last ? PALEGRN : GRAY, width: 0 } })
    T(s, n, x, 3.25, 1.4, 0.45, { fontFace: HEAD, fontSize: 20, bold: true, color: last ? GRN : INK, align: 'center', valign: 'middle' })
    T(s, t, x + 0.05, 3.72, 1.3, 0.28, { fontSize: 10.5, bold: true, align: 'center' })
    T(s, d, x + 0.05, 3.98, 1.3, 0.3, { fontSize: 9.5, color: MID, align: 'center' })
  })
  footnote(s, '46/46 is the best case: the last fix was made with those questions in view, and it was measured on the built-in answers. A rerun on the live AI is next.')
}

{ // 23. Measured impact
  const s = content('Does it catch what the original form misses?', 'Results', 'This is the measurement for the problem statement. We took ten common mistakes, each taken from the field guide’s list of common errors, and ran the same ten example applications through the original form’s own submit checks and through the copilot. 2 of 10 versus 10 of 10. It is a controlled comparison on examples we chose, not a rate on real applications; how often each mistake happens in real life is not known yet. You can reproduce it by running one command in the repository.')
  const ex = [
    ['Required question left blank', 1, 1], ['Email address mistyped', 1, 1], ['Loan larger than the total budget', 0, 1], ['Budget missing zeros ($1,450)', 0, 1], ['Affordable units do not add up', 0, 1],
    ['Net square feet larger than gross', 0, 1], ['“Yes” to 10% equity, loan is 95%', 0, 1], ['Owner counts do not match', 0, 1], ['Mixed-use with office left blank', 0, 1], ['One-line executive summary', 0, 1],
  ]
  const hdr = { bold: true, color: WHITE, fill: { color: INK }, fontSize: 11 }
  const mark = (v) => ({ text: v ? '✓' : '—', options: { bold: true, align: 'center', fontSize: 12, color: v ? GRN : 'A0A8A4' } })
  s.addTable([[{ text: 'Same example application, one mistake each', options: hdr }, { text: 'Original', options: { ...hdr, align: 'center' } }, { text: 'Copilot', options: { ...hdr, align: 'center' } }],
    ...ex.map(([t, a, b], i) => [{ text: t, options: { fontSize: 10, fill: { color: i % 2 ? WHITE : GRAY } } }, { ...mark(a), options: { ...mark(a).options, fill: { color: i % 2 ? WHITE : GRAY } } }, { ...mark(b), options: { ...mark(b).options, fill: { color: i % 2 ? WHITE : GRAY } } }])], {
    x: 3.6, y: 1.38, w: 5.9, colW: [3.9, 1.0, 1.0], rowH: 0.285, fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.02, 0.08, 0.02, 0.08],
  })
  stat(s, 0.5, 1.4, 2.9, 1.5, '2/10', 'caught by the original', null, { bigSize: 40, color: RED, fill: PALERED })
  stat(s, 0.5, 3.05, 2.9, 1.5, '10/10', 'caught by the copilot', null, { bigSize: 40, color: GRN, fill: PALEGRN })
  T(s, 'Reproduce it with:', 0.5, 4.68, 3.0, 0.2, { fontSize: 9.5, color: MID, italic: true })
  T(s, 'node tools/measure-impact.mjs', 0.5, 4.88, 3.0, 0.22, { fontSize: 9.5, color: INK, fontFace: 'Consolas' })
  T(s, 'A controlled comparison on 10 examples we chose, not a rate on real applications.', 3.6, 4.78, 5.9, 0.32, { fontSize: 10.5, color: MID, italic: true })
}

// =========================================================================================
// 3. LIMITS AND COST
// =========================================================================================

divider('03', 'Limits and cost', 'What it cannot do yet, what it costs, and the risks we manage.', ['Limitations', 'Cost', 'Risks'],
  'Section 3. This is the section that builds the most trust with the audience. Say the limits plainly and do not soften them.')

{ // 25. Limitations
  const s = content('Where it falls short today', 'Limitations', 'Read these plainly. The first one is the most important: today it runs on a class AI key through the University of Michigan’s gateway, which ends with the sprint, so Invest Detroit would need its own key. Second: it has been tested on a copy of your form with sample data, not on your real page with real applicants. Third: our test score was measured on the built-in answers, and the live AI score is the next measurement.')
  const lim = [
    ['Runs on a class AI key', 'Today it uses a student’s “Codex” key through U-M’s gateway, which ends after the sprint. Invest Detroit needs its own AI key.', RED],
    ['Not yet on your real page', 'Tested on a copy of your form with sample data. The final check needs your real page, ideally a staging copy.', RED],
    ['AI quality not yet scored', 'The 46/46 was measured on the built-in answers. Scoring the live AI is the next measurement.', ORG],
    ['Cannot read documents', 'By design, for privacy: it checks a file’s name, size and type only.', BLU],
    ['Facts are copies', 'Rates and steps come from your documents as of now. They must be updated when a flyer changes.', ORG],
    ['Translations need review', 'The five languages were drafted with AI and need a qualified translator.', BLU],
    ['One limit can be dodged', 'The per-visitor daily limit can be bypassed. The site-wide cap and the budget still hold.', ORG],
    ['One form only', 'Built for the Real Estate/C&I form. A changed form needs its field map updated.', BLU],
    ['Free hosting sleeps', 'On Render’s free plan the first visit after idle takes about a minute.', MID],
  ]
  lim.forEach(([t, d, c], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.4 + Math.floor(i / 3) * 1.22
    card(s, x, y, 2.9, 1.12, t, d, { color: c, tsize: 11.5, bsize: 10 })
  })
}

{ // 26. Cost
  const s = content('What it costs to run', 'Cost', 'These are estimates, not measurements. The per-question cost comes from published price lists for the AI model; we could not open the provider’s own pricing page from our build environment, so check real usage in the AI dashboard after a few days. Five hundred questions a month is our assumption, not an Invest Detroit figure, so replace it with theirs. Hosting prices are Render’s published plans.')
  stat(s, 0.5, 1.4, 2.9, 1.7, '$5–$20', 'AI answers', 'about $0.01–$0.04 per question, at 500 questions a month', { bigSize: 32 })
  stat(s, 3.55, 1.4, 2.9, 1.7, '~$7', 'Hosting (Render)', 'the website and server; the free plan sleeps when idle', { bigSize: 32 })
  stat(s, 6.6, 1.4, 2.9, 1.7, '~$6', 'Database (optional)', 'keeps usage counts across restarts', { bigSize: 32 })
  s.addShape(SH.roundRect, { x: 0.5, y: 3.3, w: 9, h: 0.75, rectRadius: 0.06, fill: { color: PALEGRN }, line: { color: PALEGRN, width: 0 } })
  T(s, [{ text: 'Total: about $20–$35 a month ', options: { bold: true, color: GRN, fontSize: 17 } }, { text: '(estimate)', options: { color: MID, fontSize: 12 } }], 0.7, 3.3, 8.6, 0.75, { valign: 'middle' })
  card(s, 0.5, 4.2, 9, 0.9, 'Beyond the bill', 'An owner at Invest Detroit for about an hour a week: review the usage counts, update facts when a flyer changes, rerun the test set before any change. Daily limits and a monthly AI budget cap the worst case.', { color: ORG, fill: PALEYEL, tsize: 12.5, bsize: 10.5, bodyColor: INK })
}

{ // 27. Risks
  const s = content('Risks and how we handle them', 'Risks', 'Present this as a table you would want to see as the buyer. The top risk, the AI stating a wrong fact, is why the knowledge base exists and why every Invest Detroit fact carries its source and a subject-to-change note. The last row matters most to leadership: it is built so that staff, not the AI, decide.')
  const rows = [
    ['Risk', 'What could go wrong', 'What protects against it'],
    ['AI states a wrong fact', 'Quotes a stale or invented rate', 'Invest Detroit facts only from the knowledge base, with the source and “subject to change”; staff review the facts'],
    ['AI is unavailable', 'The chat stops', 'The built-in guide answers; every failure is counted'],
    ['Misuse or a cost spike', 'Someone floods the chat', 'Per-minute and daily limits, and a monthly spending cap'],
    ['Sensitive data in chat', 'An SSN typed into the chat', 'SSN-like numbers removed before sending; nothing stored'],
    ['Your form changes', 'The add-on cannot find a question', 'It skips unknown questions and fails safe; the field map is easy to update'],
    ['Treated as a decision', 'An applicant takes an answer as approval', 'It never predicts approval; it points to your team; staff decide'],
  ]
  const hs = { bold: true, color: WHITE, fill: { color: INK }, fontSize: 11.5 }
  s.addTable(rows.map((r, i) => r.map((t, j) => (i === 0 ? { text: t, options: hs } : { text: t, options: { fontSize: 10.5, bold: j === 0, color: j === 2 ? INK : j === 1 ? MID : INK, fill: { color: i % 2 ? WHITE : GRAY } } }))), {
    x: 0.5, y: 1.4, w: 9, colW: [2.0, 2.4, 4.6], rowH: [0.34, 0.6, 0.5, 0.5, 0.5, 0.55, 0.55], fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.03, 0.09, 0.03, 0.09],
  })
}

// =========================================================================================
// 4. MAKING IT STRONGER
// =========================================================================================

divider('04', 'Making it stronger', 'The path from a strong prototype to something you rely on.', ['Roadmap', 'A 30-day trial', 'What we need'],
  'Section 4. End on the plan and on what it would take, not on a wish list. The 30-day trial is the concrete recommendation.')

{ // 29. Roadmap
  const s = content('Ways to make it stronger', 'Roadmap', 'Three horizons. Before the pilot is the work to make it real: Invest Detroit’s own accounts, your database connection and a staff review of the facts. During the trial we measure. Later are the improvements we would not do before there is evidence: re-checking every submission on the server, smarter retrieval as the knowledge base grows, and reading documents only with consent and a privacy review.')
  const cols = [
    ['Before the pilot', GRN, PALEGRN, ['Invest Detroit’s own AI key and Render account', 'Connect your database through the data pipeline', 'Staff review the knowledge-base facts (rates, fees, steps, contacts)', 'Test on a staging copy of your real form', 'Privacy and security review']],
    ['During the 30 days', BLU, PALEBLU, ['Run on the live Need Support page', 'Score the test set against the live AI', 'Qualified translators review the five languages', 'Compare follow-up emails and fixes before and during', 'Tune the knowledge base from what applicants ask']],
    ['Later', ORG, PALEYEL, ['Re-check every submission on the server, since browser checks can be bypassed', 'Stronger visitor identification for the limits', 'Search-based retrieval as the knowledge base grows', 'Document reading, only with consent and a privacy review', 'Staff hand-off, and other programs (Small Business, C&I)']],
  ]
  cols.forEach(([t, c, f, items], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 3.55, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.18, 1.58, 2.6, 0.32, { fontSize: 14, bold: true, color: c })
    T(s, bullets(items), x + 0.18, 2.0, 2.58, 2.9, { fontSize: 11.5, color: INK })
  })
}

{ // 30. 30-day trial
  const s = content('Recommendation: a 30-day trial', 'Next steps', 'Turn we will try it into a concrete plan. Who: the Real Estate screening staff and every applicant on the Need Support page. How we will know it works: the numbers we cannot measure today, follow-up emails per application and applications needing fixes, compared before and during. What it takes to keep going: Invest Detroit’s own accounts and a named owner. Note that we are recommending a pilot, not asking for a commitment.')
  const cards = [
    ['1', 'Who and what', 'Real Estate screening staff and every applicant on the Need Support page, with the add-on on the live form for 30 days.', YEL],
    ['2', 'How we will know it works', 'Follow-up emails per application, and applications that needed fixes, before vs. during. Plus where applicants stop, the most common findings and ratings, from the usage data.', BLU],
    ['3', 'Before it starts', 'Staff confirm the facts. The web team approves the one-line add-on. The test set is rerun on the live AI (keep 46 of 46).', GRN],
    ['4', 'What it takes to keep it', 'Invest Detroit’s own AI and Render accounts (about $20–$35 a month, estimated) and a named owner, about an hour a week.', ORG],
  ]
  cards.forEach(([n, t, d, c], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.4 + Math.floor(i / 2) * 1.8
    s.addShape(SH.roundRect, { x, y, w: 4.4, h: 1.65, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: y + 0.08, w: 0.06, h: 1.49, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, n, x + 0.2, y + 0.15, c, c === YEL ? INK : WHITE)
    T(s, t, x + 0.65, y + 0.15, 3.6, 0.32, { fontSize: 14, bold: true, valign: 'middle' })
    T(s, d, x + 0.2, y + 0.58, 4.05, 1.0, { fontSize: 12, color: MID })
  })
}

{ // 31. What we need
  const s = content('To run it for real', 'Next steps', 'This is not a list of demands, it is what it would take, and who would own each piece. The data connection is the one we would like to talk through today, because it is the part that depends on your systems.')
  const rows = [
    ['What', 'Who', 'Why'],
    ['An AI account and key, and a Render account', 'IT or finance', 'The pilot runs on a class key that ends after the sprint'],
    ['Approve the add-on: a hidden form field and a script tag', 'Web team', 'The staff summary needs a field; the add-on needs one line'],
    ['Choose how to connect your database (one of four ways)', 'Data team', 'So usage data lands in your own system, not ours'],
    ['Review the knowledge-base facts', 'Lending staff', 'Rates, fees, steps and contacts must match current policy'],
    ['A named owner', 'Leadership', 'Someone to update facts, review usage and rerun the tests'],
    ['Privacy and security review', 'IT and legal', 'The data-flow note answers what leaves your systems'],
  ]
  const hs = { bold: true, color: WHITE, fill: { color: INK }, fontSize: 11.5 }
  s.addTable(rows.map((r, i) => r.map((t, j) => (i === 0 ? { text: t, options: hs } : { text: t, options: { fontSize: 10.5, bold: j === 1, color: j === 2 ? MID : INK, fill: { color: i % 2 ? WHITE : GRAY } } }))), {
    x: 0.5, y: 1.4, w: 9, colW: [3.9, 1.5, 3.6], rowH: [0.34, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.03, 0.09, 0.03, 0.09],
  })
}

{ // 32. Thank you
  const s = dark('Close by repeating the one-line version, then open for questions. The appendix has a slide of questions we expect. A one-page data-flow note, the full test results and the integration guide are in the package we are sending.')
  T(s, 'Thank you', 0.6, 1.5, 8, 1.2, { fontFace: HEAD, fontSize: 56, bold: true, color: WHITE, valign: 'bottom' })
  T(s, 'Questions?', 0.6, 2.8, 8, 0.6, { fontSize: 24, color: YEL, bold: true })
  s.addShape(SH.roundRect, { x: 0.6, y: 3.7, w: 5.4, h: 0.6, rectRadius: 0.1, fill: { color: YEL }, line: { color: YEL, width: 0 } })
  T(s, 'Try it: ' + LIVE, 0.6, 3.7, 5.4, 0.6, { fontSize: 15, bold: true, align: 'center', valign: 'middle' })
  T(s, 'Invest Detroit Team #1  ·  Johnny Lin, Ginny Liu, Shantanu Shah, Samantha Luu', 0.6, 4.7, 8.6, 0.3, { fontSize: 12, color: 'AAB2AE' })
}

{ // 33. Appendix: questions we expect
  const s = content('Questions we expect', 'Appendix', 'Keep this in the back pocket. These are the questions a team at Invest Detroit is most likely to ask, with the short answer.')
  const qa = [
    ['Does the AI make decisions?', 'No. It explains and answers questions. It never predicts approval, eligibility or anyone’s rate, and staff decide everything.'],
    ['Where do applicants’ answers go?', 'To FormAssembly, exactly as today. Our server only sees chat questions (SSNs removed) and anonymous counts.'],
    ['What if the AI is wrong?', 'Invest Detroit facts come only from your documents, with the source shown and “subject to change”. Staff review those facts.'],
    ['Can we turn it off?', 'Yes. Remove the script tag and it is gone. Remove the AI key and the chat still works from the built-in guide.'],
    ['What happens when the class key ends?', 'The chat falls back to the built-in guide until Invest Detroit adds its own key.'],
    ['Do we have to use your database?', 'No. There is no dashboard: usage data goes to your system by export, push, page events or a table you read.'],
  ]
  qa.forEach(([q, a], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.4 + Math.floor(i / 2) * 1.22
    card(s, x, y, 4.4, 1.12, q, a, { color: i % 2 ? BLU : YEL, tsize: 13, bsize: 11.5 })
  })
}

await pres.writeFile({ fileName: OUT })
console.log('Wrote', OUT)
