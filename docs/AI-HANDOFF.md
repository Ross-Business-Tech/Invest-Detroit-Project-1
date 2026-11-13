# Handoff for a new AI chat: start here

Read this file first, then `CLAUDE.md`. It sums up everything decided so far, so a new chat can carry on without the old conversation. Last updated November 13, 2026 (chatbot switched to OpenAI).

## 1. The project in one paragraph

A student team (Ross School of Business, Business+Tech AI Sprint) built an **AI Application Copilot** for **Invest Detroit**'s Real Estate/C&I In-Take Form. The site is a replica of investdetroit.com/need-support. It adds:

- **Review My Application:** fixed rules and math, never AI. It sorts issues into "Must fix" (blocks Submit), "Please double-check" (the applicant can answer "My answer is correct: explain why") and "Good to know".
- **A chat assistant:** OpenAI when `OPENAI_API_KEY` is set (Claude still works as an alternative with `ANTHROPIC_API_KEY`), otherwise the built-in field guide.
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
- **The AI is live on Render** (confirmed by the student on November 13: the chat shows "AI helper").
  - It uses OpenAI through the **University of Michigan's GPT Toolkit gateway** with the student's DATASCI 315 "Codex for the Classroom" key ($50 a month budget).
  - Render settings: `OPENAI_API_KEY` (the key, **never in code or chat**), `OPENAI_BASE_URL=https://api.toolkit.umgpt.umich.edu/v1`, `OPENAI_MODEL=gpt-5.6-terra`.
  - Code: `server/openaiAnswerer.js` (Responses API, strict JSON reply, `store: false`, 30-second timeout, retries without optional settings a gateway rejects), `server/aiProvider.js` (picks the service from the keys), `server/modelReply.js` (shared reply format).
  - Open points: the class key may be for coursework only (ask the instructor); the site is public, so suggest `ASSISTANT_DAILY_LIMIT=100`; Invest Detroit needs its own OpenAI key after handover.
  - This workspace can't reach onrender.com or U-M's gateway (network policy), so live checks are run by the student or in a session with those domains allowed.
  - Optional settings: `INSIGHTS_PASSWORD`, `DATABASE_URL`, `ASSISTANT_SALT`, `ASSISTANT_DAILY_LIMIT` (default 500), `ASSISTANT_VISITOR_DAILY` (default 60).
  - Still to do: `node tools/check-chat.mjs <site>` (8 live checks) and `OPENAI_API_KEY=… OPENAI_BASE_URL=… OPENAI_MODEL=… node tools/run-test-set.mjs --ai` from a computer that can reach the gateway. The 42/43 score was measured with the built-in guide.
- **here.now preview:** taken down on purpose; its content was replaced with "This preview is no longer available" (expires November 18). **Do not run `npm run publish:preview`**: it would bring the app back on that link. Render is now the main link.
- **Tests:** `npm test` (192 passing). The `npm run smoke` browser check is skipped in this sandbox; use Playwright with `executablePath: '/opt/pw-browsers/chromium'` instead.

## 4. Final deliverables (from the sprint's outline)

They're all in `docs/handoff/`; its `README.md` has the checklist.

| Item | Where | Still needed |
|---|---|---|
| One-page README (+ full prompt) | `README.md` | Render link, team names, a named owner at Invest Detroit |
| Test results sheet | `docs/handoff/Invest-Detroit-Copilot-Test-Results.xlsx` | (none) |
| Slide deck, 34 slides (rebuild: tools/build-client-deck.mjs) | `docs/slides/Invest-Detroit-Copilot-Client-Deck.pptx/.pdf` | team name, date, link |
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
- **Cost estimate (OpenAI):** about $0.01–$0.04 per chat question. That is about $5–$20 a month at an assumed 500 questions, plus Render about $7 and Postgres about $6, so about $20–$35 a month in total. The question volume is our assumption, and the prices come from third-party lists because OpenAI's site was blocked.
- **Rerun the tests:** `node tools/run-test-set.mjs && python3 tools/build-results-sheet.py`.
  - **Rule:** write the expected answer before running; don't keep a change that lowers the score.
  - If you add or fix cases, update the score everywhere (README, deck, sheet, `docs/handoff/README.md`, user guide).

The deck was generated with pptxgenjs from a script that lived in the old session's scratch space and is **not** in the repo. To change it, edit the .pptx directly or rebuild it.

## 5. Decisions already made (don't reopen them without the student)

- **Invest Detroit's 4 documents beat web research.** The tests check, among other things, that there's no "6%–8%", no "600 Renaissance" and no "$661 million".
  - Published rates must name an Invest Detroit source and say "subject to change".
  - Small Business terms are always labeled as a **different program**.
- **The AI may give general guidance** (finance concepts, how to write a summary, arithmetic), but Invest Detroit specifics come **only** from the knowledge base, with source ids (`server/systemPrompt.js`).
  - When an AI key is set, the pre-filter is lenient: unclear questions go to the AI. Protected, integrity, injection and off-topic-task requests are still blocked.
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
- `server/`: `webServer.js` (Render), `assistantHandler.js`, `aiProvider.js`, `openaiAnswerer.js`, `claudeAnswerer.js` (alternative), `modelReply.js`, `systemPrompt.js`, `knowledgeContext.js`, `store.js` (Postgres or memory), `insights.js`.
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
2. Run `tools/check-chat.mjs` and the test set with `--ai`; update the score everywhere if it changes.
3. Fill in the team names and the named owner; help record the videos from the scripts.
4. Optional: fix C14 (ZIP/city-limits wording). Add it as a new test case first, and report the change honestly in the score history.
