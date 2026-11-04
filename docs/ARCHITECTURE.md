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
- **Prototype:** set `ASSISTANT.mode = 'http'` and add a here.now proxy route in `public/.herenow/proxy.json` that injects the key from a here.now variable. The instructor adds the key in here.now; it never goes in code.
- **Production:** Invest Detroit hosts an endpoint that takes the request above and answers from **approved** content only. The brief recommends retrieval (RAG) over their official pages, PDFs and the staff field guide, rather than training a model. It returns the reply above. The browser code doesn't change: only `ASSISTANT.endpoint`.

### 3. Re-run the checks on the server
`review.js` and `formDefinition.js` are plain JavaScript with no browser dependencies. Invest Detroit's backend, or a FormAssembly or Salesforce workflow step, can run `runReview(snapshot)` on each submission and store the issue summary with it. Browser checks can be bypassed, so anything that truly must block should also be checked server-side.

### 4. Staff hand-off ("Talk to a person")
Not built. The reply contract already has `needs_staff`, and issues have `requires_staff`. A hand-off would send only what the applicant chooses to share, through an approved channel.

## Chat answers today: the field guide

`ASSISTANT.mode` is `'guide'`. The chat answers in the browser from `fieldGuide.js`, with no AI and no network, using the same request and reply contract as a real AI endpoint:

1. **The "?" button** sends `intent: 'explain_field'` and gets that question's entry: explanation, example, common mistakes and source.
2. **Eligibility, approval, rates, fees and timelines** always get "only the Invest Detroit team can answer", plus contact details. This is checked before anything else (brief: never guess).
3. **Otherwise** the reply is the entry whose keywords best match the message, with a small preference for the question the applicant is on. Phrases like "what does this mean?" use the current question. Keywords include common Spanish, Arabic, Bengali and Chinese terms.
4. **No good match** gets "I don't have an approved answer for that yet", with contact details. The chat never makes up an answer.

The guide is a **draft written from the public form**. It explains what questions ask, and says nothing about policy (what counts as equity, rates, fees, how a "Yes" on legal questions is treated). Invest Detroit should review and own it. It is English only: on other languages, the chat shows a translated note saying so. When a real AI is connected, the same entries become the approved material it answers from (retrieval). `tests/fieldGuide.test.js` checks routing, the staff-only rule, and that the guide states no rates, fees or approval odds.

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
