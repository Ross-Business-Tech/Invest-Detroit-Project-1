// Builds the client slide deck: docs/slides/Invest-Detroit-Copilot-Client-Deck.pptx
//
// Run (needs two packages that are not part of the app, so install them without saving):
//   npm install --no-save pptxgenjs sharp
//   node tools/build-client-deck.mjs
//
// Screenshots live in docs/slides/deck-images/ (taken with the fictional sample applicant, Jordan Ellis).
// Numbers on the measurement slides come from `node tools/measure-impact.mjs` (2/10 vs 10/10) and
// docs/handoff/test-results.json (42/43). If either changes, update the NUMBERS block below and the README.
import pptxgen from 'pptxgenjs'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMG = path.join(ROOT, 'docs/slides/deck-images')
const OUT = path.join(ROOT, 'docs/slides/Invest-Detroit-Copilot-Client-Deck.pptx')
const LIVE = 'https://invest-detroit-project-1.onrender.com'

// ---- the numbers every slide must agree on (README, handoff note, sheet) ----
const NUMBERS = {
  caughtToday: 2, caughtCopilot: 10, examples: 10,
  testCorrect: 42, testTotal: 43,
  categories: [['Normal', 15, 15], ['Tricky', 14, 13], ['Must Never', 14, 14]],
  cost: '$20–$35', questions: 500,
}

// ---- look ----
const INK = '1F2623', YEL = 'FFB81C', GRN = '1E7A4B', RED = 'B3261E', ORG = 'B26A00', BLU = '3A6EA5'
const GRAY = 'F4F5F4', MID = '5B6560', LINE = 'D9DDDA', WHITE = 'FFFFFF', PALEGRN = 'E3F1E9', PALERED = 'F9E4E2', PALEYEL = 'FFF4D6'
const HEAD = 'Cambria', BODY = 'Calibri'

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625 in
pres.title = 'Invest Detroit Application Copilot: client deck'
pres.author = 'Invest Detroit Team #1'

pres.defineSlideMaster({
  title: 'CONTENT', background: { color: WHITE },
  objects: [
    { text: { text: 'Invest Detroit Application Copilot  ·  Invest Detroit Team #1  ·  November 17, 2026', options: { x: 0.5, y: 5.28, w: 7, h: 0.25, fontFace: BODY, fontSize: 10, color: MID, margin: 0 } } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.62, w: 9, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: INK, margin: 0, valign: 'middle', align: 'left' }, text: '' } },
  ],
  slideNumber: { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 10, color: MID, align: 'right' },
})
pres.defineSlideMaster({ title: 'DARK', background: { color: INK } })

const fits = {}
async function dims(file) { if (!fits[file]) { const m = await sharp(path.join(IMG, file)).metadata(); fits[file] = [m.width, m.height] } return fits[file] }

/** Put a screenshot inside a box without stretching it, with a thin frame and soft shadow. */
async function pic(slide, file, box, alt, { halign = 'center', valign = 'middle', frame = true } = {}) {
  const [w, h] = await dims(file)
  const s = Math.min(box.w / w, box.h / h)
  const pw = w * s, ph = h * s
  const x = halign === 'left' ? box.x : halign === 'right' ? box.x + box.w - pw : box.x + (box.w - pw) / 2
  const y = valign === 'top' ? box.y : valign === 'bottom' ? box.y + box.h - ph : box.y + (box.h - ph) / 2
  if (frame) slide.addShape(pres.ShapeType.rect, { x, y, w: pw, h: ph, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 8, offset: 2, angle: 90 } })
  slide.addImage({ path: path.join(IMG, file), x, y, w: pw, h: ph, altText: alt })
  return { x, y, w: pw, h: ph }
}

const chip = (slide, text, x = 0.5, y = 0.3, w = 2.6, color = YEL, tcolor = INK) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.26, rectRadius: 0.13, fill: { color }, line: { color, width: 0 } })
  slide.addText(text, { x, y, w, h: 0.26, fontFace: BODY, fontSize: 10.5, bold: true, color: tcolor, align: 'center', valign: 'middle', margin: 0, isTextBox: true, charSpacing: 1 })
}

function content(title, tag, notes, tagW, narrow) {
  const s = pres.addSlide({ masterName: 'CONTENT' })
  // On slides with a tall screenshot on the right, the title is a narrower box so the picture can run up the side.
  if (narrow) s.addText(title, { x: 0.5, y: 0.62, w: 5.1, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: INK, margin: 0, valign: 'middle', align: 'left', isTextBox: true })
  else s.addText(title, { placeholder: 'title' })
  if (tag) chip(s, tag.toUpperCase(), 0.5, 0.3, tagW || 0.3 + tag.length * 0.095)
  if (notes) s.addNotes(notes)
  return s
}

function dark(notes) { const s = pres.addSlide({ masterName: 'DARK' }); if (notes) s.addNotes(notes); return s }

/** Labeled paragraph blocks: [{label, text, color}] */
function blocks(slide, items, box, size = 14) {
  const runs = []
  items.forEach((b, i) => {
    runs.push({ text: b.label.toUpperCase(), options: { fontFace: BODY, fontSize: 11, bold: true, color: b.color || MID, breakLine: true, charSpacing: 1, paraSpaceAfter: 2 } })
    runs.push({ text: b.text, options: { fontFace: BODY, fontSize: size, color: INK, breakLine: i < items.length - 1, paraSpaceAfter: 9 } })
  })
  slide.addText(runs, { ...box, valign: 'top', margin: 0, isTextBox: true })
}

const detail = (slide, text, x = 0.5, y = 4.72, w = 9) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.44, rectRadius: 0.06, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
  slide.addText([{ text: 'Detail  ', options: { bold: true, color: INK } }, { text: text, options: { color: MID } }], { x: x + 0.12, y, w: w - 0.24, h: 0.44, fontFace: BODY, fontSize: 12, valign: 'middle', margin: 0, isTextBox: true })
}

/** Standard feature slide: text on the left, screenshot(s) on the right. */
async function feature({ title, tag, what, why, better, det, shots, notes, textW = 4.3, imgBox, tall = false, extra }) {
  const s = content(title, tag, notes, undefined, tall)
  if (tall) { textW = 4.9; imgBox = { x: 5.8, y: 0.3, w: 3.7, h: 4.35 } }
  blocks(s, [
    { label: 'What it does', text: what, color: GRN },
    { label: 'Why we built it', text: why, color: ORG },
    { label: 'Why it beats the original form', text: better, color: BLU },
  ], { x: 0.5, y: 1.4, w: textW, h: 3.25 })
  const box = imgBox || { x: 0.5 + textW + 0.35, y: 1.35, w: 9.5 - (0.5 + textW + 0.35), h: 3.3 }
  if (shots.length === 1) await pic(s, shots[0][0], box, shots[0][1], { valign: 'top', halign: 'right' })
  else {
    const gap = 0.2, w = (box.w - gap * (shots.length - 1)) / shots.length
    for (let i = 0; i < shots.length; i++) await pic(s, shots[i][0], { x: box.x + i * (w + gap), y: box.y, w, h: box.h }, shots[i][1], { valign: 'top' })
  }
  if (det) detail(s, det)
  if (extra) extra(s)
  return s
}

const stat = (slide, x, y, w, h, big, label, sub, color, fill) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill || GRAY }, line: { color: fill || GRAY, width: 0 } })
  slide.addText(big, { x: x + 0.1, y: y + 0.12, w: w - 0.2, h: h * 0.45, fontFace: HEAD, fontSize: 40, bold: true, color, align: 'center', valign: 'middle', margin: 0, isTextBox: true, fit: 'shrink' })
  slide.addText(label, { x: x + 0.12, y: y + h * 0.55, w: w - 0.24, h: 0.32, fontFace: BODY, fontSize: 14, bold: true, color: INK, align: 'center', margin: 0, isTextBox: true })
  if (sub) slide.addText(sub, { x: x + 0.12, y: y + h * 0.55 + 0.32, w: w - 0.24, h: h * 0.45 - 0.36, fontFace: BODY, fontSize: 12, color: MID, align: 'center', valign: 'top', margin: 0, isTextBox: true })
}

const card = (slide, x, y, w, h, head, body, color = INK, fill = GRAY, hs = 15, bs = 13) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 } })
  slide.addText(head, { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: 0.34, fontFace: BODY, fontSize: hs, bold: true, color, margin: 0, isTextBox: true, valign: 'top' })
  slide.addText(body, { x: x + 0.18, y: y + 0.5, w: w - 0.36, h: h - 0.6, fontFace: BODY, fontSize: bs, color: INK, margin: 0, isTextBox: true, valign: 'top' })
}

// =====================================================================================
// 1. Title
{
  const s = dark('Opening: the copilot helps applicants get the Real Estate/C&I intake form right the first time, so Invest Detroit staff spend less time chasing missing or inconsistent answers. Fill in the team name and date on this slide before presenting.')
  s.addText('INVEST DETROIT  ·  REAL ESTATE/C&I IN-TAKE FORM', { x: 0.6, y: 0.7, w: 6, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: YEL, margin: 0, charSpacing: 2, isTextBox: true })
  s.addText('Catch application mistakes before they reach your team', { x: 0.6, y: 1.2, w: 5.6, h: 1.9, fontFace: HEAD, fontSize: 38, bold: true, color: WHITE, margin: 0, valign: 'top', isTextBox: true })
  s.addText('An AI Application Copilot: a guided review, a plain-language assistant and a staff summary, added on top of the form you already use.', { x: 0.6, y: 3.25, w: 5.3, h: 0.9, fontFace: BODY, fontSize: 16, color: 'D6DBD8', margin: 0, valign: 'top', isTextBox: true })
  s.addText('Invest Detroit Team #1  ·  Ross School of Business  ·  November 17, 2026', { x: 0.6, y: 4.75, w: 6.2, h: 0.3, fontFace: BODY, fontSize: 13, color: YEL, margin: 0, isTextBox: true })
  await pic(s, 'chat-rates.jpg', { x: 6.6, y: 0.5, w: 3.0, h: 4.6 }, 'The assistant answering a question about loan rates, quoting Invest Detroit\u2019s published ranges with the source named')
}

// 2. The short version
{
  const s = content('The short version', 'Summary', 'Four numbers to remember. The 2 of 10 and 10 of 10 come from running the same ten example applications through the official form\'s own Submit checks and through the copilot (node tools/measure-impact.mjs). 42 of 43 is our written test set, with expected answers written before each run. The cost is an estimate, not a measurement.')
  stat(s, 0.5, 1.45, 2.1, 2.2, `${NUMBERS.caughtCopilot}/${NUMBERS.examples}`, 'mistakes caught', `by the copilot. Today’s form catches ${NUMBERS.caughtToday} of ${NUMBERS.examples}.`, GRN, PALEGRN)
  stat(s, 2.75, 1.45, 2.1, 2.2, `${NUMBERS.testCorrect}/${NUMBERS.testTotal}`, 'test examples correct', 'All 14 “Must Never” examples pass.', GRN, PALEGRN)
  stat(s, 5.0, 1.45, 2.1, 2.2, '5', 'languages', 'English, Spanish, Arabic (right to left), Bengali, Chinese.', INK, GRAY)
  stat(s, 7.25, 1.45, 2.25, 2.2, `~${NUMBERS.cost.replace('$35', '35')}`, 'per month (estimate)', 'To run it: AI usage plus hosting.', INK, GRAY)
  s.addText([
    { text: 'What it is: ', options: { bold: true } },
    { text: 'a review button, a chat assistant and a staff summary that sit on top of the Real Estate/C&I In-Take Form. The form itself does not change.', options: {} },
  ], { x: 0.5, y: 3.95, w: 9, h: 0.7, fontFace: BODY, fontSize: 16, color: INK, margin: 0, valign: 'top', isTextBox: true })
  detail(s, 'All examples, screenshots and applicants in this deck are fictional (Jordan Ellis). No real applicant data was used.', 0.5, 4.72)
}

// 3. Today
{
  const s = content('Today: mistakes are found too late', 'The problem', 'Same example throughout: a $2,000,000 loan request on a $1,450,000 total budget. The original form\'s own checks only look for blanks and formats, so it accepts this. The screenshots are from our replica of the form with the copilot switched off (see tools/measure-impact.mjs for how the replica’s checks were copied).')
  await pic(s, 'before-budget-fields.png', { x: 0.5, y: 1.45, w: 5.1, h: 0.8 }, 'Original form: total budget $1,450,000 and loan amount $2,000,000, no warning', { valign: 'top', halign: 'left' })
  s.addText('A $2,000,000 loan on a $1,450,000 budget …', { x: 0.5, y: 2.35, w: 5.1, h: 0.3, fontFace: BODY, fontSize: 12, italic: true, color: MID, margin: 0, isTextBox: true })
  await pic(s, 'before-submitted.png', { x: 0.5, y: 2.75, w: 2.8, h: 1.9 }, 'Original form showing Submitted successfully', { valign: 'top', halign: 'left' })
  s.addText('… goes through as “Submitted successfully.”', { x: 3.45, y: 3.3, w: 2.2, h: 0.8, fontFace: BODY, fontSize: 14, bold: true, color: RED, margin: 0, isTextBox: true, valign: 'middle' })
  card(s, 5.95, 1.45, 3.55, 1.0, 'No way to save', 'The form asks for 48 required answers, and leaving the page loses everything.', RED, PALERED, 14, 12.5)
  card(s, 5.95, 2.6, 3.55, 1.0, 'Mismatches go through', 'It checks blanks and formats, so numbers that contradict each other are not caught.', RED, PALERED, 14, 12.5)
  card(s, 5.95, 3.75, 3.55, 0.9, 'Staff find the gaps later', 'Follow-up emails before screening can start.', RED, PALERED, 14, 12.5)
  detail(s, 'Original form: investdetroit.com/need-support. Screenshots show our replica of it with the copilot off.', 0.5, 4.72)
}

// 4. Who it is for
{
  const s = content('Who it’s for', 'Audience', 'Two audiences. Applicants get fewer surprises and can explain unusual answers. Staff get applications with fewer gaps and contradictions, plus a short summary of what the applicant was warned about.')
  card(s, 0.5, 1.45, 4.4, 3.1, 'Applicants', '• Developers and business owners applying for Real Estate or C&I financing\n• First-time and emerging developers who are new to lending terms\n• People more comfortable in Spanish, Arabic, Bengali or Chinese\n• Anyone applying on a phone', GRN, PALEGRN, 18, 15)
  card(s, 5.1, 1.45, 4.4, 3.1, 'Invest Detroit lending staff', '• The team that screens new intake forms\n• Receives applications with fewer gaps and contradictions\n• Sees the applicant’s own note when a flagged answer is actually correct\n• Can see monthly where applicants get stuck', INK, GRAY, 18, 15)
  detail(s, 'Each side gets something different from the same review: applicants a to-do list, staff a head start.', 0.5, 4.72)
}

// 5. What we built (overview)
{
  const s = content('What we built: 12 features at a glance', 'Overview', 'This is the map for the next section: one slide per feature, each with a real screenshot, what it does, why we built it, and why it is better than the original form.')
  const feats = [
    ['1', 'Before You Start', 'Gather the right things first'],
    ['2', 'Progress bar + plain boxes', '48 answers, tick per section'],
    ['3', 'Checks as you type', 'Catches slips right away'],
    ['4', '? help on every question', 'Meaning, example, source'],
    ['5', 'Review My Application', 'Must fix / Double-check / Good to know'],
    ['6', 'Explain why', 'A note instead of an email'],
    ['7', 'AI chat assistant', 'Answers with sources named'],
    ['8', 'Guardrails', 'No approval talk, no cheating, no SSNs'],
    ['9', 'Five languages', 'Including Arabic, right to left'],
    ['10', 'Save and resume', 'Come back later on the same device'],
    ['11', 'Staff summary', 'What staff receive with the application'],
    ['12', 'Insights page', 'Counts only, to improve the form'],
  ]
  feats.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 0.5 + col * 3.05, y = 1.4 + row * 0.8, w = 2.9
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.7, rectRadius: 0.08, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.1, y: y + 0.15, w: 0.4, h: 0.4, fill: { color: YEL }, line: { color: YEL, width: 0 } })
    s.addText(f[0], { x: x + 0.1, y: y + 0.15, w: 0.4, h: 0.4, fontFace: BODY, fontSize: 13, bold: true, color: INK, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
    s.addText([{ text: f[1], options: { bold: true, fontSize: 13, breakLine: true } }, { text: f[2], options: { fontSize: 11, color: MID } }], { x: x + 0.6, y, w: w - 0.68, h: 0.7, fontFace: BODY, color: INK, valign: 'middle', margin: 0, isTextBox: true })
  })
  detail(s, 'Plus a FormAssembly add-on (slide 22) so all of this can run on Invest Detroit’s real form page.', 0.5, 4.72)
}

// 6. How it works
{
  const s = content('How it works, in four steps', 'Flow', 'The review is fixed rules and math, so it gives the same answer every time. Only the chat uses AI. Invest Detroit facts come only from the four documents Invest Detroit shared, with the source named. The add-on installs on the FormAssembly page; the form itself is unchanged.')
  const steps = [['1', 'Prepare', '“Before you start” lists the 3 documents and numbers to gather.'], ['2', 'Fill in', 'Each answer is checked as you leave it. The ? button explains any question.'], ['3', 'Review', 'One button checks everything. Fix it, or explain why it is right.'], ['4', 'Submit', 'Unlocks after a successful review, then shows what happens next.']]
  steps.forEach((st, i) => {
    const x = 0.5 + i * 2.28
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.5, w: 2.1, h: 2.3, rectRadius: 0.08, fill: { color: GRAY }, line: { color: GRAY, width: 0 } })
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.15, y: 1.65, w: 0.5, h: 0.5, fill: { color: INK }, line: { color: INK, width: 0 } })
    s.addText(st[0], { x: x + 0.15, y: 1.65, w: 0.5, h: 0.5, fontFace: BODY, fontSize: 18, bold: true, color: YEL, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
    s.addText(st[1], { x: x + 0.15, y: 2.25, w: 1.8, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: INK, margin: 0, isTextBox: true })
    s.addText(st[2], { x: x + 0.15, y: 2.7, w: 1.8, h: 1.0, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true })
  })
  s.addText([
    { text: 'Fixed rules do the checking. ', options: { bold: true } },
    { text: 'The review gives the same answer every time and never uses AI. ' },
    { text: 'AI only chats. ', options: { bold: true } },
    { text: 'Invest Detroit facts (rates, fees, steps) come only from Invest Detroit’s documents, with the source named.' },
  ], { x: 0.5, y: 4.0, w: 9, h: 0.65, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: 'top', isTextBox: true })
  detail(s, 'It installs as an add-on to your FormAssembly page; the form itself is unchanged.', 0.5, 4.72)
}

// 7. Divider: features
{
  const s = dark('Next: twelve features, one slide each. Every screenshot is the real app with the fictional sample applicant.')
  s.addText('PART 1', { x: 0.6, y: 1.5, w: 4, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: YEL, charSpacing: 3, margin: 0, isTextBox: true })
  s.addText('The features', { x: 0.6, y: 1.9, w: 8, h: 1.0, fontFace: HEAD, fontSize: 48, bold: true, color: WHITE, margin: 0, isTextBox: true })
  s.addText('What each one does, why we built it, and why it beats the original form.', { x: 0.6, y: 3.0, w: 7, h: 0.8, fontFace: BODY, fontSize: 18, color: 'D6DBD8', margin: 0, valign: 'top', isTextBox: true })
}

// ---- features -------------------------------------------------------------------
await feature({
  title: '1. Before You Start', tag: 'Feature 1 of 12',
  what: 'A short checklist above the form: the 3 required documents (project plan, development budget, team list) and the key numbers to have ready.',
  why: 'The original form cannot be saved partway, so surprises mid-form cost people their work.',
  better: 'The original form just starts. Here, applicants gather everything first and know the background questions allow “Prefer not to say.”',
  det: 'Sits under the “How applying works” steps, which mirror Invest Detroit’s own process.',
  shots: [['before-you-start.jpg', 'The Before You Start checklist card']],
  notes: 'Feature 1. Open the page and expand Before you start. It lists the three documents Invest Detroit asks for and the numbers applicants should have ready.',
})

{
  const s = content('2. Progress bar and plain-language boxes', 'Feature 2 of 12', 'Feature 2. The bar counts the 48 required answers and shows each section as a chip that turns green with a tick. Dollar boxes add commas and show the amount in words (About $1.45 million). Small live calculations, like 10% of the budget, appear under the question.')
  blocks(s, [
    { label: 'What it does', text: 'Counts the 48 required answers, ticks each section green, and lets you jump to a section. Dollar boxes add commas and show “About $1.45 million.”', color: GRN },
    { label: 'Why we built it', text: 'A very long form feels endless, and a missing zero is easy to miss.', color: ORG },
    { label: 'Why it beats the original form', text: 'The original has no progress sense and plain number boxes. Here you always know what is left.', color: BLU },
  ], { x: 0.5, y: 1.4, w: 4.1, h: 3.25 })
  await pic(s, 'progress-crop.jpg', { x: 4.85, y: 1.4, w: 4.65, h: 1.6 }, 'Form with a progress bar: 48 of 48 required answers and every section ticked', { valign: 'top', halign: 'right' })
  await pic(s, 'budget-words.jpg', { x: 4.85, y: 3.12, w: 4.65, h: 1.5 }, 'Dollar box showing 1,450,000 and the words About $1.45 million', { valign: 'top', halign: 'right' })
  detail(s, 'The SSN field stays disabled, as on the original form, and is never saved or sent anywhere.')
}

await feature({
  title: '3. Checks as you type', tag: 'Feature 3 of 12',
  what: 'When you leave a box, a plain message appears under it. Here: “Loan is larger than the total budget.” The box turns red.',
  why: 'Catch a slip while you still remember the number, not after you submit.',
  better: 'The original only complains about blanks and formats. It cannot see that two numbers disagree.',
  det: 'Rules cover budgets, loan size, square footage, unit counts, owner counts and more. Fixed math, no AI.',
  shots: [['inline-crop.jpg', 'Red warning under the loan amount: Loan is larger than the total budget']],
  textW: 4.0, imgBox: { x: 4.8, y: 1.4, w: 4.7, h: 1.6 }, extra: (s) => card(s, 4.8, 3.2, 4.7, 1.4, 'Other slips it catches while you type', 'A budget missing zeros ($1,450), net square footage larger than gross, owner counts that don\u2019t match the number of owners.', INK, GRAY, 13, 12.5), notes: 'Feature 3. Show the loan amount typed as 2,000,000 against a 1,450,000 budget: the message appears the moment you leave the box.',
})

await feature({
  title: '4. A ? button on every question', tag: 'Feature 4 of 12',
  what: 'Press the yellow ? next to a question to get what it means, an example with numbers, and common mistakes. A Source link shows where the answer comes from.',
  why: 'Lending terms confuse first-time borrowers, and they should not have to email staff to ask.',
  better: 'The original gives no help text. Applicants guess, or leave the page to look things up.',
  det: 'Works without the AI (from a built-in field guide) and gets richer with it. Every ? press is counted on the insights page.',
  shots: [['help-panel.jpg', 'Help panel for What is your total budget, with an example and a source']],
  textW: 4.6, imgBox: { x: 5.5, y: 1.35, w: 4.0, h: 3.3 }, notes: 'Feature 4. Press the ? beside total budget. The assistant opens with a worked example, common mistakes and the source documents.',
})

// 5. Review (hero feature)
await feature({
  title: '5. Review My Application', tag: 'Feature 5 of 12',
  what: 'One button checks the whole form and sorts findings into three groups: Must fix (blocks Submit), Please double-check, and Good to know. “Go to field” jumps to each one.',
  why: 'This is the core of the project: find contradictions before staff ever see them.',
  better: 'The original has no review. A $2M loan on a $1.45M budget says “Submitted successfully.”',
  det: 'Fixed rules and math, so the same answer every time. It never uses AI and never decides approval.',
  shots: [['review.jpg', 'Review results: 1 Must fix, 2 Please double-check, 2 Good to know']],
  tall: true,
  notes: 'Feature 5, the heart of the product. Red: Must fix before submitting (Submit stays locked). Orange: Please double-check (numbers look unusual but may be right). Blue: Good to know (tips that never block anything).',
})

await feature({
  title: '6. Explain why it\u2019s correct', tag: 'Feature 6 of 12',
  what: 'On a double-check item, the applicant can write one sentence explaining why their answer is right. The note travels with the application.',
  why: 'Rules cannot know every situation. Two of eight units may truly be market-rate.',
  better: 'The original has no place for context, so staff email to ask. Here the answer is already attached.',
  det: 'Notes are the applicant’s own words. Staff verify them against the documents. The review itself never changes because of a note.',
  shots: [['review-note.jpg', 'A note explaining why the affordability unit count is correct']],
  tall: true,
  notes: 'Feature 6. Type one sentence in the note box under a double-check item. A tick appears and the note is sent with the application.',
})

// 7. AI chat
{
  const s = content('7. AI chat assistant', 'Feature 7 of 12', 'Feature 7. The chat is the only place AI is used. Invest Detroit specifics (rates, fees, steps, documents) come only from the four documents Invest Detroit shared, with the source named; published ranges are labeled subject to change. General finance questions (what is AMI, what is DSCR) are answered from general knowledge and labeled as general practice.')
  blocks(s, [
    { label: 'What it does', text: 'Answers questions in plain language. Invest Detroit facts come only from Invest Detroit’s own documents, with the source shown.', color: GRN },
    { label: 'Why we built it', text: 'Applicants have questions at 9 pm that staff cannot answer.', color: ORG },
    { label: 'Why it beats the original form', text: 'The original has no help at all. Here it is instant, on the same page, and does not guess Invest Detroit numbers.', color: BLU },
  ], { x: 0.5, y: 1.4, w: 4.3, h: 3.25 })
  await pic(s, 'chat-rates.jpg', { x: 5.0, y: 1.2, w: 2.2, h: 3.45 }, 'Chat answering a rates question with published ranges and the source named', { valign: 'top' })
  await pic(s, 'chat-ami.jpg', { x: 7.35, y: 1.2, w: 2.2, h: 3.45 }, 'Chat explaining what AMI means', { valign: 'top' })
  detail(s, 'Rates shown are Invest Detroit’s published ranges (8%–9.5%, fees 1%–3%), “subject to change,” never a quote.')
}

// 8. Guardrails
{
  const s = content('8. Guardrails: what it will not do', 'Feature 8 of 12', 'Feature 8. Four example requests the assistant must handle safely. It never predicts approval or a borrower’s rate. It refuses to help misstate information and says so politely. SSN-like numbers are hidden before anything is sent. Off-topic requests and attempts to change its rules are redirected. Also: the SSN form field is disabled, the review never uses AI, and daily caps limit usage.')
  const g = [['guard-approve.jpg', 'Asked about approval', 'Will I get approved? It says only staff decide.'], ['guard-cheat.jpg', 'Asked to cheat', '“Make my revenue look higher” gets a polite refusal.'], ['guard-ssn.jpg', 'Types an SSN', 'The number is hidden and never sent.'], ['guard-offtopic.jpg', 'Off-topic or rule tricks', 'Redirected back to the application.']]
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 2.28
    await pic(s, g[i][0], { x, y: 1.3, w: 2.1, h: 2.45 }, `Assistant response: ${g[i][1]}`, { valign: 'top' })
    s.addText([{ text: g[i][1], options: { bold: true, breakLine: true, fontSize: 13 } }, { text: g[i][2], options: { fontSize: 12, color: MID } }], { x, y: 3.82, w: 2.1, h: 0.85, fontFace: BODY, color: INK, margin: 0, valign: 'top', isTextBox: true })
  }
  detail(s, 'Why: a lender’s assistant must never promise approval, coach misstatements or collect sensitive IDs. All 14 “Must Never” tests pass.')
}

// 9. Languages
{
  const s = content('9. Five languages', 'Feature 9 of 12', 'Feature 9. The page, form, review messages and help are available in English, Spanish, Arabic, Bengali and Chinese. Arabic switches the page to right-to-left. The translations were drafted with AI and need a qualified translator before real use; the page says so to the applicant. Note: chat answers come back in English for now; we have not verified the AI replying in the applicant’s language.')
  const L = [['lang-es.jpg', 'Español'], ['lang-ar.jpg', 'العربية (right to left)'], ['lang-zh.jpg', '中文'], ['lang-bn.jpg', 'বাংলা']]
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2), x = 0.5 + col * 3.2, y = 1.3 + row * 1.6
    await pic(s, L[i][0], { x, y, w: 3.05, h: 1.3 }, `The form in ${L[i][1]}`, { valign: 'top', halign: 'left' })
    s.addText(L[i][1], { x, y: y + 1.33, w: 3.05, h: 0.24, fontFace: BODY, fontSize: 12, bold: true, color: INK, margin: 0, isTextBox: true })
  }
  blocks(s, [
    { label: 'Why we built it', text: 'Invest Detroit serves many Detroit communities, and its own Language Assistance Plan expects it.', color: ORG },
    { label: 'Why it beats the original form', text: 'The original is English-only, with no translation of questions, review or help.', color: BLU },
  ], { x: 7.0, y: 1.35, w: 2.5, h: 3.3 }, 13)
  detail(s, 'Translations were drafted with AI and need review by a qualified translator. The page says so. Chat replies are English for now.')
}

await feature({
  title: '9b. Right-to-left Arabic', tag: 'Feature 9 of 12',
  what: 'In Arabic the whole page flips to right-to-left, including the review. Items, buttons and “My answer is correct” are translated too.',
  why: 'A translation that still reads left to right feels broken to Arabic speakers.',
  better: 'The original offers no language choice, so Arabic speakers would have to translate the form themselves.',
  det: 'The page language and reading direction are set from the picker, and the choice is remembered on that device.',
  shots: [['review-ar.jpg', 'The review results shown in Arabic, laid out right to left']],
  tall: true,
  notes: 'Feature 9, continued. The review in Arabic, laid out right to left. Show the language picker at the top of the page first.',
})

await feature({
  title: '10. Save and resume', tag: 'Feature 10 of 12',
  what: 'Answers are saved on this device as you type. Come back within 7 days and press “Continue where I left off.”',
  why: 'A 48-answer form takes more than one sitting, and the original says partial forms are lost.',
  better: 'The original loses everything if you close the window. Here, nothing typed is lost.',
  det: 'Saved on this device only (not on a server) and never includes the SSN. Files must be attached again. There is a “Don’t save on this device” switch for shared computers.',
  shots: [['save-resume.jpg', 'Banner: You have saved answers, with Continue where I left off and Start over']],
  textW: 4.3, notes: 'Feature 10. Type a few answers, reload the page, and the banner offers to continue. Everything stays in the browser on that device.',
})

await feature({
  title: '11. Submit and what\u2019s next', tag: 'Feature 11 of 12',
  what: 'Submit stays locked until the review passes. After submitting, the applicant sees the four stages with typical times: screening, term sheet, commitment, closing.',
  why: 'Applicants should know what happens after they press Submit and not start construction early.',
  better: 'The original says “Submitted successfully” and nothing more, even on a bad application.',
  det: 'Times come from Invest Detroit’s lending guide: 1–2, 2–6, 5–10 and 4–6 weeks. “What Invest Detroit’s team receives” is on the next slide.',
  shots: [['submitted.jpg', 'After-submit message with the four stages and typical times']],
  tall: true, notes: 'Feature 11. After a successful review the Submit button unlocks. The message explains screening (1 to 2 weeks), term sheet, commitment and closing.',
})

await feature({
  title: '12a. The staff summary', tag: 'Feature 12 of 12',
  what: 'Every application arrives with a short “Application Copilot summary”: whether the review passed, each double-check item, the applicant’s own note, and the tips shown.',
  why: 'Staff should start screening with the questions already listed, not with a blank file.',
  better: 'Today staff see only the raw answers and must find contradictions themselves.',
  det: 'Always in English, never contains an SSN, and goes only into a hidden FormAssembly field with the application.',
  shots: [['staff-summary.jpg', 'Application Copilot summary listing a double-check item and the applicant’s note']],
  textW: 4.4, notes: 'The staff summary. In the real form it goes privately to Invest Detroit’s staff with the application, in English, whatever language the applicant used.',
})

await feature({
  title: '12b. Staff insights page', tag: 'Staff tool',
  what: 'A password-protected /insights page with counts only: forms started vs. submitted, where people stop, the most common review findings, which ? buttons get pressed, chat topics and star ratings.',
  why: 'A common finding or a heavily pressed ? tells you which question to reword on the form itself.',
  better: 'The original gives no visibility into where applicants struggle.',
  det: 'No names, answers, messages or IP addresses are stored. The numbers shown here come from our own test session, not real applicants.',
  shots: [['insights.jpg', 'Insights dashboard with counts only']],
  tall: true, notes: 'The counts on this screenshot come from our own test session (a few forms and reviews), not from real applicants. The page needs the INSIGHTS_PASSWORD setting turned on in Render; it is off on the current service.',
})

await feature({
  title: 'Add-on for FormAssembly', tag: 'How it goes live',
  what: 'One line of script on Invest Detroit’s FormAssembly page adds the review, assistant and staff summary on top of the live form.',
  why: 'Invest Detroit already runs its intake on FormAssembly, so the copilot should fit, not replace it.',
  better: 'No new form, no migration. The form’s own fields and Submit button stay as they are.',
  det: 'Built against the real form’s field IDs (form 4907942). Tested on our test copy of the form; the final check still has to be done on the real page.',
  shots: [['addon-test-page.jpg', 'Test copy of the FormAssembly form with the add-on loaded and the Need help button']],
  textW: 4.2, notes: 'This is our test page, a plain copy of the code behind the real form with the add-on loaded. It proves the add-on works with FormAssembly-style markup. Invest Detroit’s web team approves the one-line add-on before a trial.',
})

// 23. Divider: measurements
{
  const s = dark('Next: how we know it works. Two measurements: the same ten mistakes through the old checks and the copilot, and a written test set of 43 examples.')
  s.addText('PART 2', { x: 0.6, y: 1.5, w: 4, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: YEL, charSpacing: 3, margin: 0, isTextBox: true })
  s.addText('The measurements', { x: 0.6, y: 1.9, w: 8, h: 1.0, fontFace: HEAD, fontSize: 48, bold: true, color: WHITE, margin: 0, isTextBox: true })
  s.addText('Old form vs. copilot, and how the test set scored.', { x: 0.6, y: 3.0, w: 7, h: 0.8, fontFace: BODY, fontSize: 18, color: 'D6DBD8', margin: 0, valign: 'top', isTextBox: true })
}

// 24. Before / after snapshot
{
  const s = content('Before and after: the same application', 'Measurement 1', 'Same example application, same mistake: a $2,000,000 loan request on a $1,450,000 budget. Left, the original form’s checks. Right, the copilot’s review of an application with this and two other flags. Left screenshots are of our replica of the form with the copilot off.')
  s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.3, w: 4.4, h: 3.3, rectRadius: 0.08, fill: { color: PALERED }, line: { color: PALERED, width: 0 } })
  s.addShape(pres.ShapeType.roundRect, { x: 5.1, y: 1.3, w: 4.4, h: 3.3, rectRadius: 0.08, fill: { color: PALEGRN }, line: { color: PALEGRN, width: 0 } })
  s.addText('TODAY: THE ORIGINAL FORM', { x: 0.7, y: 1.38, w: 4, h: 0.28, fontFace: BODY, fontSize: 12, bold: true, color: RED, margin: 0, charSpacing: 1, isTextBox: true })
  s.addText('WITH THE COPILOT', { x: 5.3, y: 1.38, w: 4, h: 0.28, fontFace: BODY, fontSize: 12, bold: true, color: GRN, margin: 0, charSpacing: 1, isTextBox: true })
  await pic(s, 'before-budget-fields.png', { x: 0.7, y: 1.75, w: 4.0, h: 0.55 }, 'Original form with budget 1,450,000 and loan 2,000,000', { valign: 'top' })
  await pic(s, 'before-submitted.png', { x: 1.2, y: 2.45, w: 2.0, h: 1.4 }, 'Original form: Submitted successfully', { valign: 'top', halign: 'left' })
  s.addText('Accepted, no warning', { x: 3.35, y: 2.6, w: 1.5, h: 1.0, fontFace: BODY, fontSize: 16, bold: true, color: RED, margin: 0, isTextBox: true, valign: 'middle' })
  s.addText('Checks blanks and formats only.', { x: 0.7, y: 3.95, w: 4.0, h: 0.5, fontFace: BODY, fontSize: 13, color: INK, margin: 0, isTextBox: true, valign: 'top' })
  await pic(s, 'review.jpg', { x: 5.3, y: 1.75, w: 2.2, h: 2.8 }, 'Copilot review flagging the loan as larger than the budget', { valign: 'top', halign: 'left' })
  s.addText([{ text: 'Stopped before submit', options: { bold: true, color: GRN, fontSize: 16, breakLine: true } }, { text: 'Must fix: loan larger than budget. Plus two double-checks and two tips.', options: { color: INK, fontSize: 13 } }], { x: 7.65, y: 1.75, w: 1.75, h: 2.8, fontFace: BODY, margin: 0, isTextBox: true, valign: 'top' })
  detail(s, `Across ten example mistakes: ${NUMBERS.caughtToday} of ${NUMBERS.examples} caught today, ${NUMBERS.caughtCopilot} of ${NUMBERS.examples} with the copilot (next two slides).`)
}

// 25. Chart 2 vs 10
{
  const s = content(`Mistakes caught: ${NUMBERS.caughtToday} of ${NUMBERS.examples} vs. ${NUMBERS.caughtCopilot} of ${NUMBERS.examples}`, 'Measurement 1', 'Measured by running the same 10 example applications through the official form’s own Submit checks (as copied into our replica) and through the copilot (node tools/measure-impact.mjs). Each example has one mistake taken from our field guide’s common mistakes. We do not know yet how often each happens in real applications, so this shows what each tool can catch, not how many real errors it would remove.')
  s.addChart(pres.charts.BAR, [{ name: 'Mistakes caught (of 10)', labels: ['Original form checks', 'With the copilot'], values: [NUMBERS.caughtToday, NUMBERS.caughtCopilot] }], {
    x: 0.5, y: 1.35, w: 5.0, h: 3.3, barDir: 'col', chartColors: [RED, GRN], showLegend: false, showTitle: false,
    titleFontFace: BODY, titleFontSize: 13, titleColor: INK, showValue: true, dataLabelFontSize: 18, dataLabelFontBold: true, dataLabelColor: INK, dataLabelFontFace: BODY, dataLabelPosition: 'outEnd',
    valAxisMinVal: 0, valAxisMaxVal: 12, valAxisMajorUnit: 4, valAxisLabelColor: MID, valAxisLabelFontSize: 11, valAxisLabelFontFace: BODY, catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: BODY,
    valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: 'none' }, barGapWidthPct: 60,
  })
  card(s, 5.8, 1.35, 3.7, 1.55, 'How we measured', 'Ten example applications, each with one realistic mistake, run through (a) the official form’s own Submit checks and (b) the copilot.', INK, GRAY, 14, 12.5)
  card(s, 5.8, 3.05, 3.7, 1.6, 'What it does not show', 'How often each mistake happens in real applications is not known yet. The trial would measure that.', ORG, PALEYEL, 14, 12.5)
  detail(s, 'Reproduce it: node tools/measure-impact.mjs. Prints TODAY 2/10 and COPILOT 10/10.')
}

// 26. Table of the ten
{
  const s = content('The ten examples, one by one', 'Measurement 1', 'Each row is one example application with one mistake. Required blank and mistyped email are the only two the original form’s checks catch. The copilot catches all ten, because the other eight are about numbers contradicting each other or being unusual, which fixed rules and math can see.')
  const rows = [
    ['Required question left blank (job title)', true], ['Email address mistyped', true], ['Loan request larger than the total budget', false],
    ['Total budget missing zeros ($1,450)', false], ['Affordable-unit counts don’t add up to housing units', false], ['Net square footage entered larger than gross', false],
    ['“Yes” to 10% equity, but the loan is 95% of the budget', false], ['Owner counts don’t match number of owners', false],
    ['Mixed-use project with the office section left blank', false], ['One-line executive summary', false],
  ]
  const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, fontFace: BODY, fontSize: 12, align: t === 'Same example application, one mistake each' ? 'left' : 'center', valign: 'middle' } })
  const data = [[hdr('Same example application, one mistake each'), hdr('Original form'), hdr('Copilot')]]
  rows.forEach(([label, caught], i) => {
    const fill = { color: i % 2 ? GRAY : WHITE }
    data.push([
      { text: `${i + 1}. ${label}`, options: { fontFace: BODY, fontSize: 12, color: INK, fill, valign: 'middle' } },
      { text: caught ? 'Caught' : 'Missed', options: { fontFace: BODY, fontSize: 12, bold: true, color: caught ? GRN : RED, fill, align: 'center', valign: 'middle' } },
      { text: 'Caught', options: { fontFace: BODY, fontSize: 12, bold: true, color: GRN, fill, align: 'center', valign: 'middle' } },
    ])
  })
  s.addTable(data, { x: 0.5, y: 1.35, w: 6.6, colW: [4.4, 1.1, 1.1], rowH: 0.3, border: { type: 'solid', pt: 0.5, color: LINE } })
  stat(s, 7.4, 1.35, 2.1, 1.55, `${NUMBERS.caughtToday}/${NUMBERS.examples}`, 'original form', null, RED, PALERED)
  stat(s, 7.4, 3.1, 2.1, 1.55, `${NUMBERS.caughtCopilot}/${NUMBERS.examples}`, 'copilot', null, GRN, PALEGRN)
}

// 27. Test score
{
  const s = content(`Test results: ${NUMBERS.testCorrect} of ${NUMBERS.testTotal} examples`, 'Measurement 2', 'Our test set has 43 examples with the expected answer written before each run. Normal: common mistakes and questions (15 of 15). Tricky: other languages, vague or unusual wording (13 of 14). Must Never: approval, cheating, SSNs, prompt tricks, off-topic (14 of 14). The one miss is C14: a ZIP-code question gets “tell me more” instead of the city-limits help. We left it on purpose and tell users to use the City’s Parcel Viewer.')
  s.addChart(pres.charts.BAR, [
    { name: 'Examples', labels: NUMBERS.categories.map((c) => c[0]), values: NUMBERS.categories.map((c) => c[1]) },
    { name: 'Correct', labels: NUMBERS.categories.map((c) => c[0]), values: NUMBERS.categories.map((c) => c[2]) },
  ], {
    x: 0.5, y: 1.35, w: 5.2, h: 3.2, barDir: 'col', barGrouping: 'clustered', chartColors: ['B8BFBB', GRN], showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: BODY, legendColor: INK,
    showTitle: true, title: 'Examples vs. correct, by kind', titleFontFace: BODY, titleFontSize: 13, titleColor: INK,
    showValue: true, dataLabelFontSize: 12, dataLabelColor: INK, dataLabelFontFace: BODY, dataLabelPosition: 'outEnd',
    valAxisMinVal: 0, valAxisMaxVal: 18, valAxisMajorUnit: 6, valAxisLabelColor: MID, valAxisLabelFontSize: 11, valAxisLabelFontFace: BODY, catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: BODY,
    valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: 'none' }, barGapWidthPct: 50,
  })
  stat(s, 6.0, 1.35, 3.5, 1.5, `${NUMBERS.testCorrect}/${NUMBERS.testTotal}`, 'examples correct', null, GRN, PALEGRN)
  const t = NUMBERS.categories
  card(s, 6.0, 3.0, 3.5, 1.65, 'By kind', `Normal ${t[0][2]}/${t[0][1]}\nTricky ${t[1][2]}/${t[1][1]}\nMust Never ${t[2][2]}/${t[2][1]}  (approval, cheating, SSNs, prompt tricks, off-topic)`, INK, GRAY, 14, 12.5)
  detail(s, 'Expected answers were written before each run. Chat rows use the built-in guide unless the test is rerun with the AI connected.')
}

// 28. How we got there + the miss
{
  const s = content('How we got there, and the one miss', 'Measurement 2', 'History from our build notes: first run 28 of 30. After adding new wordings, 30 of 36 before the fix. 36 of 36 after fixing the integrity refusal, Small Business rates and “qualifies” wording. Then 7 fresh examples we had not tuned on brought the set to 43, with 42 correct. The one known miss is C14.')
  const steps = [['28/30', 'First run', 'Missed “make my revenue look higher” and gave Real Estate rates to a Small Business question.'], ['30/36', 'New wordings', 'Added trickier phrasing; some failed before the fix.'], ['36/36', 'After fixes', 'Integrity refusal, Small Business rates and “qualifies” wording fixed.'], [`${NUMBERS.testCorrect}/${NUMBERS.testTotal}`, '7 fresh examples', 'Not used for tuning. One miss, C14.']]
  steps.forEach((st, i) => {
    const x = 0.5 + i * 2.28
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.35, w: 2.1, h: 2.0, rectRadius: 0.08, fill: { color: i === 3 ? PALEGRN : GRAY }, line: { color: i === 3 ? PALEGRN : GRAY, width: 0 } })
    s.addText(st[0], { x: x + 0.12, y: 1.42, w: 1.86, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: i === 3 ? GRN : INK, margin: 0, isTextBox: true })
    s.addText(st[1], { x: x + 0.12, y: 2.0, w: 1.86, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: INK, margin: 0, isTextBox: true })
    s.addText(st[2], { x: x + 0.12, y: 2.33, w: 1.86, h: 1.0, fontFace: BODY, fontSize: 12, color: MID, margin: 0, valign: 'top', isTextBox: true })
  })
  card(s, 0.5, 3.5, 9.0, 1.1, 'The one known miss (C14)', '“My ZIP is 48212, does that mean I’m in Detroit?” gets “tell me more” instead of the city-limits help. We left it on purpose; users are pointed to the City’s Parcel Viewer.', ORG, PALEYEL, 14, 12.5)
  detail(s, 'Rerun any time: node tools/run-test-set.mjs (steps are in the results sheet, “How to rerun” tab).')
}

// 29. Cost
{
  const s = content(`What it costs: about ${NUMBERS.cost} a month`, 'Running it', `Estimate, not a measurement. About $0.01 to $0.04 per chat question; at an assumed ${NUMBERS.questions} questions a month that is about $5 to $20. Hosting on Render is about $7 a month, plus about $6 for the optional database that keeps the insights counts. Total about $20 to $35. Prices come from third-party lists; the question volume is our assumption. Daily caps and an OpenAI budget limit cap the worst case.`)
  stat(s, 0.5, 1.4, 2.8, 2.0, '$5–$20', 'AI chat', `about $0.01–$0.04 per question, at ${NUMBERS.questions} questions a month`, INK, GRAY)
  stat(s, 3.6, 1.4, 2.8, 2.0, '~$7', 'Hosting (Render)', 'the website and server', INK, GRAY)
  stat(s, 6.7, 1.4, 2.8, 2.0, '~$6', 'Database (optional)', 'keeps the insights counts', INK, GRAY)
  card(s, 0.5, 3.55, 9.0, 1.05, `Total: about ${NUMBERS.cost} a month (estimate)`, 'The question volume is our assumption. Daily caps and an OpenAI budget limit cap the worst case. Invest Detroit would use its own OpenAI and Render accounts.', GRN, PALEGRN, 14, 13)
  detail(s, 'The pilot ran on a student’s University of Michigan GPT Toolkit key and Business+Tech accounts, which end with the sprint.')
}

// 30. Privacy
{
  const s = content('Privacy: what is and isn’t stored', 'Data', 'Data handling in one slide. No chat text is stored. SSNs are blocked from the chat and the SSN form field is disabled. Insights are counts only. The staff summary goes only into a hidden FormAssembly field. The AI key lives only in the hosting settings, never in code. Everything was built and tested with made-up sample applicants.')
  card(s, 0.5, 1.4, 4.4, 3.2, 'Not stored or sent', '• Chat messages are not stored\n• SSNs are hidden from the chat and the SSN field is disabled\n• No names, answers, notes or IP addresses on the insights page\n• Form answers are not sent to our server', GRN, PALEGRN, 16, 14)
  card(s, 5.1, 1.4, 4.4, 3.2, 'Stored, and where', '• Saved answers: on the applicant’s own device for 7 days, never an SSN\n• Staff summary: only in a hidden field in FormAssembly\n• Insights: anonymous counts (optional database)\n• AI key: only in the hosting settings, never in code', INK, GRAY, 16, 14)
  detail(s, 'A one-page data-flow note for Invest Detroit’s IT team is in the handoff package.')
}

// 31. Limits
{
  const s = content('What it can’t do (yet)', 'Limits', 'Honest limits. It never decides approval. The one test miss is the ZIP-code question. Without the AI it matches known phrases only; the first run missed two wordings (now fixed). Translations were drafted with AI. Rates are copies of Invest Detroit’s flyers and need updating when a flyer changes. Tested on sample data only.')
  const L = [
    ['Decide approval or eligibility', 'It never predicts approval, eligibility or a borrower’s rate. Staff decide.'],
    ['Confirm Detroit city limits', 'Our one test miss: a ZIP-code question. Use the City’s Parcel Viewer.'],
    ['Understand every wording', 'Without the AI it matches known phrases. The first run missed two wordings (now fixed).'],
    ['Read uploaded documents', 'Files are checked by name and size only, by design, for privacy.'],
    ['Replace a translator', 'Translations were drafted with AI and need review by a qualified translator.'],
    ['Stay current on its own', 'Rates are copies of your flyers; update them when a flyer changes. Tested on sample data only.'],
  ]
  L.forEach((l, i) => card(s, 0.5 + (i % 3) * 3.05, 1.4 + Math.floor(i / 3) * 1.65, 2.9, 1.5, l[0], l[1], RED, PALERED, 14, 12))
  detail(s, 'It explains, checks and points to sources. It never decides anything.')
}

// 32. Recommendation
{
  const s = content('Recommendation: a 30-day trial', 'Next', 'Our recommendation. Run it for 30 days with Real Estate screening staff and every applicant on the Need Support page, with the add-on on the live form. Measure follow-up emails per application and applications needing fixes, before vs. during the trial, plus star ratings on /insights. Before it starts: staff confirm the facts, Invest Detroit’s web team approves the one-line add-on, and the test set is rerun with the AI.')
  card(s, 0.5, 1.4, 4.4, 1.6, '1. Who and what', 'Real Estate screening staff and every applicant on the Need Support page, for 30 days, with the add-on on the live form.', INK, GRAY, 15, 13)
  card(s, 5.1, 1.4, 4.4, 1.6, '2. How we’ll know it works', 'Follow-up emails per application and applications needing fixes, before vs. during the trial; star ratings on /insights.', INK, GRAY, 15, 13)
  card(s, 0.5, 3.1, 4.4, 1.55, '3. Before it starts', 'Staff confirm the facts; your web team approves the one-line add-on; the test set is rerun with the AI (keep 42/43 or better).', INK, GRAY, 15, 13)
  card(s, 5.1, 3.1, 4.4, 1.55, '4. What it takes to keep', `Your own OpenAI and Render accounts (about ${NUMBERS.cost} a month, estimated) and a named owner, about 1 hour a week.`, INK, GRAY, 15, 13)
}

// 33. Next steps and owners
{
  const s = content('Next steps and owners', 'Next', 'Fill in the owner and dates with the client before presenting. The ranked next steps match the README: install the add-on for a 30-day trial, have staff confirm the knowledge-base facts, connect the OpenAI key and rerun the test set.')
  const h = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, fontFace: BODY, fontSize: 13, valign: 'middle' } })
  const c = (t, o = {}) => ({ text: t, options: { fontFace: BODY, fontSize: 13, color: INK, valign: 'middle', ...o } })
  const ph = (t) => c(t, { color: ORG, bold: true })
  s.addTable([
    [h('#'), h('Step'), h('Owner'), h('When')],
    [c('1'), c('Staff confirm the knowledge-base facts (rates, fees, steps)'), ph('[Invest Detroit contact]'), ph('[Date]')],
    [c('2'), c('Web team approves the one-line add-on on the live form'), ph('[Invest Detroit web team]'), ph('[Date]')],
    [c('3'), c('Connect Invest Detroit’s OpenAI key; rerun the test set (keep 42/43 or better)'), ph('[NAMED OWNER AT INVEST DETROIT]'), ph('[Date]')],
    [c('4'), c('Start the 30-day trial'), ph('[NAMED OWNER AT INVEST DETROIT]'), ph('[Date]')],
    [c('5'), c('Review /insights monthly; rerun the test set before any change'), ph('[NAMED OWNER AT INVEST DETROIT]'), c('Monthly')],
  ], { x: 0.5, y: 1.4, w: 9.0, colW: [0.4, 4.4, 2.8, 1.4], rowH: 0.5, border: { type: 'solid', pt: 0.5, color: LINE }, fill: { color: WHITE } })
  detail(s, 'Orange text in [brackets] is a placeholder to fill in before presenting.')
}

// 34. Thank you
{
  const s = dark('Open the live link on a phone before presenting to wake it up: the free hosting plan sleeps when unused, so the first load can take about 30 seconds.')
  s.addText('Thank you', { x: 0.6, y: 1.2, w: 8, h: 1.1, fontFace: HEAD, fontSize: 54, bold: true, color: WHITE, margin: 0, isTextBox: true })
  s.addText('Questions?', { x: 0.6, y: 2.3, w: 8, h: 0.7, fontFace: BODY, fontSize: 26, color: YEL, margin: 0, isTextBox: true })
  s.addText([{ text: 'Try it: ', options: { color: 'D6DBD8' } }, { text: 'invest-detroit-project-1.onrender.com', options: { color: WHITE, bold: true, hyperlink: { url: LIVE, tooltip: 'Open the live copilot' } } }], { x: 0.6, y: 3.4, w: 8, h: 0.4, fontFace: BODY, fontSize: 18, margin: 0, isTextBox: true })
  s.addText('Invest Detroit Team #1: Johnny Lin, Ginny Liu, Shantanu Shah, Samantha Luu  ·  November 17, 2026', { x: 0.6, y: 4.7, w: 8.5, h: 0.3, fontFace: BODY, fontSize: 12, color: 'AAB2AE', margin: 0, isTextBox: true })
}

await pres.writeFile({ fileName: OUT })
// Remove empty folder entries from the zip (cloud viewers such as Google Slides can trip on them).
try { (await import('node:child_process')).execFileSync('zip', ['-dq', OUT, '*/'], { stdio: 'ignore' }) } catch { /* no folder entries, or zip not installed: fine */ }
console.log('Wrote', OUT)
