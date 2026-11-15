---
title: "Application Copilot: How the Backend Works"
subtitle: "A guide for Invest Detroit's web, IT and data teams · Invest Detroit Team #1 · November 2026"
---

# How to read this guide

This guide explains, in plain words, everything that runs behind the Application Copilot: what each part does, what it depends on, where it is limited, and what your team should check or change before using the code. It is written for people who run websites and data, not for programmers, but each section says where the code lives so a developer can find it.

**The honest summary:** the copilot works and has been tested on a practice copy of your form with made-up data. It has **not** been run on your real page, with your real accounts, or with real applicants. Sections 8 to 11 list what that means in practice.

| If you only have five minutes, read | Page section |
|---|---|
| What the pieces are | 1 |
| What you must set up or change | 8 |
| What it cannot do yet | 9 |
| What to be careful about | 10 |
| The day-one checklist | 12 |

# 1. The big picture

There are three layers.

| Layer | What it is | Where it runs | Who controls it |
|---|---|---|---|
| **The add-on** | One script that adds the copilot's features on top of your FormAssembly form: the review, the **?** help buttons, the chat, the progress bar and the staff summary | In the visitor's web browser, on your WordPress page | You switch it on or off with one line |
| **The service** (the "backend") | A small program that answers chat questions, talks to the AI, keeps usage counts and takes ratings | On a server that **you** choose (we used Render) | Whoever hosts it |
| **The outside accounts** | The AI provider (we used OpenAI through a university gateway), an optional database (Postgres), and your own data system | Other companies' servers, or yours | You |

Applications themselves **never pass through the service**. When someone presses Submit, the answers go to FormAssembly exactly as they do today. The service only ever sees chat questions and simple usage counts.

**Why a service is needed at all.** WordPress and FormAssembly only display and collect forms. They cannot safely hold the AI key (anything in a web page is public) or run a program that calls an AI. So that one job lives on a small server.

**What works without the service.** The review (17 fixed rules), the question **?** help written in advance, the progress bar, the dollar formatting, save and resume on the device, and the staff summary all run in the browser. If the service is down, slow or switched off, those keep working and the chat falls back to built-in English answers. The form itself is never blocked.

# 2. What happens when someone asks the chat a question

Each step below happens on every question. Code: `api/assistant.js`, `server/assistantHandler.js`.

1. **The browser cleans the message.** Anything that looks like a Social Security number is replaced before the message leaves the page.
2. **The service checks the size and the rate.** A message can be at most 2,000 characters; the last 20 turns of the conversation are kept; a whole request can be at most 64 KB. Each visitor is limited to 20 questions a minute.
3. **Daily limits.** After 60 AI answers a day from one visitor, or 500 a day for the whole site, the service stops calling the AI and answers from the built-in guide instead. Both numbers are settings.
4. **Safety checks (fixed rules, no AI).** Off-topic requests, requests to leave out or change information, tricks like "ignore your rules", and requests for approval predictions are answered with a standard reply. The AI is not called, so these cost nothing.
5. **The AI answers.** The service sends the AI the question, the recent conversation, the applicant's language and the whole knowledge base (section 3). The AI must reply in a fixed format. It has 30 seconds, with one retry. The conversation is not stored by the provider (`store: false`).
6. **The answer is checked.** If it leaks the instructions, is too long (over 6,000 characters), is malformed, or cites a source that does not exist, it is replaced or cleaned.
7. **The applicant sees the answer** with its source. If any step fails (no key, the AI is down, a timeout, a limit), the built-in guide answers instead. The chat never shows an error page.

**Which parts are AI?** Only step 5. The review, the safety checks, the file checks and the staff summary are fixed rules, so they give the same answer every time and can be explained to an auditor.

# 3. The knowledge base: where the AI gets its facts

We did **not** train an AI. We give it a library of Invest Detroit facts with every question and tell it that anything specific to Invest Detroit must come from that library.

| What | How much | Where in the code |
|---|---|---|
| Sources (documents and public pages) | 28 | `src/copilot/config.js` |
| Question-by-question help | 51 questions | `src/copilot/fieldGuide.js` |
| Knowledge entries (process, rates, programs) | 23 | `src/copilot/knowledge.js` |
| Glossary terms | 11 | `src/copilot/glossary.js` |
| Put together for the AI | about 14,000 tokens of text | `server/knowledgeContext.js` |

**The rule of priority.** Four Invest Detroit documents win every disagreement: the Real Estate Support flyer, the Small Business Support flyer (always labeled as a *different* program), the Lending Process and Closing Guide (marked draft: staff should confirm), and "Who is Invest Detroit?". Facts from our web research only fill gaps. The tests check that outside figures never replace yours.

**How facts are changed today.** Someone edits `knowledge.js` (a JavaScript file), runs the tests and redeploys the service. Moving to a different server does not change this. A person who is not comfortable with files cannot do it alone (see improvements, section 11).

**What this design means.**

- Updating a rate or a fact never requires "retraining". It is an edit and a redeploy.
- The facts are **copies**. If a flyer changes and nobody updates the file, the chat keeps quoting the old number. Published ranges are always labeled "subject to change", but the copy can still go stale.
- Because the whole library is sent with each question, the library has a practical size limit. At about 14,000 tokens it is comfortable; several times larger would raise cost and slow answers (section 11 suggests a smarter lookup).
- The facts are written in English. The AI translates answers into the applicant's language; those translations have not been reviewed by a native speaker.

# 4. What the AI will and will not do

These rules are written into the AI's instructions (`server/systemPrompt.js`) and backed by the fixed safety checks and the tests.

- **Will:** quote published rates, fees and loan sizes as ranges from a named source, "subject to change"; explain terms (DSCR, equity, AMI); help structure a summary or a budget; do simple arithmetic with the applicant's own numbers; point to which documents to send and who to contact.
- **Will not:** predict approval, eligibility or anyone's rate; judge credit, legal or tax questions; confirm a property is inside Detroit city limits; help leave out, change or invent information; reveal its instructions or other applicants' information; follow "ignore your rules" tricks.
- **If it does not know:** it says so and points to the Invest Detroit team. It is told never to guess a number.

**Tested.** 46 of 46 test questions pass, including all 14 "must never" cases. **Be aware** that this score was measured on the *built-in* answers. It has not yet been measured with a live AI behind it, and the last fix was made with those questions in view. Section 9 lists this as an open item.

# 5. What data is kept, and where

| Data | Kept? | Where | Notes |
|---|---|---|---|
| The application answers and uploaded files | Not by us | FormAssembly, as today | The service never receives them |
| Chat messages and answers | **Not stored by the service** | They travel to the AI provider to be answered | Provider terms apply (see section 10) |
| Usage counts | Yes | Memory, or a Postgres table | Counts by day and category only |
| Star ratings | Yes, as counts | Same table | No text |
| Staff summary | Built in the browser | A hidden FormAssembly field | Never reaches our service |
| A saved draft | Yes | The applicant's own device, 7 days | The SSN box is never saved |
| Visitor limits | As a one-way hash | Same table | Hash of salt, date and IP; the IP is never stored |

**Usage counts** look like "day, category:item, total", for example "2026-11-13, review_issue:loan_gt_budget, 3". Only allow-listed categories are accepted; chat text, names, notes and raw IP addresses are never recorded. The table is `copilot_counts` (day, key, count); rows older than 400 days are deleted automatically.

**Without a database, counts live in memory** and vanish whenever the service restarts or sleeps. That is fine for testing and not for a pilot.

## How the counts reach your own system

There is no dashboard. Pick whichever of the four ways fits (`docs/DATA-PIPELINE.md`); they can be combined.

1. **Read the table** (`copilot_counts`) with a read-only database user.
2. **Pull a JSON file** from `GET /api/usage?days=30` with the header `Authorization: Bearer <USAGE_EXPORT_TOKEN>`.
3. **Receive a push.** Set `USAGE_WEBHOOK_URL` (and `USAGE_WEBHOOK_SECRET` to sign it) and the service sends batches of up to 200 new counts every 5 seconds. **It does not retry.** If your system is down, those pushes are lost; the counts are still in the table and the export, so reconcile from there.
4. **Collect page events** in your own analytics: the add-on also fires browser events named `investdetroit:copilot`.

# 6. How the add-on attaches to your form

Code: `src/embed/`. It is built into one file, `copilot.js`.

- **One script tag** switches it on. Options are added as `data-` settings on that tag: language and appearance (`data-theme`), an intro panel, save and resume, the hidden staff-summary field (`data-summary-field`), the service address (`data-server`), and others (`docs/FORMASSEMBLY-INTEGRATION.md`).
- **It reads your form's own field codes** (FormAssembly names them `tfa_` plus a number) and option codes. These were copied from form 4907942. If the form is edited, a field is added, or the form is copied to a new form, **the mapping must be checked**: the review rules look fields up by those codes.
- **It lives in its own box** (a shadow root) so it neither takes on your site's styling nor changes it.
- **It is built to fail safely.** If anything goes wrong, it removes itself and the form works as before. It never touches the SSN field and never opens uploaded files.
- **The Submit button.** The review can lock Submit until "Must fix" items are fixed. The lock is only in the browser, so someone with technical skill can bypass it. Treat the review as help, not as a gate (section 10).

# 7. What the service is made of

| Piece | File | In plain words |
|---|---|---|
| Web server | `server/webServer.js` | Starts the service, serves the demo site and the `/api/` addresses, adds the "allowed websites" check, shuts down cleanly |
| Chat endpoint | `api/assistant.js` | Limits, safety checks and picking the AI |
| Request rules | `server/assistantHandler.js` | Cleans the request and checks the answer |
| AI connection | `server/aiProvider.js`, `openaiAnswerer.js`, `claudeAnswerer.js` | Picks OpenAI (or Claude) from which key is set |
| Instructions | `server/systemPrompt.js`, `knowledgeContext.js` | What the AI is told, and the facts it gets |
| Counts and limits | `server/store.js`, `server/usage.js` | Memory or Postgres; export, webhook, ratings |
| Other host option | `api/*.js`, `vercel.json` | The same functions in Vercel's style |
| Checks | `tests/`, `tools/check-chat.mjs`, `tools/run-test-set.mjs` | 206 automatic tests, 8 live checks, the 46-question test set |

**Addresses the service offers:** `POST /api/assistant` (chat), `POST /api/events` (usage counts from the add-on), `POST /api/feedback` (ratings), `GET /api/usage` (export, needs the token), `GET /healthz` (health check, answers "ok"). It serves the demo page and the add-on file at `/embed/copilot.js`.

**What it needs to run:** Node 22, `npm ci && npm run build`, then `npm start`. It listens on the `PORT` setting (3000 if unset). It must sit behind **HTTPS**, because your website is HTTPS and browsers block plain-HTTP calls from it. Nothing in the code is specific to Render; we ran it locally and on Render only.

# 8. What our setup uses that you will have to reconfigure

This is the most important section for handoff. Everything in the first table is a setting entered on the host, never in the code.

## Settings

| Setting | What it does | Our pilot value | What you should do |
|---|---|---|---|
| `OPENAI_API_KEY` | The AI account | A **class key** from the University of Michigan "Codex" program ($50 a month budget) | **Replace with Invest Detroit's own key.** Ours ends after the sprint and may be for coursework only |
| `OPENAI_BASE_URL` | Where AI requests go | The university's gateway | Remove it if you use OpenAI directly, or set your provider's address |
| `OPENAI_MODEL` | Which AI model | Set in our hosting settings (the code and `render.yaml` carry a default that differs from what we run) | **Choose and set explicitly.** Model names and prices change; check what your key allows |
| `OPENAI_EFFORT` | How much the model "thinks" | `low` (fast, conversational) | Keep, or raise if answers are too shallow |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `ASSISTANT_MODEL` | Optional switch to Claude | Not used | Only if you prefer Claude |
| `ALLOWED_ORIGINS` | Websites allowed to call the service | Defaults to `https://investdetroit.com` and the `www` version | **Confirm the exact address your form page is served from.** Any other address, including a staging site, is refused |
| `DATABASE_URL` | Keeps counts and limits | A Render Postgres database | Point to your own Postgres, or accept that counts reset on restart |
| `DATABASE_SSL` | Force database encryption on or off | Automatic | Set `false` or `true` for an unusual database |
| `ASSISTANT_SALT` | Keeps visitor limits steady across restarts | Generated by Render | Set a long random value |
| `ASSISTANT_RATE_LIMIT` | Questions a minute per visitor | 20 | Adjust |
| `ASSISTANT_VISITOR_DAILY` | AI answers a day per visitor | 60 | Adjust |
| `ASSISTANT_DAILY_LIMIT` | AI answers a day for the whole site | 500 (we suggested 100 for the pilot) | **Set deliberately: it is your main spending brake** |
| `USAGE_EXPORT_TOKEN` | Password for `/api/usage` | Not set until needed | Set a long random value if you use the export |
| `USAGE_WEBHOOK_URL`, `USAGE_WEBHOOK_SECRET` | Push counts to your system | Not set | Set if you want pushes |
| `PORT` | Which port to listen on | Set by the host | Set by yours |

## Things hard-coded in the code

These are not settings. A developer must change them in the files.

- **Contact details** (info@investdetroit.com, 313.259.6368) are written into the knowledge base and messages. Staff names in the demo are placeholders.
- **The form mapping:** field and option codes from form 4907942 (`src/copilot/adapters/formAssemblyAdapter.js` and the form definition).
- **The 28 sources and all facts** (`src/copilot/config.js`, `knowledge.js`, `fieldGuide.js`).
- **The 17 review rules** and their thresholds (for example the loan-to-budget check) in `src/copilot/review.js`. Invest Detroit's policy people should read them.
- **Languages:** English, Spanish, Arabic, Bengali and Chinese. Every on-screen string must be translated; a test enforces this when text is added.
- **The demo replica page** only asks the service for AI answers on Vercel, Render and localhost addresses (`server_hosts` in `config.js`). This does not affect the add-on on your form.
- **`render.yaml`** points at our working branch and names our database. It is only needed if you use Render; otherwise ignore it.

# 9. Limitations: what it cannot do yet

1. **Runs on a class AI account.** It ends with the sprint. Until Invest Detroit adds its own key, the chat uses the built-in English answers.
2. **Not tested on your real page.** We tested on a practice copy with made-up data. Nothing has been verified on your actual WordPress page, theme or security plugins.
3. **The live AI has not been scored.** The 46/46 result is for the built-in answers. The live-AI score is the next measurement. Someone needs to run `OPENAI_API_KEY=… OPENAI_BASE_URL=… OPENAI_MODEL=… node tools/run-test-set.mjs --ai` from a computer that can reach the AI provider.
4. **Real benefit is not yet measured.** We measured that the original form caught 2 of 10 common mistakes and the copilot caught 10 of 10. We have **not** measured time saved or fewer follow-up emails. That needs a pilot.
5. **No file reading.** Uploaded files are checked only for type, size and emptiness. This is deliberate, for privacy.
6. **Facts are static copies** that someone must keep current (section 3).
7. **Translations were drafted with AI** and have not been checked by native speakers.
8. **Review rules are reminders, not decisions.** Rules cannot know every situation, and staff still read the documents.
9. **Costs are estimates** (section 10).
10. **No load testing.** We have not tested what happens with many applicants at once.
11. **One server, one copy.** The service is a single process with no failover.
12. **No staff screens.** There is no dashboard and no screen for editing facts. Everything goes through your own systems and the code files.
13. **Logging is basic.** The service writes JSON lines to the host's log (AI usage counts, limit events, errors, never chat text). How long they are kept, and whether anyone is alerted, is up to the host.

# 10. What to be careful about before using the code

Ordered roughly by importance.

**1. The add-on script is code running on your form page.** The page holds applicant data. Whoever controls the address the script is loaded from controls that code. By default it loads from the service. Before launch, **host a copy of `copilot.js` yourselves** (your own site or CDN), pin the version you reviewed, and have your web team read the file. Our code never reads the SSN field or uploaded files, but you should confirm that for yourselves, not take our word. (If you host the script elsewhere, add `data-server="https://your-service-address"` so it still finds the service.)

**2. Text typed in the chat goes to an AI company.** The browser hides numbers that look like SSNs, but that is pattern matching. If an applicant types an account number, a medical detail or a phone number into the chat, it will reach the provider. We ask the provider not to keep conversations (`store: false`), but your agreement and the provider's retention rules decide what actually happens. Have your legal and IT teams decide whether that is acceptable, and say so in the chat's introduction if needed.

**3. The visitor limit can be faked.** Per-visitor limits trust the `X-Forwarded-For` header (the visitor's address as reported by a proxy). Someone who sets that header themselves can look like many visitors and skip the per-visitor limit. The **site-wide daily cap still holds**, and so does your provider's monthly budget cap. If you host behind your own proxy, configure which proxy to trust. The per-minute brake is kept in memory, so it resets on restart and is separate on each server copy.

**4. Nothing logs in to the counting endpoints.** `/api/events` and `/api/feedback` accept only allow-listed event types, and the browser check restricts which websites may call them, but that check only stops *browsers*. A script can still post fake counts. Treat usage counts as approximate, not audit-grade.

**5. Cost is an estimate, and runaway use is possible.** We estimate about $0.01 to $0.04 per question, about $5 to $20 a month at an assumed 500 questions, plus hosting (about $7 for a service that stays awake) and optional Postgres (about $6): **about $20 to $35 a month in total**. These come from third-party price lists, because we could not open the provider's own pricing page. The 500 questions a month is our assumption, not yours. Set the daily cap and a monthly budget limit on the provider's side before launch, and look at real usage after a week.

**6. Cold starts.** On a free hosting plan the service sleeps when idle and the first visit takes about a minute. The chat falls back to built-in answers meanwhile. Use an always-on plan for a live form.

**7. The submit lock is not security.** The review can lock Submit in the browser; it is not a server-side check. Applications reach FormAssembly regardless of what the add-on shows. If you need enforced validation, it must also exist in FormAssembly or on a server you control.

**8. If the form changes, so must the code.** New, renamed or reordered questions in FormAssembly can quietly break the review rules and the progress bar. After any change to the form, re-run the tests and the practice-page check.

**9. Nobody owns it yet.** The README still has the placeholder `[NAMED OWNER AT INVEST DETROIT]`. Someone needs to own keys, updates to facts, monitoring and the monthly bill.

**10. Dependencies and security review.** The service uses a handful of packages (including the OpenAI and Anthropic libraries and a Postgres library). We have not run a formal security audit or penetration test, and we have not run a dependency vulnerability scan. Run one before going live.

**11. Hosting variants differ.** On Vercel, the "allowed websites" check is not built in, and the in-memory per-minute brake is ineffective across short-lived copies. Prefer the Node server unless there is a reason not to.

**12. No Dockerfile.** If you deploy with containers, a short one is needed.

**13. Public repository.** If you publish this code, remember that the instructions, the knowledge base and the rules are all readable by anyone. They contain no secrets, but they are public.

# 11. How to improve it: suggested next steps

**Before a trial (small, high value)**

- **A setup check command.** One command that confirms the AI key works, your website is on the allowed list, the database connects, and the export password is set, with a plain "all good / here is what is wrong" report. We already have `tools/check-chat.mjs`; it would be extended.
- **A richer health page.** Let `/healthz` also report (without secrets) whether the AI is on, whether the database is connected and which version is running.
- **A "how to update a fact" guide** with one worked example, aimed at the person who will edit `knowledge.js`.
- **A safer visitor limit.** A setting that names the proxy to trust, instead of trusting the header blindly.
- **Run the live-AI test set**, and update the score everywhere if it changes.
- **Operations note:** how to rotate the AI key, what the 400-day cleanup does, where to watch for errors, how to set the spending cap.

**During a trial**

- **Measure** follow-up emails per application and the share of applications needing fixes, before and during.
- **Native-speaker review** of the four non-English languages.
- **Test on a practice copy of your real page**, with your theme and security plugins, before the live form.

**Later (only with evidence)**

- **Edit facts without code.** First step: read the facts from a Google Sheet or a file staff edit. Better: a small staff page with a review step before changes go live. Whatever is typed must still pass the "documents win" and safety rules.
- **Server-side checks.** Re-run the review rules when an application arrives, so the check does not depend on the browser.
- **Smarter fact search.** Send the AI only the entries relevant to a question, as the library grows.
- **Retry for pushes.** A queue so the usage webhook retries when your system is down.
- **Authenticated counting.** Sign the events the add-on sends, so fake counts can be rejected.
- **Containers, monitoring and alerts.** A Dockerfile, an uptime monitor, an alert on errors and on the daily cap being reached.
- **Reading documents, with consent and a privacy review.** We did not build this on purpose.
- **Other programs.** The Small Business program is in the knowledge base only as a labeled "different program"; supporting it fully means new rules and a new form mapping.

# 12. Day-one checklist for Invest Detroit

- [ ] A named owner for the copilot, with access to every account below
- [ ] Your own AI account and key, in the host's settings only (never in code, chat or email)
- [ ] A monthly budget limit set at the AI provider, and `ASSISTANT_DAILY_LIMIT` set deliberately
- [ ] A host chosen for the service (always-on, HTTPS), `ALLOWED_ORIGINS` set to your exact website address
- [ ] A Postgres database, if you want counts to survive restarts, and a way to get counts into your system (section 5)
- [ ] A copy of `copilot.js` reviewed by your web team and hosted by you
- [ ] The hidden summary field added in FormAssembly and `data-summary-field` set
- [ ] The form's field codes checked against the mapping; the tests re-run
- [ ] A practice page tested on your real theme and plugins, on a phone as well as a computer
- [ ] Legal and IT sign-off on chat text going to the AI provider
- [ ] Staff read the 17 review rules and the knowledge base facts, and confirm them
- [ ] A person assigned to update facts when a flyer or rate changes
- [ ] Our class key removed and any test data deleted
- [ ] The live-AI test set run and recorded

# 13. Words used in this guide

| Word | Meaning here |
|---|---|
| **Service / backend** | The small program on a server that answers chat questions and keeps counts |
| **Add-on** | The script that adds the copilot to your form in the visitor's browser |
| **AI provider** | The company whose AI model answers questions (OpenAI in our pilot) |
| **Gateway** | A middle service some organizations run between an app and the AI provider. Ours was the university's |
| **Key** | A secret password that lets the service use an AI account. Never put one in a web page |
| **Knowledge base** | The library of Invest Detroit facts given to the AI with each question |
| **Token** | A small piece of text, the unit AI providers charge by (roughly three quarters of a word) |
| **Postgres** | A common database. Optional here; it keeps counts across restarts |
| **Webhook** | The service sending a small message to your system when something happens |
| **CORS / allowed websites** | The rule that tells browsers which websites may call the service |
| **Cold start** | The delay when a sleeping service wakes for the first visitor |
| **HTTPS** | The secure version of a web address. Required here |

*Everything in this guide was written for the project as built in November 2026. Numbers (tests, costs, counts of sources and entries) come from the project's files and tests at that time. Cost figures are estimates. All sample data used in the project was made up.*
