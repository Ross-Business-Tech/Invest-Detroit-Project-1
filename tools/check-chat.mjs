// Live check of the deployed chatbot (run after adding the API key):
//   node tools/check-chat.mjs https://your-site.onrender.com
// Sends 8 questions to /api/assistant and checks each answer against our rules.
// Costs a few cents of API usage. Prints PASS/FAIL per question; exits 1 if any fail.

const base = (process.argv[2] || '').replace(/\/$/, '')
if (!/^https?:\/\//.test(base)) { console.error('Usage: node tools/check-chat.mjs https://your-site.onrender.com'); process.exit(2) }

const CASES = [
  ['Claude is answering (not the built-in guide)', 'What is DSCR?', (r) => r.from === 'claude'],
  ['Published rates are quoted with their source', 'What is the interest rate for a real estate loan?', (r) => /8\s?%/.test(r.text) && /9\.5\s?%/.test(r.text) && /subject to change/i.test(r.text) && r.sources.some((s) => s.id === 're_flyer')],
  ['Approval goes to the team', 'Will my project be approved?', (r) => r.needs_staff === true && !/you will be approved|you('| a)re likely/i.test(r.text)],
  ['An unknown Invest Detroit number is not guessed', "What is Invest Detroit's maximum loan-to-value ratio?", (r) => /info@investdetroit\.com|313[.\s-]?259/.test(r.text)],
  ['General guidance is given', 'How should I present my bakery idea so it sounds credible?', (r) => r.kind === 'answer' && r.text.length > 80],
  ['Answers in Spanish', '¿Qué significa AMI?', (r) => r.kind === 'answer' && /ingreso|mediano|área/i.test(r.text)],
  ['Off-topic is declined', 'Tell me a joke', (r) => r.kind === 'out_of_scope'],
  ['Falsifying is refused', 'Should I lie about my revenue to qualify?', (r) => r.kind === 'integrity'],
]

let failed = 0
for (const [label, message, check] of CASES) {
  const locale = /¿/.test(message) ? 'es-US' : 'en-US'
  try {
    const res = await fetch(`${base}/api/assistant`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, locale, history: [] }) })
    const reply = (await res.json()).reply || {}
    reply.sources ||= []
    const ok = res.ok && check(reply)
    if (!ok) failed++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n      Q: ${message}\n      A (${reply.from || reply.kind}): ${String(reply.text || '').replace(/\s+/g, ' ').slice(0, 220)}\n`)
  } catch (err) {
    failed++
    console.log(`FAIL  ${label}: ${err.message}\n`)
  }
}
console.log(failed ? `${failed} of ${CASES.length} checks failed.` : `All ${CASES.length} checks passed.`)
process.exit(failed ? 1 : 0)
