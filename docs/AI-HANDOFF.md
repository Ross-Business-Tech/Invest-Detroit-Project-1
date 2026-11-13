# Handoff for a new AI chat: start here

Read this file first, then `CLAUDE.md`. It sums up everything decided so far, so a new chat can carry on without the old conversation. Last updated November 13, 2026.

## 1. The project in one paragraph

A student team (Ross School of Business, Business+Tech AI Sprint) built an **AI Application Copilot** for **Invest Detroit**'s Real Estate/C&I In-Take Form. The site is a replica of investdetroit.com/need-support. It adds:

- **Review My Application:** fixed rules and math, never AI. It sorts issues into "Must fix" (blocks Submit), "Please double-check" (the applicant can answer "My answer is correct: explain why") and "Good to know".
- **A chat assistant:** Claude when a key is set, otherwise the built-in field guide.
- **Five languages:** en, es, ar (right-to-left), bn, zh.
- **Guardrails:** off-topic, cheating/integrity, prompt injection, SSN redaction.
- **A staff summary** sent with each application.
- **Save and resume:** on the device only.
- **A password-protected `/insights` usage page:** counts only.
- **An embeddable add-on** for the real FormAssembly form.

**The final presentation to the client is November 17, 2026.**

## 2. Who you're helping

- A business-school student who **is not a programmer**. Use plain language and make technical decisions yourself; ask only product questions.
- After each change, give one or two sentences on what changed, then the next step.
- **Keep `PROMPT-HISTORY.md` updated.** List only prompts that changed the app (not chat), each lightly edited for clarity, never collapsed into one. Add new entries before "Tips from this build".

## 3. Where things stand

- **Branch:** `claude/amazing-heisenberg-brezgi`.
- **Pull request:** https://github.com/Ross-Business-Tech/Invest-Detroit-Project-1/pull/2 into `development`. CI was green on the last push. Never push to `main`.
- **Hosting:** a Render Web Service connected to this repo.
  - Build `npm ci && npm run build`, start `npm start`, health check `/healthz`, Node 22.
  - Settings are in `render.yaml`.
  - The Render link has **not** been given to the AI yet.
  - Vercel also works (`vercel.json`, `api/*.js`); an older copy runs on the student's fork at https://invest-detroit.vercel.app/.
- **Claude:** the code is ready (`server/claudeAnswerer.js`, model `claude-opus-5-5`, effort low, server-side refusal fallback on).
  - The API key was due "tomorrow" (around November 12). The student adds `ANTHROPIC_API_KEY` in Render's Environment settings, **never in code or chat**.
  - Optional settings: `INSIGHTS_PASSWORD`, `DATABASE_URL`, `ASSISTANT_SALT`, `ASSISTANT_DAILY_LIMIT` (default 500), `ASSISTANT_VISITOR_DAILY` (default 60).
  - After the key is added, run `node tools/check-chat.mjs <site>` for 8 live checks, and rerun the test set.
- **here.now preview:** taken down on purpose; its content was replaced with "This preview is no longer available" (expires November 18). **Do not run `npm run publish:preview`**: it would bring the app back on that link. Render is now the main link.
- **Tests:** `npm test` (192 passing). The `npm run smoke` browser check is skipped in this sandbox; use Playwright with `executablePath: '/opt/pw-browsers/chromium'` instead.

## 4. Final deliverables (from the sprint's outline)

They're all in `docs/handoff/`; its `README.md` has the checklist.

| Item | Where | Still needed |
|---|---|---|
| One-page README (+ full prompt) | `README.md` | Render link, team names, a named owner at Invest Detroit |
| Test results sheet | `docs/handoff/Invest-Detroit-Copilot-Test-Results.xlsx` | (none) |
| Slide deck, 10 slides | `docs/slides/Invest-Detroit-Copilot-Client-Deck.pptx/.pdf` | team name, date, link |
| User guide, 7 pages | `docs/handoff/Invest-Detroit-Copilot-User-Guide.pdf/.docx` (source `USER-GUIDE.md`) | video links |
| Demo videos | scripts in `docs/handoff/DEMO-VIDEO-SCRIPTS.md` | **the team records them** |
| Exit email | `docs/handoff/EXIT-EMAIL.md` | send after the presentation, once the data deletion is really done |
| Data-flow note for IT | `docs/handoff/Invest-Detroit-Copilot-Data-Flow.pdf` | (none) |

**Numbers that must stay consistent across the README, deck and sheet:**

- **Test score 42/43.** Normal 15/15, Tricky 13/14, Must Never 14/14.
  - The one known miss is C14: "My ZIP is 48212, does that mean I'm in Detroit?" gets a "tell me more" reply instead of the city-limits help. It was left unfixed on purpose.
  - History: first run 28/30. 30/36 after adding new wordings, before the fix. 36/36 after fixing integrity, Small Business rates and "qualifies". 42/43 after 7 fresh examples that weren't used for tuning.
  - C13 had a grading fix that a person reviewed.
- **Measured impact:** today's Submit checks catch **2/10** example mistakes; the copilot catches **10/10** (`node tools/measure-impact.mjs`).
- **Cost estimate:** about $0.02–$0.09 per chat question. That is about $10–$45 a month at an assumed 500 questions, plus Render about $7 and Postgres about $6, so about $25–$60 a month in total. The question volume is our assumption, not a client figure.
- **Rerun the tests:** `node tools/run-test-set.mjs && python3 tools/build-results-sheet.py`.
  - **Rule:** write the expected answer before running; don't keep a change that lowers the score.
  - If you add or fix cases, update the score everywhere (README, deck, sheet, `docs/handoff/README.md`, user guide).

The deck was generated with pptxgenjs from a script that lived in the old session's scratch space and is **not** in the repo. To change it, edit the .pptx directly or rebuild it.

## 5. Decisions already made (don't reopen them without the student)

- **Invest Detroit's 4 documents beat web research.** The tests check, among other things, that there's no "6%–8%", no "600 Renaissance" and no "$661 million".
  - Published rates must name an Invest Detroit source and say "subject to change".
  - Small Business terms are always labeled as a **different program**.
- **Claude may give general guidance** (finance concepts, how to write a summary, arithmetic), but Invest Detroit specifics come **only** from the knowledge base, with source ids (`server/systemPrompt.js`).
  - When Claude is connected, the pre-filter is lenient: unclear questions go to Claude. Protected, integrity, injection and off-topic-task requests are still blocked.
- **The review never uses AI.** AI checks must never block Submit.
- **No reading of uploaded PDFs.** Files are checked only for type, size and empty files. Upload tips are a collapsible blue "TIP".
- **The staff summary** is built in the browser and goes only into a hidden FormAssembly field (add-on option `data-summary-field`). It is never stored by our server and is in English.
- **Insights store counts only:** allow-listed event types and keys. Never chat text, names or raw IP addresses. Per-visitor limits use a daily salted hash.
- **Sensitive fields:** the SSN field is disabled in the prototype, and the chat redacts SSN-like numbers. Staff names are placeholders. All sample data is fictional ("Jordan Ellis").
- **"Before you start"** is collapsed by default, and the progress chips fit on one row.

## 6. Code map

- `src/copilot/`: core logic, with no screens.
  - `formDefinition.js`, `review.js` (rules), `fieldGuide.js` + `knowledge.js` + `glossary.js` (knowledge base), `config.js` (`SOURCES`, `ASSISTANT`, `FEEDBACK`).
  - `guardrails/`: rules in `lexicon.js`.
  - `assistant.js`, `guideTransport.js`, `formHelpers.js`, `staffSummary.js`, `metrics.js`, `hosting.js`, `i18n`.
  - Every on-screen string must be translated; `tests/i18n.test.js` enforces this.
- `src/prototype/`: the replica form, progress bar, "How it works", "Before you start", `draft.js` (save and resume), sample applicant.
- `src/components/`: review panel, chat, fields, success dialog.
- `src/embed/`: the FormAssembly add-on.
- `server/`: `webServer.js` (Render), `assistantHandler.js`, `claudeAnswerer.js`, `systemPrompt.js`, `knowledgeContext.js`, `store.js` (Postgres or memory), `insights.js`.
- `api/`: Vercel-style functions.
- `tools/`: `run-test-set.mjs`, `build-results-sheet.py`, `measure-impact.mjs`, `check-chat.mjs`.
- `docs/`: `AI-SETUP.md` (key and hosting steps), `ARCHITECTURE.md`, `RESEARCH-NOTES.md`, `PROJECT-OVERVIEW.md` (the old long README).

## 7. Rules that always apply

- Never print or commit API keys, passwords, `.env` files or `~/.herenow/credentials`. The repository is **public**.
- Never publish production or the dev site yourself.
- Don't change `scripts/`, `.github/`, `.claude/`, `admin/` or `CLAUDE.md` unless the student asks.
- No model names in commit messages or PR text.
- Before starting work, `git fetch origin development` and merge it if this branch is behind.

## 8. Good next steps

1. Get the Render link and add it to the README, user guide, deck and PR #2.
2. When the key is in: run `tools/check-chat.mjs`, rerun the test set, and update the score everywhere if it changes.
3. Fill in the team names and the named owner; help record the videos from the scripts.
4. Optional: fix C14 (ZIP/city-limits wording). Add it as a new test case first, and report the change honestly in the score history.
