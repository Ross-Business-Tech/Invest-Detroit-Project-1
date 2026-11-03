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
    formDefinition.js         field dictionary + visibility + format validation
    review.js                 rule-based checks (RULES list) → ReviewIssue[]
    reviewSession.js          review state machine (run / invalidate / reset)
    assistant.js              assistant client + transports
    privacy.js                redaction
    events.js                 analytics hook
    adapters/
      formAssemblyMap.js      our field id → live FormAssembly element id
      formAssemblyAdapter.js  reads/watches/focuses the live form, locks its Submit
  components/                 reusable screens (React)
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
The live page is WordPress with the intake form embedded from FormAssembly (form `4907942`). Steps:

1. **Build an embed bundle.** Add a second Vite entry (library mode) that mounts `ReviewPanel` above `#submit_button` and `ChatAssistant` in the corner. It should wire them to `createFormAssemblyAdapter()` and `createReviewSession({ getSnapshot: adapter.getSnapshot })`, using `adapter.subscribe(session.invalidate)` and `session.subscribe(s => adapter.setSubmitEnabled(s.canSubmit))`. Tested so far: the adapter, against a test page using the live form's markup (reading every control type, ignoring the SSN field, Go to field, Submit lock, change detection). Not built yet: the embed bundle itself.
2. **Load it on the page** with one `<script>` tag, added by whoever manages the WordPress site. FormAssembly's own validation still runs on Submit.
3. **Check the Submit lock against FormAssembly.** FormAssembly's scripts may re-enable its button. If so, also block in a `submit` listener (`preventDefault` until `canSubmit`).
4. **Keep the map current.** If Invest Detroit edits the form, compare the new page source with `formAssemblyMap.js` and `formDefinition.js`, update `PROGRAM.form_version`, and run `npm test`.

### 2. Connect a real AI model
- **Prototype:** set `ASSISTANT.mode = 'http'` and add a here.now proxy route in `public/.herenow/proxy.json` that injects the key from a here.now variable. The instructor adds the key in here.now; it never goes in code.
- **Production:** Invest Detroit hosts an endpoint that takes the request above and answers from **approved** content only. The brief recommends retrieval (RAG) over their official pages, PDFs and the staff field guide, rather than training a model. It returns the reply above. The browser code doesn't change: only `ASSISTANT.endpoint`.

### 3. Re-run the checks on the server
`review.js` and `formDefinition.js` are plain JavaScript with no browser dependencies. Invest Detroit's backend, or a FormAssembly or Salesforce workflow step, can run `runReview(snapshot)` on each submission and store the issue summary with it. Browser checks can be bypassed, so anything that truly must block should also be checked server-side.

### 4. Staff hand-off ("Talk to a person")
Not built. The reply contract already has `needs_staff`, and issues have `requires_staff`. A hand-off would send only what the applicant chooses to share, through an approved channel.

## Decisions that need Invest Detroit's approval
From the project brief, still open:
- Which review rules may **block** Submit. Today only missing required items, bad formats and loan-bigger-than-budget block.
- Whether an embedded script may read the form's answers in the browser (privacy and security review), and what the assistant vendor may receive and keep.
- Who owns the field definitions and help text, and how they're kept in sync with form edits.
- Where staff hand-off requests go.
- Whether the copilot should support the site's Spanish, Arabic and Bengali translations. The site already offers them through its translation menu. All copilot text lives in the core and screen files today, ready to be moved into translation files.

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
