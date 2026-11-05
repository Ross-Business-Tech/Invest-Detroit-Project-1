# Architecture and Integration Guide

How the AI Application Copilot is put together, and what it would take to attach it to Invest Detroit's real website and loan intake. Written for whoever does that work: Invest Detroit's web or IT team, or a future student team.

## The idea in one paragraph

The copilot is a **core** (`src/copilot/`) with no screen code, plus small **screens** (`src/components/`) that display it, plus an **adapter** that connects it to a specific form. The prototype uses our own copy of the form. Invest Detroit's site would use the FormAssembly adapter, which reads the live form by its real field IDs. Moving from the prototype to the real site means swapping the adapter and the assistant transport, not rewriting the rules or the chat.

```
            ┌──────────────── src/copilot (no UI, no page layout) ────────────────┐
            │ formDefinition.js   field dictionary: ids, labels, required/conditional │
            │ review.js           rule-based checks  ─▶ ReviewIssue[]                 │
            │ reviewSession.js    idle → running → done → stale; Submit lock          │
            │ assistant.js        builds minimal request, redacts, calls a transport   │
            │ privacy.js          SSN / account-number redaction                       │
            │ events.js           privacy-safe usage events (counts only)              │
            │ config.js           program, form version, official sources, AI mode    │
            └──────────────▲───────────────────────────────▲──────────────────────────┘
                           │ answers keyed by field id      │ request / reply
         ┌─────────────────┴──────────┐          ┌─────────┴────────────────────────┐
         │ Form adapter               │          │ Assistant transport              │
         │  prototype: React state    │          │  placeholder (today)             │
         │  live site: FormAssembly   │          │  http → here.now proxy or an     │
         │  (adapters/…Adapter.js)    │          │  Invest Detroit backend           │
         └────────────────────────────┘          └──────────────────────────────────┘
                           │
         ┌─────────────────┴──────────────────────────────────────────┐
         │ src/components: ReviewPanel, ChatAssistant (display only)  │
         └────────────────────────────────────────────────────────────┘
```

## What the review found, and what changed

| Problem in the first prototype | Why it mattered for integration | Now |
|---|---|---|
| No link between our questions and the live form | Nothing could read the real FormAssembly form | `adapters/formAssemblyMap.js` maps every field to its live `tfa_…` id, and a test fails if one is missing |
| Review timer, Submit lock and error highlighting written inside the React form | Couldn't run beside someone else's form | `reviewSession.js` is a plain state machine any page can drive |
| Review results shaped for our screen (section titles, step numbers) | Couldn't be logged, tested or reused | Results follow the brief's "structured review result" contract (below) |
| `blocking` implied by display level | The brief requires blocking to come only from approved rules | Every issue carries an explicit `blocking` flag set by the rule. AI checks must set `false` |
| Chat found the current question by reading our page's layout | Breaks on any other page | The adapter reports the active field id, and the chat looks up its metadata |
| SSN check written inside the chat window | Easy to bypass, and analytics and AI calls weren't covered | `privacy.js` redacts everything before display, history and network calls |
| No defined way to call an AI service | No contract for a backend to implement | `assistant.js` defines the request and reply, and `transport` is swappable |
| No tests | Unsafe to change rules or follow form edits | 27 automated tests (`npm test`) |

## Folder map

```
src/
  copilot/                    core: no React, no DOM except the adapter
    config.js                 program, form version, official sources, assistant mode
    i18n/                     Spanish, Arabic and Bengali dictionaries keyed by the English text
    text.js                   fills {placeholders} in message templates
    formDefinition.js         field dictionary + visibility + format validation
    review.js                 rule-based checks (RULES list) → ReviewIssue[]
    reviewSession.js          review state machine (run / invalidate / reset)
    assistant.js              assistant client + transports
    guardrails/               decides allow / reject / clarify / integrity before any answer
      index.js                decision order, follow-up context, optional classifier hook
      lexicon.js              tunable word lists and patterns
      messages.js             fixed replies (exact out-of-scope wording)
      documents.js            screens uploaded-document text; wraps it as untrusted data
      normalize.js            undoes l33t, s p a c i n g, odd Unicode before checks
    feedback.js               chat rating: record shape, when to ask, save client
    fieldGuide.js             draft field guide (help for ~40 questions + general topics)
    guideTransport.js         built-in answers from the field guide (no AI, no network)
    privacy.js                redaction
    events.js                 analytics hook
    adapters/
      formAssemblyMap.js      our field id → live FormAssembly element id and option codes
      formAssemblyAdapter.js  reads/watches/focuses the live form, locks its Submit
  embed/                      the add-on script for the live page (→ dist/embed/copilot.js)
    main.jsx                  finds the form, mounts screens in shadow roots, fail-safe
    EmbeddedApps.jsx
  components/                 reusable screens (React)
    copilot.css               styles for the review panel and chat (shared with the add-on)
    LanguagePicker.jsx, I18nProvider.jsx, i18nContext.js, RichText.jsx   language support
    ReviewPanel.jsx           progress bar, result, grouped issues
    ChatAssistant.jsx         "Need help?" button and chat window
    useReviewSession.js       React wrapper for reviewSession
    Field.jsx, SuccessDialog.jsx
  prototype/                  only exists because we don't have the real form
    IntakeForm.jsx            our copy of the form
    sampleApplicant.js        fictional demo data
    goToField.js
  App.jsx                     the replica page
server/                       reference backend (Node built-ins only; NOT deployed on here.now)
  assistantHandler.js         validate -> redact -> guardrails -> answer -> output check
  httpServer.js               POST /api/assistant wrapper: JSON only, origin allowlist, rate limit
  systemPrompt.js             fixed instructions for a future model, with a leak canary
public/.herenow/data.json     here.now Site Data collection for chat ratings
tests/                        node --test, no extra packages
tools/build-embed-test-page.mjs  generates public/embed-test/index.html
```

## Data contracts

### Snapshot (form adapter → core)
A plain object of answers keyed by **our** field ids: strings for text, `"Yes"`/option text for radios and selects, arrays for multi-selects, a file name for uploads, `true`/`false` for acknowledgements. Field ids are stable even if the live form's `tfa_` ids change.

### ReviewIssue (core → screens, logs, a backend)

```json
{
  "id": "loan_gt_budget",
  "field_id": "loan_amount",
  "check": "consistency",
  "level": "blocker",
  "category": "cross_field_inconsistency",
  "title": "Loan is larger than the total budget",
  "message": "You asked for $900,000, but your total budget is $600,000…",
  "inline_message": "Loan is larger than the total budget.",
  "suggested_action": "fix",
  "source_ids": ["intake_form_v59"],
  "blocking": true,
  "requires_staff": false
}
```

`level` is `blocker`, `warning` or `info`. `category` is one of `missing_required`, `invalid_format`, `missing_document`, `missing_acknowledgement`, `cross_field_inconsistency`, `possible_misunderstanding`, `incomplete_section`, `program_guidance` or `optional_unanswered`. To add a check, write a function and add it to `RULES` in `review.js`.

### Assistant request (browser → assistant endpoint)

```json
{
  "program": "real_estate_ci",
  "form_id": "need_support_intake",
  "form_version": "formassembly-4907942-v59",
  "locale": "en-US",
  "field": { "field_id": "total_budget", "field_label": "What is your total budget?", "section": "Business Information Continued", "required": true, "conditional": false, "type": "money", "help_text": null, "options": null },
  "message": "Does this include the land?",
  "history": [{ "role": "user", "text": "…" }]
}
```

**Never included:** any other answer on the form, or names or contact details. SSNs and account numbers are masked, and a message containing one isn't sent at all. History is capped at `ASSISTANT.history_window` messages.

### Assistant reply (endpoint → browser)

```json
{ "text": "Total budget means…", "source_ids": ["intake_form_v59"], "needs_staff": false }
```

`source_ids` must be keys of `SOURCES` in `config.js`. Unknown ids are dropped, so the model can't invent links. Replies are shown as plain text, never as HTML.

### Usage events (`events.js`)
`review_started`, `review_completed` (counts by level and category, plus `can_submit`), `assistant_question` (field id only), `assistant_privacy_block`, `assistant_error`. No answers or messages. Nothing is sent until a sink is registered with `onTrack()`.

## Integration paths

### 1. Attach the copilot to the live "Need Support?" page
The live page is WordPress with the intake form embedded from FormAssembly (form `4907942`). **The add-on script is built:** `npm run build` produces `dist/embed/copilot.js` from `src/embed/main.jsx`.

```html
<script src="https://<where-it-is-hosted>/embed/copilot.js" defer data-launcher-bottom="84px"></script>
```

When it loads, it:
- waits up to 15 seconds for the form to appear;
- puts the Review My Application panel just above `#submit_button` and the chat button in the corner;
- locks Submit until a review passes, both by disabling the button and with a backup check on the submit itself.

Its screens live in **shadow roots**, so the page's styles and ours can't affect each other. If it hits any error, it **removes itself and unlocks Submit**, so the official form keeps working.

Optional settings on the `<script>` tag:

| Attribute | What it does |
|---|---|
| `data-launcher-bottom` | Lifts the chat button, e.g. above the form's spam-check badge, which sits in the bottom-right corner |
| `data-assistant-endpoint` | Connects a real AI service (see 2) |
| `data-auto-mount="false"` | Don't start automatically. Call `InvestDetroitCopilot.mount()` instead |
| `data-wait-ms` | How long to wait for the form |

**Translated pages:** the live site offers Spanish, Arabic and Bengali. The adapter reads choices by their hidden option codes (`tfa_373`), not their visible text, so reviews still work on a translated page.

**Test page:** `/embed-test/` (generated by `node tools/build-embed-test-page.mjs`) is a plain copy of the live form's structure with the add-on loaded. It acts out three real-world conditions: the form arriving after the page, the form's own submit handler, and a "Simulate Spanish translation" button. Checked there at phone and desktop sizes:
- review on an empty and a complete form;
- the Submit lock, including forcing the button on;
- Go to field and the chat's "Asking about" line;
- reading answers on the translated page, and never reading the SSN field;
- the chat button staying clear of the badge;
- the fail-safe after a simulated crash.

The test page is generated from our own field map, so the **final check must happen on the real page**.

**Still needs Invest Detroit:**
- someone to add the script tag, either in WordPress or in the form's own FormAssembly custom-code area (the live form has one: `#code-4907942`);
- somewhere to host the file;
- privacy and security sign-off.

**Keep the map current.** If Invest Detroit edits the form, compare the new page source with `formAssemblyMap.js` and `formDefinition.js`, update `PROGRAM.form_version`, regenerate the test page and run `npm test`.

### 2. Connect a real AI model
- **Never point the chat straight at a model.** A here.now proxy route forwards requests unchanged, so a proxy route to a model would let a direct request skip the guardrails. Route through `server/assistantHandler.js` (hosted wherever Invest Detroit runs code), and let that handler call the model.
- **Production:** Invest Detroit hosts an endpoint that takes the request above and answers from **approved** content only. The brief recommends retrieval (RAG) over their official pages, PDFs and the staff field guide, rather than training a model. It returns the reply above. The browser code doesn't change: only `ASSISTANT.endpoint`.

### 3. Re-run the checks on the server
`review.js` and `formDefinition.js` are plain JavaScript with no browser dependencies. Invest Detroit's backend, or a FormAssembly or Salesforce workflow step, can run `runReview(snapshot)` on each submission and store the issue summary with it. Browser checks can be bypassed, so anything that truly must block should also be checked server-side.

### 4. Staff hand-off
Not built. ("Talk to a person" was removed from the chat at the team's request.) The reply contract already has `needs_staff`, and issues have `requires_staff`. A hand-off would send only what the applicant chooses to share, through an approved channel.

## Chat answers today: the field guide

`ASSISTANT.mode` is `'guide'`. The chat answers in the browser from `fieldGuide.js`, with no AI and no network, using the same request and reply contract as a real AI endpoint:

1. **The "?" button** sends `intent: 'explain_field'` and gets that question's entry: explanation, example, common mistakes and source.
2. **Before the guide is consulted, the guardrails run** (see Guardrails). Then questions about **approval or whether the project qualifies** ("Will I be approved?", "Do I qualify?", "What rate will I get?") always get "only the Invest Detroit team decides that", plus contact details (brief: never guess). Published rate, fee, loan-size and timeline ranges are ordinary knowledge entries.
3. **Otherwise** the reply is the entry whose keywords best match the message, with a small preference for the question the applicant is on. Phrases like "what does this mean?" use the current question. Keywords include common Spanish, Arabic, Bengali and Chinese terms.
4. **No good match** gets "I don't have an approved answer for that yet", with contact details. The chat never makes up an answer.

The guide is a **draft written from the public form and four Invest Detroit documents**. It is English only: on other languages, the chat shows a translated note saying so. When a real AI is connected, the same entries become the approved material it answers from. Invest Detroit should review and own it.

### Upload tips (`uploadTips.js`)

A collapsible blue "Tip" (closed by default) above each required upload, plus one for the supporting documents. The budget warning fills in the applicant's own total budget and loan amount. Nothing opens or reads the file. Sending documents to an AI was considered and deliberately not built: see PROMPT-HISTORY entries 41–42.

### Knowledge entries (`knowledge.js`)

Facts from Invest Detroit's documents, written as short entries with keywords and sources, appended to `TOPICS`. The corpus is about 3,000 words, so hand-checked entries beat a vector search (RAG): every answer is reviewable and testable. Revisit RAG if the corpus grows past a few dozen documents.

| Source id | Document | Notes |
| --- | --- | --- |
| `re_flyer` | Real Estate Support flyer | This form's program: $150K–$2.5M, 8%–9.5%, 1%–3% fees, terms, collateral, eligible borrowers |
| `sb_flyer` | Small Business Support flyer | A **different program**. Only shown in `which_program`, labeled "do not apply to this form" |
| `lending_guide` | Lending Process & Closing Guide | Draft, no public URL (`url: null`, shown as plain text). Staff should confirm |
| `about_id` | Who is Invest Detroit? | Lists an older address (600 Renaissance Center); the flyers' 950 Selden St is used |
| `cni_page`, `developer_sheet` | investdetroit.com pages found by web search | Checked from search excerpts only (site blocked from the build session). See `docs/RESEARCH-NOTES.md` |
| `snf_overview` | Knight Foundation article on the Strategic Neighborhood Fund | General education (`educational`), not Invest Detroit policy |
| `id_website`, `cni_factsheet_2023`, `sb_process_2020`, `snf_page`, `id_ventures` | Invest Detroit pages and PDFs from the research brief | Fill gaps only |
| `hud_income_limits`, `lara_filing`, `detroit_parcel_viewer`, `detroit_bseed`, `occ_cre`, `fdic_terms`, `cfpb_title`, `epa_aai`, `alta_standards`, `sba_plan`, `cdfi_fund` | Government and standards bodies | `educational`; used by `glossary.js` and the how-to entries |

**Priority:** the four documents above win over web research. Research fills gaps only (tested). `glossary.js` holds plain-language definitions of lending terms (DSCR, LTV, soft costs, contingency, title commitment, Phase I and others), appended to `TOPICS` after the knowledge entries. Keywords containing a space or hyphen score double, so "loan-to-value" beats the plain word "loan".

Rules, enforced by `tests/fieldGuide.test.js`:
- Any entry that states a rate, fee or loan-size range must cite an Invest Detroit source and say "subject to change".
- Small Business numbers must cite `sb_flyer` and say they don't apply to this form.
- "Golden questions" taken from the documents must reach the right entry.

The review also has four information-only tips that cite these sources (`loan_outside_range`, `equipment_program`, `construction_before_closing`, `summary_experience`). The success pop-up shows the four lending-guide stages as "What happens next".

## Guardrails

The chatbot only helps with the application and business financing. Guardrails decide, **before any answer is produced**, whether a message may be answered. They live in `src/copilot/guardrails/`, separate from the answering logic.

**Where they run.** The same `evaluateRequest()` runs:
- in the browser, inside `createAssistant().ask()`, before any transport;
- on the server, inside `server/assistantHandler.js`. This is the copy that counts: a direct API request can skip the browser but not the handler.

The handler first rebuilds the request from known fields only, with size limits. A caller-supplied field label is ignored; the label comes from our field definition by id. Unknown keys, roles and intents are dropped. It then removes sensitive numbers, runs the guardrails, answers, and checks the answer on the way out. Nothing is stored.

**Decision order (first match wins):**

| Step | Catches | Result |
|---|---|---|
| 1. Protected | Hidden prompt or configuration, API keys, other applicants' data | Out-of-scope message |
| 2. Integrity | Help leaving out, changing or making up information ("Should I lie about my revenue?", "Can I leave out my bankruptcy?") | Fixed accuracy message offering to help report figures correctly |
| 3. Injection | "Ignore previous instructions", "you are now…", roleplay, hypotheticals, "I'm the developer", `SYSTEM:` lines | Injected sentences are ignored. If an on-topic question remains, it is answered; otherwise out-of-scope |
| 4. Off-topic task | Jokes, stories, essays and homework, trivia, programming, general-chatbot use | Out-of-scope message (exact approved wording) |
| 5. On-topic | Application and finance terms (including guide keywords in 4 languages), "explain this question" | Answer |
| 6. Follow-up | A short message right after an on-topic, answered turn, or a vague question while a form question is open | Answer |
| 7. Repeated | Two or more recent redirects | Out-of-scope message |
| 8. Unclear | Greetings, "can you help me?", one weak term, non-Latin text with no match | Short clarifying question. Several words with nothing application-related get the out-of-scope message |

**Fixed replies** are in `guardrails/messages.js`, never generated, and translated like all other text. Rejections return a structured reply: `{ kind: 'out_of_scope' | 'clarify' | 'integrity', text, guardrail: { action, category, version } }`.

**Hardening:**
- Text is normalized before checks: odd Unicode, zero-width characters, l33t spelling and s p a c e d letters are undone.
- The optional semantic classifier (`evaluateWithClassifier`) is only consulted for unclear cases. It can never override a protected, integrity or injection decision, which keeps model calls rare.
- The future system prompt (`server/systemPrompt.js`) contains a canary token. Any answer containing it, the prompt text or a key-like string is replaced with the out-of-scope message.

**Uploaded documents** are data, never instructions:
- `screenDocument()` removes instruction-like lines and hides sensitive numbers.
- `wrapUntrustedDocument()` escapes markup and puts the text in an `<untrusted_document>` block that the system prompt tells the model to treat as data.
- The guardrail decision never reads document text, so a document can't make an off-topic request allowed.
- The prototype itself never reads uploaded files.

**Tests:** `tests/guardrails.test.js` (74 cases) covers allowed questions, exact rejections, follow-ups, ambiguous messages, falsification, injection and obfuscation, direct HTTP requests, fake field labels, leaked output, poisoned documents, and the review being unaffected.

**Known limits** (not solved by rules alone):
- Keyword and pattern matching can be fooled by unusual paraphrases. New tricks need new patterns, or the optional classifier.
- Languages other than English are covered only for the main terms. Anything else gets a clarifying question rather than an answer.
- A determined user can bypass the browser copy. That is harmless today (there is no model behind it) but is why production must route through the server handler.
- Pattern lists can occasionally misfire, such as a legitimate message containing "password". Tune `lexicon.js` from real, anonymized usage.
- Once a real model is connected, its answers still need the output check and periodic review. The guardrail controls what gets answered, not every word of an answer.

## Chat rating card

After the assistant has answered two of the applicant's questions (refusals don't count), a card attached under the chat asks "How was your AI assistant experience?". The card:
- asks only once per chat session;
- saves only `{ feedback_id, rating, submitted_at }` to here.now Site Data (`public/.herenow/data.json`), where visitors can add ratings but not read them;
- shows an error and allows a retry if saving fails.

It works on account-owned here.now sites only. The add-on keeps it off unless given `data-feedback-endpoint`.

## Languages

The prototype page has a language dropdown in the header with English, Español, العربية, বাংলা and 简体中文. The first four match the translation menu on investdetroit.com; Simplified Chinese is our addition. Pages tagged `zh-TW`/`zh-Hant` also get Simplified until a Traditional dictionary is added.

- **Full translations, not machine translation on the fly.** Every piece of text has a written translation in `src/copilot/i18n/{es,ar,bn,zh}.js`. That covers questions, answer choices, hints, review messages, the chat and the page itself. Dictionaries are keyed by the exact English text, so anything missing falls back to English instead of breaking.
- **Answers stay in English underneath.** Only the display changes. Option values and review rules keep using the English values, so switching language mid-form never changes a review.
- **Review messages are templates.** Each issue carries `title_template`, `message_template` and `params`. The screen translates the template and each value separately, e.g. `'{section} section is empty'` with `section: 'Retail Project'`.
- **Arabic** sets `dir="rtl"` on the page. Numbers, zip codes, emails and dollar amounts stay left-to-right, and the review panel uses logical CSS (`border-inline-start`) so it mirrors correctly. Noto Sans Arabic and Noto Sans Bengali are loaded as fallback fonts; Chinese uses the device's own Chinese fonts.
- **The chat** sends the chosen language (`locale`) with each question, so a connected AI can answer in it.
- **The add-on** follows the host page's `<html lang>`, including live changes, or a fixed `data-locale`.
- **`tests/i18n.test.js`** fails if any text on the page is missing from a dictionary, or if a translation drops a `{placeholder}`.

**Not yet reviewed:** the translations were drafted with AI. The page says so, and that the English version is official. The brief and Invest Detroit's Language Assistance Plan call for qualified review of high-impact terms (legal acknowledgements, eligibility questions, financial terms) before real use. To revise a translation, edit the value in the language file; the English key must stay exactly as it is.

## Decisions that need Invest Detroit's approval
From the project brief, still open:
- Which review rules may **block** Submit. Today only missing required items, bad formats and loan-bigger-than-budget block.
- Whether an embedded script may read the form's answers in the browser (privacy and security review), and what the assistant vendor may receive and keep.
- Who owns the field definitions and help text, and how they're kept in sync with form edits.
- Where staff hand-off requests go.
- Who reviews and approves the Spanish, Arabic, Bengali and Chinese translations, and whether other languages are needed.

## Running and checking
```bash
npm test
```
```bash
npm run build
```
```bash
npm run lint
```
