// Builds the final presentation deck: docs/slides/Invest-Detroit-Copilot-Final-Presentation.pptx
// (opens in Google Slides). Written in plain words for Invest Detroit stakeholders: the need, how it
// is built (the backend, explained simply), limits and cost, and ways to make it stronger. It
// deliberately has NO feature walkthrough: the presenter shows the features in the live demo. The older, screenshot-heavy
// deck (Invest-Detroit-Copilot-Client-Deck.pptx, built by build-client-deck.mjs) is the feature
// reference.
//
// Run (needs two packages that are not part of the app, so install them without saving):
//   npm install --no-save pptxgenjs sharp
//   node tools/build-stakeholder-deck.mjs
//
// Every number comes from the repository: 28 sources, 51 question help entries, 47 topics
// (server/knowledgeContext.js), 17 review rules, 206 automated tests,
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
  const s = dark('Open with one sentence: we built a helper that sits on top of the form Invest Detroit already uses, so applicants get it right the first time and staff get a head start. We will show it live, then explain how it works behind the scenes, what it cannot do yet, and what we suggest as the next step.')
  T(s, 'INVEST DETROIT  ·  REAL ESTATE/C&I IN-TAKE FORM', 0.6, 0.7, 8, 0.3, { fontSize: 12, bold: true, color: YEL, charSpacing: 2 })
  T(s, 'Invest Detroit\nApplication Copilot', 0.6, 1.2, 8.4, 1.9, { fontFace: HEAD, fontSize: 48, bold: true, color: WHITE, valign: 'top' })
  T(s, 'Helping applicants get the form right the first time, and giving staff a head start.', 0.6, 3.2, 6.8, 0.9, { fontSize: 18, color: 'D5DAD7' })
  T(s, 'Invest Detroit Team #1  ·  Johnny Lin, Ginny Liu, Shantanu Shah, Samantha Luu', 0.6, 4.55, 8.6, 0.3, { fontSize: 13, color: YEL, bold: true })
  T(s, 'Ross School of Business  ·  November 17, 2026', 0.6, 4.85, 8, 0.3, { fontSize: 12, color: 'AAB2AE' })
}

{ // 2. Agenda
  const s = content('What we will cover', 'Agenda', 'Quick overview. First the people and the problem, then the live demo, then how it works behind the scenes, then what it cannot do yet and what it costs, and finally our suggested next step.')
  const items = [
    ['1', 'The need', 'Who it is for, and what goes wrong today', YEL],
    ['', 'Live demo', 'A walkthrough of the whole website', GRN],
    ['2', 'How it works', 'What is behind the screen, in plain words', YEL],
    ['3', 'Limits and cost', 'What it cannot do yet, and what it costs', YEL],
    ['4', 'Next steps', 'How to make it stronger, and a 30-day trial', YEL],
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

{ // 3. Stakeholders
  const s = content('Who this is for', 'The need', 'These five groups are our understanding of who is affected. Tell Invest Detroit they are assumptions for them to correct. The applicant and the screening staff are the two people the form touches directly. The other three decide whether it can run at all.')
  const cards = [
    ['Applicants', 'People applying for a Real Estate or C&I loan.', 'Help understanding the form, in plain language.', YEL],
    ['Screening staff', 'The team that reads each new application.', 'Complete, consistent applications.', BLU],
    ['Lending leadership', 'Responsible for the program.', 'Proof it works, and limits on what an AI can say.', GRN],
    ['Website team', 'Runs the Invest Detroit website and the form.', 'An easy setup that cannot break the form.', ORG],
    ['Data team', 'Runs Invest Detroit’s database and reports.', 'Usage numbers in their own system.', RED],
  ]
  const pos = [[0.5, 1.4, 2.9], [3.55, 1.4, 2.9], [6.6, 1.4, 2.9], [0.5, 3.15, 4.425], [5.075, 3.15, 4.425]]
  cards.forEach(([t, who, need, c], i) => {
    const [x, y, w] = pos[i]
    s.addShape(SH.roundRect, { x, y, w, h: 1.58, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: y + 0.08, w: 0.06, h: 1.42, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.2, y + 0.1, w - 0.3, 0.3, { fontSize: 15, bold: true })
    T(s, who, x + 0.2, y + 0.5, w - 0.32, 0.55, { fontSize: 12, color: MID })
    T(s, [{ text: 'Needs: ', options: { bold: true, color: INK } }, { text: need, options: { color: INK } }], x + 0.2, y + 1.08, w - 0.32, 0.47, { fontSize: 12 })
  })
}

{ // 4. What applicants run into
  const s = content('What applicants run into today', 'The need', 'The two pictures show the original form’s behavior, reproduced in our practice copy. Enter a loan bigger than the whole project and it still says Submitted successfully, because the form only checks that boxes are filled in. The intake form is step one of the lending process, so a mistake here follows the application through screening and beyond.')
  await pic(s, 'before-budget-fields.png', { x: 0.5, y: 1.45, w: 4.6, h: 0.9 }, 'Loan of 2,000,000 next to a total budget of 1,450,000')
  T(s, 'A $2,000,000 loan on a $1,450,000 project…', 0.5, 2.4, 4.6, 0.3, { fontSize: 11, italic: true, color: MID })
  await pic(s, 'before-submitted.png', { x: 1.15, y: 2.8, w: 3.3, h: 1.85 }, 'Submitted successfully screen')
  T(s, '…and the original form accepts it.', 0.5, 4.68, 4.6, 0.3, { fontSize: 11, italic: true, color: MID })
  const pts = [
    ['Long and confusing', '48 required answers, and terms like “AMI” with no explanation.', RED],
    ['Mistakes slip through', 'It only checks for empty boxes, not for numbers that do not make sense.', ORG],
    ['Easy to lose your work', 'You cannot save partway through.', BLU],
    ['Staff find problems later', 'And have to email the applicant to fix them.', GRN],
  ]
  pts.forEach(([t, d, c], i) => card(s, 5.35, 1.4 + i * 0.9, 4.15, 0.82, t, d, { color: c, tsize: 13.5, bsize: 11.5 }))
}

{ // 5. Problem statements
  const s = content('The problem we set out to solve', 'The need', 'These are the design brief for everything in the demo and the backend. The number at the bottom is the one we can defend: we tested ten common mistakes on the original form and the original caught only two. We have not yet measured time saved or fewer follow-up emails. That needs a pilot.')
  const hmw = [
    ['Applicants', 'How can we help applicants fill in the form correctly, without knowing lending jargon?', YEL],
    ['Staff', 'How can we give staff applications with the problems already flagged?', BLU],
    ['Invest Detroit', 'How can we add this help to your existing form, safely, without letting an AI make decisions or exposing applicant data?', GRN],
  ]
  hmw.forEach(([who, q, c], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 2.45, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, who.toUpperCase(), x + 0.2, 1.6, 2.5, 0.25, { fontSize: 10.5, bold: true, color: MID, charSpacing: 1 })
    T(s, q, x + 0.2, 1.95, 2.55, 1.8, { fontFace: HEAD, fontSize: 16, bold: true })
  })
  s.addShape(SH.roundRect, { x: 0.5, y: 4.05, w: 9, h: 0.95, rectRadius: 0.06, fill: { color: PALEYEL }, line: { color: PALEYEL, width: 0 } })
  T(s, '2 of 10', 0.7, 4.05, 1.9, 0.95, { fontFace: HEAD, fontSize: 30, bold: true, color: RED, valign: 'middle' })
  T(s, [{ text: 'What we measured: ', options: { bold: true } }, { text: 'we tried 10 common mistakes on the original form. It caught only 2 (an empty box and a mistyped email). Time saved and fewer follow-up emails are not measured yet; that needs a pilot.', options: {} }], 2.5, 4.1, 6.9, 0.85, { fontSize: 12, valign: 'middle' })
}

{ // 6. Our approach
  const s = content('How we approached it', 'The need', 'Each of these five choices is something you can hold us to, and each shows up in how it is built, which is what the next section explains.')
  const ps = [
    ['Help before submitting', 'Catch problems while the applicant can still fix them.', YEL],
    ['Rules for checks, AI for explaining', 'Checks that must always match are fixed rules. The AI only explains and answers questions.', BLU],
    ['Facts only from your documents', 'Rates, steps and contacts come from Invest Detroit’s own material, with the source shown.', GRN],
    ['People decide, not the AI', 'It never predicts approval or anyone’s rate. Staff make every decision.', RED],
    ['Added on top, never replacing', 'It sits on your form. If it fails, the form still works.', ORG],
  ]
  ps.forEach(([t, d, c], i) => {
    const y = 1.4 + i * 0.72
    s.addShape(SH.roundRect, { x: 0.5, y, w: 9, h: 0.62, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x: 0.5, y: y + 0.07, w: 0.06, h: 0.48, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, i + 1, 0.75, y + 0.15, c, c === YEL ? INK : WHITE)
    T(s, t, 1.25, y, 3.6, 0.62, { fontSize: 14, bold: true, valign: 'middle' })
    T(s, d, 4.9, y, 4.5, 0.62, { fontSize: 12, color: MID, valign: 'middle' })
  })
}

{ // 7. Demo
  const s = dark('This slide is a bookmark: switch to the live website now and walk through it as an applicant and as screening staff. When you come back, continue with how it works behind the scenes. If you want to demo at a different point, drag this slide.')
  T(s, 'LIVE DEMO', 0.6, 1.6, 8, 0.4, { fontSize: 14, bold: true, color: YEL, charSpacing: 3 })
  T(s, 'The whole website,\none feature at a time', 0.6, 2.1, 8.4, 1.7, { fontFace: HEAD, fontSize: 44, bold: true, color: WHITE })
  T(s, 'As an applicant, and as screening staff.', 0.6, 3.95, 8, 0.4, { fontSize: 18, color: 'D5DAD7' })
  T(s, LIVE, 0.6, 4.6, 8, 0.35, { fontSize: 15, bold: true, color: YEL })
}

// =========================================================================================
// 2. HOW IT WORKS
// =========================================================================================

{ // 8. Big picture
  const s = content('The big picture', 'How it works', 'Walk left to right. The applicant is on Invest Detroit’s website, filling in your form. A small add-on, added with a single line, puts our features on top of the form. The add-on talks to a small online service that we host. That service decides whether to ask the AI and keeps simple counts. Applications never come to us: Submit still goes to FormAssembly. The dashed box is Invest Detroit’s own database, which you connect.')
  s.addShape(SH.roundRect, { x: 0.5, y: 1.4, w: 2.8, h: 2.15, rectRadius: 0.06, fill: { color: GRAY }, line: { color: LINE, width: 1 } })
  T(s, 'Invest Detroit’s website', 0.65, 1.47, 2.5, 0.25, { fontSize: 11.5, bold: true, color: MID })
  s.addShape(SH.roundRect, { x: 0.7, y: 1.85, w: 2.4, h: 0.68, rectRadius: 0.05, fill: { color: WHITE }, line: { color: LINE, width: 1 } })
  T(s, 'Your form\n(unchanged)', 0.7, 1.85, 2.4, 0.68, { fontSize: 12, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 0.7, y: 2.7, w: 2.4, h: 0.68, rectRadius: 0.05, fill: { color: YEL }, line: { color: YEL, width: 0 } })
  T(s, 'Our add-on\n(one line added)', 0.7, 2.7, 2.4, 0.68, { fontSize: 12, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 3.85, y: 1.4, w: 2.75, h: 2.15, rectRadius: 0.06, fill: { color: INK }, line: { color: INK, width: 0 } })
  T(s, 'Our small online service', 4.0, 1.47, 2.5, 0.25, { fontSize: 12.5, bold: true, color: YEL })
  T(s, 'hosted on Render', 4.0, 1.7, 2.5, 0.22, { fontSize: 10, color: 'AAB2AE' })
  T(s, bullets(['Safety checks', 'Library of Invest Detroit facts', 'Talks to the AI', 'Keeps simple counts'], { color: WHITE }), 4.0, 2.05, 2.5, 1.4, { fontSize: 12, color: WHITE })
  s.addShape(SH.roundRect, { x: 7.15, y: 1.4, w: 2.35, h: 0.95, rectRadius: 0.06, fill: { color: PALEBLU }, line: { color: BLU, width: 1 } })
  T(s, 'The AI\n(OpenAI)', 7.15, 1.4, 2.35, 0.95, { fontSize: 12.5, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 7.15, y: 2.6, w: 2.35, h: 0.95, rectRadius: 0.06, fill: { color: PALEGRN }, line: { color: GRN, width: 1 } })
  T(s, 'Storage for\nsimple usage counts', 7.15, 2.6, 2.35, 0.95, { fontSize: 12, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 0.5, y: 3.85, w: 2.8, h: 0.75, rectRadius: 0.06, fill: { color: WHITE }, line: { color: LINE, width: 1 } })
  T(s, 'Your FormAssembly account\napplications arrive as today', 0.55, 3.85, 2.7, 0.75, { fontSize: 11, bold: true, align: 'center', valign: 'middle' })
  s.addShape(SH.roundRect, { x: 7.15, y: 3.85, w: 2.35, h: 0.75, rectRadius: 0.06, fill: { color: WHITE }, line: { color: RED, width: 1.25, dashType: 'dash' } })
  T(s, 'Your database\n(you connect it)', 7.15, 3.85, 2.35, 0.75, { fontSize: 11, bold: true, align: 'center', valign: 'middle', color: RED })
  arrow(s, 3.1, 3.04, 3.85, 3.04, { color: INK })
  T(s, 'questions,\nratings, counts', 3.05, 2.5, 0.85, 0.4, { fontSize: 8.5, color: MID, align: 'center' })
  arrow(s, 6.6, 1.88, 7.15, 1.88, { color: BLU })
  arrow(s, 6.6, 3.07, 7.15, 3.07, { color: GRN })
  arrow(s, 1.9, 3.55, 1.9, 3.85, { color: INK })
  T(s, 'Submit', 1.98, 3.55, 0.7, 0.3, { fontSize: 9, color: MID, valign: 'middle' })
  arrow(s, 8.325, 3.55, 8.325, 3.85, { color: RED, dash: 'dash' })
  T(s, 'counts flow in', 8.4, 3.55, 1.1, 0.3, { fontSize: 9, color: RED, valign: 'middle' })
  footnote(s, 'Applications go to FormAssembly, never to us. We only see chat questions and simple counts.')
}

{ // 9. AI vs rules
  const s = content('What is AI, and what is not', 'How it works', 'This is worth slowing down for. Most of the product is deliberately not AI. The review has to give the same answer every time, so it is a list of 17 fixed rules and some simple math. The safety checks are fixed rules so nobody can talk their way around them. Only the chat answers use AI, and even those are tied to our library of facts. The AI can never stop an applicant from submitting.')
  const rows = [
    ['Part', 'Done by', 'Why'],
    ['Review My Application', 'Fixed rules (17 checks)', 'Same answer every time, and easy to explain'],
    ['Safety checks', 'Fixed rules', 'Predictable, and cannot be talked out of'],
    ['Chat answers', 'The AI', 'Understands everyday questions in five languages'],
    ['Staff summary', 'A simple program', 'No AI involved'],
    ['File checks', 'Fixed rules', 'We never open applicants’ files'],
  ]
  const hs = { bold: true, color: WHITE, fill: { color: INK }, fontSize: 13 }
  const cell = (t, o = {}) => ({ text: t, options: { fontSize: 12.5, color: INK, ...o } })
  s.addTable(rows.map((r, i) => r.map((t, j) => (i === 0 ? { text: t, options: hs } : cell(t, { bold: j === 0, fill: { color: j === 1 && i === 3 ? PALEBLU : i % 2 ? WHITE : GRAY } })))), {
    x: 0.5, y: 1.45, w: 9, colW: [2.6, 2.7, 3.7], rowH: [0.4, 0.56, 0.56, 0.56, 0.56, 0.56], fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.75 }, valign: 'middle', margin: [0.04, 0.12, 0.04, 0.12],
  })
  footnote(s, 'Only one row is AI, the one that has to understand everyday language.')
}

{ // 10. How a question is answered
  const s = content('How the chat answers a question', 'How it works', 'Trace one question through five steps. The AI is only step three. If a safety check stops the question at step two, the AI is never used, so it costs nothing and cannot be tricked. If anything fails, the built-in help answers instead, so the chat never breaks.')
  const steps = [
    ['Applicant asks', 'Anything that looks like a Social Security number is hidden first.', GRAY, INK],
    ['Safety check', 'Off-topic, cheating or tricks get a standard reply. The AI is not used.', PALERED, RED],
    ['The AI answers', 'We give it the question plus our library of Invest Detroit facts.', PALEBLU, BLU],
    ['Answer is checked', 'No leaked secrets, and only real sources are kept.', GRAY, INK],
    ['Applicant sees it', 'The answer, with its source. If anything fails, built-in help answers.', PALEGRN, GRN],
  ]
  steps.forEach(([t, d, fill, col], i) => {
    const x = 0.5 + i * 1.82
    s.addShape(SH.roundRect, { x, y: 1.5, w: 1.7, h: 2.7, rectRadius: 0.06, fill: { color: fill }, line: { color: fill, width: 0 } })
    numDot(s, i + 1, x + 0.12, 1.65, col)
    T(s, t, x + 0.12, 2.1, 1.5, 0.55, { fontSize: 13.5, bold: true })
    T(s, d, x + 0.12, 2.7, 1.48, 1.45, { fontSize: 11.5, color: i === 0 || i === 3 ? MID : INK })
    if (i < 4) T(s, '›', x + 1.67, 2.5, 0.2, 0.5, { fontSize: 22, bold: true, color: MID, align: 'center', valign: 'middle' })
  })
  footnote(s, 'The AI is surrounded by checks. If it ever fails or is unavailable, the chat keeps working from built-in help.')
}

{ // 11. Knowledge base
  const s = content('Where the AI gets its facts', 'How it works', 'The question you will get is how did you train the AI. The honest answer is that we did not train any AI. We hand it a library of Invest Detroit facts with every question and tell it to use that library for anything specific to Invest Detroit. Your four documents always win if anything disagrees, and a test enforces that. This is why it quotes your rates as published and says they may change.')
  const layers = [
    ['1', 'The four Invest Detroit documents', 'The two program flyers, the lending guide and “Who is Invest Detroit?”: these win every disagreement', GRN, PALEGRN],
    ['2', 'Other Invest Detroit material', 'The form itself, program pages and fact sheets', BLU, PALEBLU],
    ['3', 'Official public sources', 'Income limits, City of Detroit, Michigan business filings, banking and lending guides', MID, GRAY],
  ]
  layers.forEach(([n, t, d, c, f], i) => {
    const y = 1.4 + i * 0.98
    s.addShape(SH.roundRect, { x: 0.5, y, w: 5.35, h: 0.88, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x: 0.5, y: y + 0.08, w: 0.06, h: 0.72, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, n, 0.72, y + 0.28, c)
    T(s, t, 1.2, y + 0.08, 4.5, 0.3, { fontSize: 13.5, bold: true })
    T(s, d, 1.2, y + 0.4, 4.5, 0.45, { fontSize: 11, color: MID })
  })
  T(s, 'Higher layers win. A test checks that outside research never overrides your rates.', 0.5, 4.3, 5.35, 0.3, { fontSize: 10, italic: true, color: MID })
  stat(s, 6.1, 1.4, 3.4, 1.0, '28', 'sources in the library', null, { bigSize: 30 })
  stat(s, 6.1, 2.5, 3.4, 1.0, '51', 'questions with their own help', null, { bigSize: 30 })
  card(s, 6.1, 3.6, 3.4, 1.0, 'We did not train the AI', 'We hand it the facts with every question. Changing a rate means editing a document.', { color: YEL, fill: PALEYEL, tsize: 13, bsize: 10.5, bodyColor: INK })
  footnote(s, 'Because the facts live in documents, not inside the AI, updating them is simple.')
}

{ // 12. What the AI will and won't do
  const s = content('What the AI will and won’t do', 'How it works', 'These rules are built into the AI’s instructions and checked by tests. Invest Detroit specifics come only from the library of facts, with the source named. General help, like explaining a financial term, is allowed because refusing it would make the tool useless. And some things it must never do, however the question is asked. All 14 of our must-never test questions pass.')
  const cols = [
    ['Only from your documents', GRN, PALEGRN, ['Rates, fees and loan sizes, quoted as published and “subject to change”', 'How the process works, and how long it takes', 'Which documents to send, and who to contact', 'Not covered? It says so and points to your team. It never guesses a number.']],
    ['Free to help with', BLU, PALEBLU, ['Explaining terms like DSCR, equity or AMI', 'Helping structure a summary or a budget', 'Simple math with the applicant’s own numbers', 'Pointing out common mistakes']],
    ['Never', RED, PALERED, ['Predict approval, eligibility or anyone’s rate', 'Help leave out, change or make up information', 'Reveal its instructions or other applicants’ information', 'Follow tricks like “ignore your rules”']],
  ]
  cols.forEach(([t, c, f, items], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 3.3, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.18, 1.58, 2.6, 0.32, { fontSize: 14.5, bold: true, color: c })
    T(s, bullets(items), x + 0.18, 2.05, 2.58, 2.6, { fontSize: 12, color: INK })
  })
}

{ // 13. Privacy
  const s = content('Where applicant data goes', 'How it works', 'This is the slide your website team and legal will want. The rule of thumb: the application stays in FormAssembly, exactly as today. What reaches us is a chat question, with anything that looks like an SSN removed, and simple counts. We do not store chat messages. There is a one-page data-flow note for your IT team in the package.')
  card(s, 0.5, 1.4, 4.4, 3.2, 'Never stored by us, never read', null, { color: GRN, fill: PALEGRN, tsize: 14.5 })
  T(s, bullets(['Applicants’ answers: they go only to FormAssembly', 'Uploaded files: we never open them', 'Chat messages: not stored', 'Names, notes and addresses: not stored', 'The Social Security number field: never read']), 0.7, 1.9, 4.05, 2.65, { fontSize: 13, color: INK })
  card(s, 5.1, 1.4, 4.4, 3.2, 'What we do keep', null, { color: BLU, fill: PALEBLU, tsize: 14.5 })
  const rows = [['Simple counts', 'For example, how many people pressed ? on a question'], ['Staff summary', 'Inside the application, in FormAssembly'], ['A saved draft', 'On the applicant’s own device, for 7 days'], ['Passwords and keys', 'In the hosting settings only']]
  rows.forEach(([a, b], i) => {
    const y = 1.92 + i * 0.67
    T(s, a, 5.3, y, 1.45, 0.6, { fontSize: 12.5, bold: true })
    T(s, b, 6.8, y, 2.6, 0.6, { fontSize: 11.5, color: INK })
  })
  footnote(s, 'Everything we built and tested used made-up data. No real applicant data was used.')
}

{ // 14. Plugs into website
  const s = content('How it plugs into your website', 'How it works', 'Invest Detroit runs WordPress for the website and FormAssembly for the form, so we built around both. To switch it off, remove one line. If anything ever goes wrong while it is running, it removes itself and the form keeps working. Our small online service runs on Render, a hosting service, because WordPress cannot run it. The free plan sleeps when nobody is using it and the first visit takes about a minute to wake. The paid plan, about seven dollars a month, stays awake.')
  T(s, 'Three steps to set it up', 0.5, 1.4, 4.3, 0.3, { fontSize: 14.5, bold: true })
  const inst = [['Add a hidden field in FormAssembly', 'It receives the staff summary with each application.'], ['Add one line to the website', 'It switches our add-on on.'], ['Run our service on Render', 'Using Invest Detroit’s own AI account.']]
  inst.forEach(([t, d], i) => {
    const y = 1.8 + i * 0.95
    s.addShape(SH.roundRect, { x: 0.5, y, w: 4.3, h: 0.82, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    numDot(s, i + 1, 0.68, y + 0.25, YEL, INK)
    T(s, t, 1.15, y + 0.1, 3.55, 0.3, { fontSize: 13, bold: true })
    T(s, d, 1.15, y + 0.42, 3.55, 0.35, { fontSize: 11.5, color: MID })
  })
  T(s, 'Built to be safe', 5.1, 1.4, 4.4, 0.3, { fontSize: 14.5, bold: true })
  const how = [
    ['It cannot break your form', 'If anything fails, it removes itself and the form keeps working.', RED],
    ['It cannot change your site’s look', 'It stays in its own box, apart from your site’s design.', BLU],
    ['It only reads, by default', 'It never touches the SSN field or opens files.', GRN],
    ['Easy to switch off', 'Remove one line and it is gone.', ORG],
  ]
  how.forEach(([t, d, c], i) => card(s, 5.1, 1.8 + i * 0.72, 4.4, 0.66, t, d, { color: c, tsize: 12, bsize: 10.5 }))
  footnote(s, 'The free hosting plan sleeps when idle; the paid plan (about $7 a month) stays awake.')
}

{ // 15. Data pipeline
  const s = content('Connecting your database', 'How it works', 'You told us Invest Detroit has its own system and will not use a dashboard from us, so we built four ways to feed the usage numbers into your database. Pick whichever fits. They can be combined. The numbers are simple counts only: a day, a category and a total. The staff summary arrives separately, through FormAssembly like any other field.')
  const ways = [
    ['1', 'Read our table', 'We keep simple daily counts in a table you can read directly.', BLU],
    ['2', 'Pull a file', 'Ask our service for the counts on your schedule, with a secret password.', GRN],
    ['3', 'Get a push', 'We send each new count to your system as it happens.', ORG],
    ['4', 'Collect on your page', 'Our add-on sends events to your own website analytics.', RED],
  ]
  ways.forEach(([n, t, d, c], i) => {
    const x = 0.5 + i * 2.28
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.15, h: 1.95, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.15, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    numDot(s, n, x + 0.14, 1.62, c)
    T(s, t, x + 0.55, 1.62, 1.5, 0.32, { fontSize: 13, bold: true, valign: 'middle' })
    T(s, d, x + 0.15, 2.12, 1.88, 1.2, { fontSize: 11.5, color: MID })
    arrow(s, x + 1.075, 3.35, x + 1.075, 3.7, { color: c })
  })
  s.addShape(SH.roundRect, { x: 0.5, y: 3.72, w: 9, h: 0.55, rectRadius: 0.06, fill: { color: WHITE }, line: { color: RED, width: 1.25, dashType: 'dash' } })
  T(s, 'Invest Detroit’s database and reports', 0.5, 3.72, 9, 0.55, { fontSize: 14.5, bold: true, color: RED, align: 'center', valign: 'middle' })
  footnote(s, 'Each count is a day, a category and a total, such as “pressed ? on Total budget: 12”. Never an answer, message or name.')
}

{ // 16. Testing
  const s = content('How we tested it', 'How it works', 'Be honest here, it builds trust. We wrote the expected answer for each test question before running it. Our first run found two real problems, which we fixed, and later fixes were each checked with new questions. The 46 of 46 is the best case: the last fix was made with those questions in view, and it was measured on the built-in answers, not yet on the live AI. Separately, we tested ten common mistakes on the original form and on our copilot: two caught versus ten caught.')
  stat(s, 0.5, 1.4, 2.15, 1.15, '206', 'automatic checks', null, { bigSize: 28 })
  stat(s, 2.78, 1.4, 2.15, 1.15, '46/46', 'test questions', null, { bigSize: 26, color: GRN, fill: PALEGRN })
  stat(s, 5.06, 1.4, 2.15, 1.15, '14/14', '“must never” tests', null, { bigSize: 26, color: GRN, fill: PALEGRN })
  stat(s, 7.34, 1.4, 2.16, 1.15, '0', 'accessibility problems', null, { bigSize: 28, color: GRN, fill: PALEGRN })
  stat(s, 0.5, 2.72, 2.9, 1.5, '2/10', 'caught by the original form', null, { bigSize: 38, color: RED, fill: PALERED })
  stat(s, 3.55, 2.72, 2.9, 1.5, '10/10', 'caught by our copilot', null, { bigSize: 38, color: GRN, fill: PALEGRN })
  card(s, 6.6, 2.72, 2.9, 1.5, 'The same 10 mistakes', 'We ran 10 common mistakes through both, such as a loan bigger than the project or units that do not add up.', { color: YEL, fill: PALEYEL, tsize: 13, bsize: 11, bodyColor: INK })
  footnote(s, 'Honest note: 46/46 is the best case, because the last fix was made with those questions in view. A test on the live AI is next.')
}

// =========================================================================================
// 3. LIMITS AND COST
// =========================================================================================

{ // 17. Limitations
  const s = content('What it can’t do yet', 'Limits and cost', 'Read these plainly. The first is the most important: today it runs on a class AI account that ends with the sprint, so Invest Detroit would need its own. The second: it has been tested on a copy of your form with made-up data, not on your real page. The third: our test score is from the built-in answers, and the live AI score is the next measurement.')
  const lim = [
    ['Runs on a class AI account', 'It ends after the sprint. Invest Detroit needs its own AI account.', RED],
    ['Not yet on your real page', 'We tested on a copy of your form with made-up data.', RED],
    ['AI answers not yet scored', 'Our 46/46 used the built-in answers. Scoring the live AI is next.', ORG],
    ['Does not read uploaded files', 'On purpose, for privacy. It checks only name and size.', BLU],
    ['Facts must be kept current', 'They are copies of your documents, so update them when a flyer changes.', ORG],
    ['Translations need review', 'The five languages were drafted with AI.', BLU],
  ]
  lim.forEach(([t, d, c], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.4 + Math.floor(i / 3) * 1.65
    card(s, x, y, 2.9, 1.5, t, d, { color: c, tsize: 14, bsize: 12 })
  })
  footnote(s, 'None of these is a surprise to us: each has a next step on the roadmap.')
}

{ // 18. Cost
  const s = content('What it costs to run', 'Limits and cost', 'These are estimates, not measurements. The cost per question comes from published price lists, because we could not open the AI provider’s own pricing page from our build environment, so check real usage after a few days. Five hundred questions a month is our assumption, not an Invest Detroit number, so replace it with yours. Hosting prices are the host’s published plans.')
  stat(s, 0.5, 1.4, 2.9, 1.7, '$5–$20', 'AI answers', 'about 1 to 4 cents a question, at 500 questions a month', { bigSize: 32 })
  stat(s, 3.55, 1.4, 2.9, 1.7, '~$7', 'Hosting', 'keeps the service awake and running', { bigSize: 32 })
  stat(s, 6.6, 1.4, 2.9, 1.7, '~$6', 'Storage for counts', 'optional; keeps usage numbers safe', { bigSize: 32 })
  s.addShape(SH.roundRect, { x: 0.5, y: 3.3, w: 9, h: 0.75, rectRadius: 0.06, fill: { color: PALEGRN }, line: { color: PALEGRN, width: 0 } })
  T(s, [{ text: 'Total: about $20–$35 a month ', options: { bold: true, color: GRN, fontSize: 18 } }, { text: '(estimate)', options: { color: MID, fontSize: 12 } }], 0.7, 3.3, 8.6, 0.75, { valign: 'middle' })
  card(s, 0.5, 4.2, 9, 0.9, 'Beyond the bill', 'Someone at Invest Detroit for about an hour a week: update facts when a flyer changes, check usage, and rerun the tests before any change. Daily limits and a monthly spending cap stop surprises.', { color: ORG, fill: PALEYEL, tsize: 13, bsize: 11, bodyColor: INK })
}

// =========================================================================================
// 4. NEXT STEPS
// =========================================================================================

{ // 19. Roadmap
  const s = content('Ways to make it stronger', 'Next steps', 'Three stages. Before the trial is the work to make it real: Invest Detroit’s own accounts, your database connection and a staff check of the facts. During the trial we measure. Later are improvements we would not do until there is evidence: double-checking every submission on the server, smarter fact search as the library grows, and reading documents only with consent and a privacy review.')
  const cols = [
    ['Before the trial', GRN, PALEGRN, ['Use Invest Detroit’s own AI and hosting accounts', 'Connect your database', 'Staff check the facts', 'Test on a practice copy of your real form']],
    ['During the 30 days', BLU, PALEBLU, ['Run it on the live page', 'Score the live AI', 'Have translators check the languages', 'Compare emails and fixes before and during']],
    ['Later', ORG, PALEYEL, ['Double-check every submission on the server', 'Smarter fact search as the library grows', 'Read documents, with consent and a privacy review', 'Hand off to staff, and add other programs']],
  ]
  cols.forEach(([t, c, f, items], i) => {
    const x = 0.5 + i * 3.05
    s.addShape(SH.roundRect, { x, y: 1.4, w: 2.9, h: 3.55, rectRadius: 0.06, fill: { color: f }, line: { color: f, width: 0 } })
    s.addShape(SH.rect, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } })
    T(s, t, x + 0.18, 1.6, 2.6, 0.32, { fontSize: 15, bold: true, color: c })
    T(s, bullets(items), x + 0.18, 2.1, 2.58, 2.8, { fontSize: 13, color: INK })
  })
}

{ // 20. Trial
  const s = content('Our suggestion: a 30-day trial', 'Next steps', 'Turn we will try it into a concrete plan. Who: the Real Estate screening staff and everyone applying on the Need Support page. How we will know it works: the numbers we cannot measure today, follow-up emails per application and applications needing fixes, compared before and during. What it takes to keep going is on the right. We are suggesting a trial, not asking for a commitment.')
  const cards = [
    ['1', 'Who and what', 'Real Estate screening staff, and everyone applying on the Need Support page, with the add-on on the live form for 30 days.', YEL],
    ['2', 'How we will know it works', 'Follow-up emails per application, and how many applications needed fixes, before vs. during the trial. Plus where people get stuck and how they rate the chat.', BLU],
    ['3', 'What we would need from Invest Detroit', 'Its own AI and hosting accounts, approval of the one-line setup, a way to connect your database, a staff check of the facts, and a named owner.', GRN],
    ['4', 'What it costs to keep', 'About $20–$35 a month (an estimate), and about an hour a week from the owner.', ORG],
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

{ // 21. Thank you
  const s = dark('Close by repeating the one-line version, then open for questions. The next slide is a backup of questions we expect. A one-page data-flow note, the full test results and a step-by-step setup guide are in the package we are sending.')
  T(s, 'Thank you', 0.6, 1.5, 8, 1.2, { fontFace: HEAD, fontSize: 56, bold: true, color: WHITE, valign: 'bottom' })
  T(s, 'Questions?', 0.6, 2.8, 8, 0.6, { fontSize: 24, color: YEL, bold: true })
  s.addShape(SH.roundRect, { x: 0.6, y: 3.7, w: 5.4, h: 0.6, rectRadius: 0.1, fill: { color: YEL }, line: { color: YEL, width: 0 } })
  T(s, 'Try it: ' + LIVE, 0.6, 3.7, 5.4, 0.6, { fontSize: 15, bold: true, align: 'center', valign: 'middle' })
  T(s, 'Invest Detroit Team #1  ·  Johnny Lin, Ginny Liu, Shantanu Shah, Samantha Luu', 0.6, 4.7, 8.6, 0.3, { fontSize: 12, color: 'AAB2AE' })
}

{ // 22. Appendix: questions we expect
  const s = content('Questions we expect', 'Backup', 'Keep this in your back pocket. These are the questions Invest Detroit is most likely to ask, with the short answer.')
  const qa = [
    ['Does the AI make decisions?', 'No. It explains and answers questions. It never predicts approval or anyone’s rate, and staff decide everything.'],
    ['Where do applicants’ answers go?', 'To FormAssembly, exactly as today. We only see chat questions (with SSNs removed) and simple counts.'],
    ['What if the AI is wrong?', 'Invest Detroit facts come only from your documents, shown with their source and “subject to change”. Staff check those facts.'],
    ['Can we turn it off?', 'Yes. Remove one line and it is gone. Without an AI account, the chat still works from built-in help.'],
    ['What happens when the class account ends?', 'The chat uses built-in help until Invest Detroit adds its own AI account.'],
    ['Do we have to use your database?', 'No. We have no dashboard: the numbers go into your own system, in whichever of four ways you choose.'],
  ]
  qa.forEach(([q, a], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.4 + Math.floor(i / 2) * 1.22
    card(s, x, y, 4.4, 1.12, q, a, { color: i % 2 ? BLU : YEL, tsize: 13.5, bsize: 12 })
  })
}

await pres.writeFile({ fileName: OUT })
console.log('Wrote', OUT)
