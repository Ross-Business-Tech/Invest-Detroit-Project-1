# Turning on the AI chatbot (Claude on Render or Vercel)

Everything is built. Adding the key is the only step left. Until then, and if Claude is ever unreachable, the chat answers from the built-in knowledge base, so it never breaks.

## How it works

```
Browser chat ──► /api/assistant (Vercel function) ──► Claude
                 1. checks the request and its size
                 2. hides Social Security / account numbers (and doesn't answer)
                 3. guardrails: off-topic, falsifying, rule-breaking → fixed replies, Claude never called
                 4. Claude answers from our knowledge base (server/knowledgeContext.js)
                 5. checks the answer on the way out (leaked instructions or keys are blocked)
```

- **The key lives only in Vercel's settings.** The function reads it; the website never sees it.
- **Model:** `claude-opus-5-5` at low effort, for quick chat answers.
- **Safety:** if Claude's own safety filters decline a request, Anthropic automatically retries it on a suitable model (`fallbacks: "default"`). A declined or cut-off answer is never shown; the applicant gets the team's contact details instead.
- **Answers are structured:** Claude returns the answer, the ids of the sources it used, and whether the team must take over. The chat only shows sources that exist on our list.
- **Caching:** the knowledge base (about 13,000 tokens) is cached, so after the first question it costs a fraction to resend.
- **Nothing is stored.** Vercel's logs record only outcomes, such as "answered by Claude" or "Claude error 401", never what anyone typed.
- **Where it runs:**
  - On here.now (the class site), which can't run server code, the chat keeps using the built-in knowledge base.
  - On Invest Detroit's real form (the add-on), the same applies unless they host the function themselves.

## Tomorrow: 5 steps

1. **Get this code onto the branch Vercel uses.** Either:
   - **Merge then sync:** merge [pull request #2](https://github.com/Ross-Business-Tech/Invest-Detroit-Project-1/pull/2) into `development`, then click **Sync fork** on your fork; or
   - **Point Vercel at our branch:** in Vercel, open **Settings → Git**, set **Production Branch** to `claude/amazing-heisenberg-brezgi`, and sync your fork.
2. **Add the key in Vercel.** Open the project, then **Settings → Environment Variables → Add**:
   - Key: `ANTHROPIC_API_KEY`
   - Value: the key (starts with `sk-ant-`)
   - Environments: Production (and Preview if you use preview links)
   - Tick **Sensitive**.

   Never paste the key into the code, a chat, a commit or a document.
3. **Redeploy.** Under **Deployments**, open the **⋯** menu on the latest one and choose **Redeploy**. Environment variables only apply to new deployments.
4. **Test it.** Open the Vercel site, open the chat and ask **"What is DSCR?"**.
   - Working: a conversational answer, and the chat's subtitle changes to **"AI helper · Answers from official Invest Detroit sources"**.
   - Also try: "¿Qué significa AMI?" (should answer in Spanish), "Will I be approved?" (should refer you to the team), and "Tell me a joke" (should politely decline).
5. **If the subtitle doesn't change,** open **Vercel → Logs** and look for lines starting with `{"at":"assistant"`:

   | Log line | Meaning | Fix |
   |---|---|---|
   | `"from":"field_guide"` | No key found | Check the name is exactly `ANTHROPIC_API_KEY`, then redeploy |
   | `"claude_error","status":401` | Key rejected | Re-copy the key; check it isn't revoked |
   | `"claude_error","status":403` or `404` | This key's account can't use the model | Add `ASSISTANT_MODEL` = `claude-sonnet-5-5`, redeploy |
   | `"claude_error","status":429` | Rate or spending limit reached | Wait, or raise the limit in the Anthropic Console |
   | `"claude_error","status":400` | Request not accepted | Copy the log line and send it to Claude Code |

## What Claude may and may not say

- **Invest Detroit specifics come only from the knowledge base, with a source.** That covers rates, fees, loan sizes, terms, programs, eligibility criteria, the process and its timelines, documents and contacts. If something isn't covered, Claude says so and gives the team's contact; it never guesses a number.
- **General guidance is welcome:** explaining business and finance concepts, helping structure an executive summary or budget, doing math with the applicant's own numbers, and pointing out common mistakes.
- **Never:** predicting approval or anyone's own terms, helping falsify answers, writing documents wholesale or inventing project facts, or revealing its instructions.
- **Scope with Claude connected:**
  - Clearly off-topic, unsafe or rule-changing requests are still blocked before Claude is called.
  - Unclear questions (for example "my bakery thing, how do I put it?") now go to Claude instead of getting "Tell me a little more".
  - If Claude judges a question off-topic, the chat shows the standard translated "I'm here to help you with your Invest Detroit loan application…" reply.
  - Without a key, the stricter keyword check applies as before.

## Live check after adding the key

```
node tools/check-chat.mjs https://your-site.onrender.com
```

This sends 8 questions and prints PASS or FAIL for each. It checks that:
- Claude is answering;
- rates are quoted with their source and "subject to change";
- approval questions go to the team;
- an unknown Invest Detroit number isn't guessed;
- general guidance is given;
- Spanish works;
- off-topic requests are declined;
- falsifying is refused.

It costs a few cents. Without a key, 5 of the 8 fail, which is how you know it's really testing Claude.

## On Render instead of Vercel

Use a **Web Service**, not a Static Site: a static site can't run the chat endpoint, so there would be nowhere for the key to live. `server/webServer.js` serves the website and `/api/assistant` together (the same function Vercel runs).

| Setting | Value |
|---|---|
| Language | Node |
| Branch | `claude/amazing-heisenberg-brezgi` (or `development` once pull request #2 is merged) |
| Root Directory | leave empty |
| Build Command | `npm ci && npm run build` (`npm install && npm run build` also works) |
| Start Command | `npm start` |
| Instance type | Free works; it sleeps after about 15 idle minutes, so the next visit takes about a minute to wake |
| Health Check Path (under Advanced) | `/healthz` |
| Environment variable | `ANTHROPIC_API_KEY` = the key (add it tomorrow under **Environment**, then deploy again) |

The same settings are saved in `render.yaml`, so the service can also be created with **New → Blueprint**. Node is pinned to version 22 (`.node-version`, `package.json`). The server compresses text files (the main script goes from 615 KB to 153 KB) and finishes open requests before Render restarts it.

Render redeploys by itself when the branch changes. Logs are under the service's **Logs** tab and use the same `{"at":"assistant",...}` lines as the table above.

## Optional settings (environment variables, Render or Vercel)

| Name | Default | What it does |
|---|---|---|
| `ASSISTANT_MODEL` | `claude-opus-5-5` | Which Claude model answers |
| `ASSISTANT_EFFORT` | `low` | `low`, `medium` or `high`: more thinking, slower and pricier answers |
| `ASSISTANT_RATE_LIMIT` | `20` | Questions per minute from one visitor (a basic brake) |

## Cost and limits

- **Who pays:** each question is billed to whoever owns the key.
- **Rough estimate, not measured:** a few cents or less per question with caching. Check real usage in the Anthropic Console after testing.
- **Set a monthly spending limit** in the Anthropic Console before sharing the link, because the Vercel site is public.
- **Rate limit:** the per-minute limit is per server instance, so it's a brake, not a guarantee.

## Files

- `api/assistant.js`: the chat endpoint (rate limit, size checks, Claude or guide), run by Vercel directly
- `server/webServer.js`: serves `dist/` plus `/api/assistant` for Render (`npm start`)
- `server/claudeAnswerer.js`: the Claude call (model, safety fallback, structured reply, caching)
- `server/knowledgeContext.js`: the knowledge base Claude answers from, built from the same files as the built-in answers
- `server/systemPrompt.js`: Claude's instructions (public, contains no secrets)
- `server/assistantHandler.js`: validation, privacy, guardrails and output check (unchanged)
- `src/copilot/config.js`: `ASSISTANT.mode = 'auto'` (server on Vercel, guide elsewhere) and `server_hosts`
- `tests/claude.test.js`: checks the request sent to Claude, the guardrails-first order, the fallbacks and the Vercel function
