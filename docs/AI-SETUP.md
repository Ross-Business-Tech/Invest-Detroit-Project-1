# Turning on the AI chatbot (OpenAI on Render)

Everything is built. Adding the key in Render is the only step left. Until then, and whenever OpenAI can't be reached, the chat answers from the built-in knowledge base, so it never breaks.

## How it works

```
Browser chat ──► /api/assistant (our server on Render) ──► OpenAI
                 1. checks the request and its size
                 2. hides Social Security / account numbers (and doesn't answer)
                 3. guardrails: off-topic, falsifying, rule-breaking → fixed replies, OpenAI never called
                 4. OpenAI answers from our knowledge base (server/knowledgeContext.js)
                 5. checks the answer on the way out (leaked instructions or keys are blocked)
```

- **The key lives only in Render's settings.** The server reads it; the website never sees it.
- **Model:** `gpt-6.1-sol` at low reasoning effort, for quick chat answers. Change it with `OPENAI_MODEL` (see below).
- **Answers are structured:** OpenAI must return the answer, the ids of the sources it used, whether the team must take over, and whether the question was in scope (a strict JSON format). The chat only shows sources that exist on our list.
- **Declined or cut-off answers are never shown.** The applicant gets the team's contact details instead.
- **Caching:** the instructions and knowledge base (about 14,000 tokens) are the same for every question, so OpenAI caches them automatically, which makes repeat questions cheaper and faster.
- **Nothing is stored.**
  - The request is sent with `store: false`, so OpenAI doesn't keep it for later retrieval.
  - Our logs record only outcomes, such as "answered by openai" or "ai_error 401", never what anyone typed.
- **Where it runs:** the add-on on Invest Detroit's real form uses the built-in guide unless Invest Detroit hosts this server. here.now can't run server code at all.

**About "Codex" keys:** Codex is OpenAI's coding product, but its API keys are ordinary OpenAI API keys. They usually start with `sk-proj-` and work with OpenAI's general models. If the key's project is limited to certain models, the chat falls back to the guide, and the logs show `403` or `404` (see the table below). Then set `OPENAI_MODEL` to a model the key allows.

## Using a U-M GPT Toolkit key ("Codex" / "Codex for the Classroom")

The University of Michigan's Codex keys only work through U-M's own gateway, not directly with OpenAI. Sending one straight to OpenAI gives `401 invalid_api_key`. Add these in Render next to the key, using the values from U-M's "Codex Setup" guide:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | your Toolkit key |
| `OPENAI_BASE_URL` | `https://api.toolkit.umgpt.umich.edu/v1` |
| `OPENAI_MODEL` | `gpt-5.6-terra` |

- **Rejected settings:** if the gateway rejects an optional setting (reasoning effort, caching key or `store`), the server retries without it and logs `openai_setting_unsupported`.
- **Course rules:** check that your course allows using the key for this project.
- **Budget:** the key's monthly budget is shared with your coursework, and the site is public. Lower `ASSISTANT_DAILY_LIMIT` (for example to `100`).
- **Before handover:** Invest Detroit needs its own key; remove the class key from their copy.

## Turn it on: 4 steps

1. **Add the key in Render.** Open the web service, then **Environment → Add Environment Variable**:
   - Key: `OPENAI_API_KEY`
   - Value: the key

   Never paste the key into the code, a chat, a commit, a slide or a document.
2. **Save and deploy.** Choose **Save, rebuild, and deploy** (or **Manual Deploy → Deploy latest commit**).
3. **Test it.** Open the site, open the chat and ask **"What is DSCR?"**.
   - Working: you get a conversational answer, and the chat's subtitle changes to **"AI helper · Answers from official Invest Detroit sources"**.
   - Then run the live check below.
4. **If the subtitle doesn't change,** open Render's **Logs** tab and look for lines starting with `{"at":"assistant"`:

   | Log line | Meaning | Fix |
   |---|---|---|
   | `Site and assistant on port … (no API key: field-guide answers)` | No key found | Check the name is exactly `OPENAI_API_KEY`, then deploy again |
   | `"ai_error","provider":"openai","status":401` | Key rejected | Re-copy the key; check it isn't revoked |
   | `"status":403` or `404` | This key can't use the model | Add `OPENAI_MODEL` with a model the key's project allows (ask whoever issued the key), then deploy |
   | `"status":429` | Rate limit, or the account's budget or credit ran out | Wait, or add credit or raise the budget in the OpenAI dashboard |
   | `"status":400` | Request not accepted | The line includes a short `detail`; copy the line (it never contains the key) and send it to Claude Code |
   | `"status":null` | OpenAI couldn't be reached | Usually temporary; try again |

   The `/insights` page also has an **AI service errors** table with the same status codes.

## Live check after adding the key

```
node tools/check-chat.mjs https://your-site.onrender.com
```

This sends 8 questions and prints PASS or FAIL for each. It checks that:
- the AI service is answering;
- rates are quoted with their source and "subject to change";
- approval questions go to the team;
- an unknown Invest Detroit number isn't guessed;
- general guidance is given;
- Spanish works;
- off-topic requests are declined;
- falsifying is refused.

It costs a few cents. Then **rerun the test set** (`node tools/run-test-set.mjs`) and update the score everywhere if it changes (README, deck, results sheet, user guide).

## What the AI may and may not say

- **Invest Detroit specifics come only from the knowledge base, with a source.** That covers rates, fees, loan sizes, terms, programs, eligibility criteria, the process and its timelines, documents and contacts. If something isn't covered, the AI says so and gives the team's contact. It never guesses a number.
- **General guidance is welcome:** explaining business and finance concepts, helping structure an executive summary or budget, doing math with the applicant's own numbers, and pointing out common mistakes.
- **Never:**
  - predicting approval or anyone's own terms;
  - helping falsify answers;
  - writing documents wholesale or inventing project facts;
  - revealing its instructions.
- **Scope with the AI connected:**
  - Clearly off-topic, unsafe or rule-changing requests are still blocked before OpenAI is called.
  - Unclear questions (for example "my bakery thing, how do I put it?") go to the AI instead of getting "Tell me a little more".
  - If the AI judges a question off-topic, the chat shows the standard translated "I'm here to help you with your Invest Detroit loan application…" reply.
  - Without a key, the stricter keyword check applies.

The instructions are in `server/systemPrompt.js` and are the same whichever AI service answers.

## Render settings

Use a **Web Service**, not a Static Site. A static site can't run the chat endpoint, so there would be nowhere for the key to live. `server/webServer.js` serves the website and `/api/assistant` together.

| Setting | Value |
|---|---|
| Language | Node |
| Branch | `claude/amazing-heisenberg-brezgi` (or `development` once pull request #2 is merged) |
| Root Directory | leave empty |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance type | Free works, but it sleeps after about 15 idle minutes, so the next visit takes about a minute to wake. Starter (about $7 a month) stays awake. |
| Health Check Path (under Advanced) | `/healthz` |
| Environment variable | `OPENAI_API_KEY` = the key |

The same settings are saved in `render.yaml`, so the service can also be created with **New → Blueprint**. Node is pinned to version 22. Render redeploys by itself when the branch changes.

Vercel also works (`vercel.json`, `api/*.js`). There, add the same environment variables under **Settings → Environment Variables**, then redeploy.

## Insights, ratings and limits

| What | How to turn it on |
|---|---|
| **Keep counts across restarts** | Create a Render Postgres database (**New → Postgres**), then add its **Internal Database URL** to the web service as `DATABASE_URL`. Without it, counts live in memory and reset whenever the free server sleeps. |
| **Insights dashboard** | Add `INSIGHTS_PASSWORD` (any password you choose), then open `https://your-site.onrender.com/insights`. The browser asks for a username (anything) and the password. |
| **Steady per-visitor limits** | Add `ASSISTANT_SALT` (any long random text) so visitor counts survive restarts. |
| **Spending cap** | In the OpenAI dashboard, set a monthly budget for the key's project (under the organization or project limits). This is the one cap no one can get around. |

The dashboard shows:
- forms started and submitted, and where people stopped;
- the most common review findings;
- which questions people needed help with;
- chat outcomes, who answered (`openai` or the built-in guide), and what the guardrails stopped;
- star ratings, limits reached and AI service errors.

**It stores counts only:** no messages, answers, notes, names or IP addresses. Visitors are counted by a one-way hash that changes daily.

**Daily limits:** after `ASSISTANT_VISITOR_DAILY` AI answers for one visitor (default 60), or `ASSISTANT_DAILY_LIMIT` for the whole site (default 500), the chat answers from the built-in guide until the next day.

## Optional settings (environment variables)

| Name | Default | What it does |
|---|---|---|
| `OPENAI_MODEL` | `gpt-6.1-sol` | Which OpenAI model answers. A cheaper option is `gpt-6-luna`; `gpt-5-mini` also works. |
| `OPENAI_EFFORT` | `low` | Reasoning effort: `none`, `minimal`, `low`, `medium` or `high`. Higher is slower and pricier. Models that don't take this setting are retried once without it, automatically. |
| `ASSISTANT_RATE_LIMIT` | `20` | Questions per minute from one visitor (a basic brake) |
| `ASSISTANT_VISITOR_DAILY` | `60` | AI answers per visitor per day |
| `ASSISTANT_DAILY_LIMIT` | `500` | AI answers per day for the whole site |
| `ASSISTANT_SALT` | random at start | Keeps visitor counting steady across restarts |
| `DATABASE_URL` | none | Postgres for counts, ratings and limits |
| `INSIGHTS_PASSWORD` | none (dashboard off) | Password for `/insights` |
| `ANTHROPIC_API_KEY` | none | Optional alternative: Claude answers instead when no OpenAI key is set (or when `AI_PROVIDER=anthropic`). Its model is set with `ASSISTANT_MODEL` (default `claude-opus-5-5`). |

## Cost

- **Who pays:** each question is billed to whoever owns the key.
- **Estimate, not measured:** about $0.01–$0.04 per question with `gpt-6.1-sol`, depending on how much of the knowledge base is served from the cache. At 500 questions a month, that is about $5–$20.
  - This is based on third-party price lists (about $2 per million input tokens and $10 per million output tokens), because OpenAI's own pricing page couldn't be opened from the build environment.
  - Check the real usage in the OpenAI dashboard after testing.
- **Set a monthly budget** in the OpenAI dashboard before sharing the link, because the site is public.
- **Rate limit:** the per-minute limit is per server, so it's a brake, not a guarantee.

## Files

- `server/aiProvider.js`: picks the AI service from the keys that are set
- `server/openaiAnswerer.js`: the OpenAI call (model, strict reply format, caching, timeout, reasoning retry)
- `server/modelReply.js`: the reply format and checks shared by every AI service
- `server/claudeAnswerer.js`: the optional Claude alternative
- `server/knowledgeContext.js`: the knowledge base, built from the same files as the built-in answers
- `server/systemPrompt.js`: the AI's instructions (public, contains no secrets)
- `server/assistantHandler.js`: validation, privacy, guardrails and the output check
- `api/assistant.js`: the chat endpoint (rate limit, daily limits, AI or guide)
- `server/webServer.js`: serves `dist/` plus `/api/*` on Render (`npm start`)
- `tests/openai.test.js`: checks the request sent to OpenAI, guardrails first, refusals and cut-offs, the reasoning retry, and the fallback when a key is wrong
