# Getting the copilot's data into Invest Detroit's own system

For Invest Detroit's data team. The copilot has **no dashboard of its own**: Invest Detroit reads its data into its own system. There are two kinds of data, and each already has a home.

| Data | Where it goes | How to get it into your system |
|---|---|---|
| **The application itself:** every answer and file, plus the **staff summary** (review findings and the applicant's notes) | FormAssembly, exactly as today | Your existing FormAssembly integration. The staff summary is one more field on the form: the hidden field from [FORMASSEMBLY-INTEGRATION.md](FORMASSEMBLY-INTEGRATION.md), step 2. Map it like any other field. |
| **Usage counts** (forms started and submitted, where people stop, review findings, ? presses, chat topics and outcomes, star ratings, AI errors) | The copilot server's database | Any of the four ways below |

The usage counts are anonymous **counts by day and category**. They never include an answer, a chat message, a note, a name, a file or an IP address. Each one is a **category**, an **item** and a **number**, for example `review_issue` / `loan_gt_budget` / `3`.

## Four ways to collect the usage counts

Pick whichever fits your pipeline. They can be combined, and all are off until you turn them on, except the first.

### 1. Read the database directly

With `DATABASE_URL` set on the Render service (a Render Postgres database), counts are in one table:

```sql
CREATE TABLE copilot_counts (
  day   date    NOT NULL,   -- UTC day
  key   text    NOT NULL,   -- "category:item", e.g. "review_issue:loan_gt_budget"
  count integer NOT NULL,   -- how many that day
  PRIMARY KEY (day, key)
);
```

- **Internal rows:** keys starting with `visitor:`, and the key `ai:daily`, are the copilot's own daily spending limits (visitors appear only as a one-way hash that changes daily). Skip them.
- **History:** rows older than 400 days are deleted automatically.
- **Read-only access:** use a separate read-only database user for your pipeline.

### 2. Pull a JSON export on a schedule

Set `USAGE_EXPORT_TOKEN` on the Render service (a long random secret), then call:

```
GET https://<copilot-server>/api/usage?days=30
Authorization: Bearer <USAGE_EXPORT_TOKEN>
```

```json
{
  "from": "2026-11-01", "to": "2026-11-30",
  "rows": [
    { "day": "2026-11-13", "category": "review_issue", "item": "loan_gt_budget", "count": 3 },
    { "day": "2026-11-13", "category": "rating", "item": "5", "count": 2 }
  ]
}
```

- **Days:** `days` can be 1–400; the default is 30.
- **Re-running is safe:** the same day can be read again, and its counts only grow, so replace that day's rows (upsert by day + category + item).
- **Turned off:** without the token setting the export is off (404); with a wrong token it's refused (401). Internal rows are left out.

### 3. Receive each new count as it happens (webhook)

Set `USAGE_WEBHOOK_URL` to an address in your system that accepts JSON `POST`s. Every few seconds the server sends the new counts:

```json
{
  "source": "invest-detroit-copilot",
  "sent_at": "2026-11-13T20:27:56.883Z",
  "events": [
    { "day": "2026-11-13", "category": "field_help", "item": "total_budget", "added": 1 }
  ]
}
```

- **`added`** is how much to add to that day's count.
- **Signing:** set `USAGE_WEBHOOK_SECRET` too, and each request carries `X-Copilot-Signature: sha256=<HMAC-SHA256 of the raw body with the secret>`. Check it before accepting.
- **If your system is down,** the batch is dropped, but the counts are still in the database and in the export (ways 1 and 2), so you can fill gaps from there.

### 4. Collect them on investdetroit.com itself (no copilot server needed)

The add-on announces each count on the page as a browser event:

```js
window.addEventListener('investdetroit:copilot', (e) => {
  // e.detail = { type: 'review_issue', key: 'loan_gt_budget' }
  // e.g. forward it to your analytics or Google Tag Manager's dataLayer
})
```

This works whether or not counts are also sent to the copilot server. To stop sending them to the server and use only your own collection, add `data-events-endpoint="none"` to the script tag.

## What each category means

| Category | Item | Counted when |
|---|---|---|
| `form` | `start` / `submit` | An applicant starts typing / submits |
| `form_exit` | section id (e.g. `business_info`) | The page closes before Submit: the first unfinished section |
| `review_result` | `passed` / `blocked` | A review finishes |
| `review_issue` | issue id (e.g. `loan_gt_budget`) | A review finds that issue (see `src/copilot/review.js`) |
| `field_help` | question id (e.g. `total_budget`) | Someone presses that question's ? button |
| `chat` | `total` | A chat question is asked |
| `chat_kind` | `answer`, `no_answer`, `out_of_scope`, `integrity`, `privacy_warning`… | How the chat replied |
| `chat_from` | `openai`, `field_guide`, `field_guide_fallback`, `field_guide_limit` | Who answered (AI, built-in guide, guide after an AI error, guide after a daily limit) |
| `chat_field` | question id | The question the applicant was on while chatting |
| `chat_source` | source id (e.g. `re_flyer`) | A source the answer cited (see `src/copilot/config.js`) |
| `guardrail` | category (e.g. `injection`) | The guardrails stopped a request |
| `rating` | `1`–`5` | A chat star rating |
| `limit` | `visitor_daily` / `site_daily` | A daily AI limit was reached |
| `ai_error` | HTTP status or `network` | The AI service failed (401 = wrong key, 403/404 = model not allowed, 429 = rate or budget limit) |

Question ids and section ids are listed in `src/copilot/formDefinition.js`. Their FormAssembly field ids (`tfa_…`) are in `src/copilot/adapters/formAssemblyMap.js`.

## Settings summary (Render → Environment)

| Setting | Needed for |
|---|---|
| `DATABASE_URL` | Keeping counts across restarts (way 1), and steady daily limits |
| `USAGE_EXPORT_TOKEN` | The JSON export (way 2) |
| `USAGE_WEBHOOK_URL`, `USAGE_WEBHOOK_SECRET` | The webhook (way 3) |
| (none) | Page events (way 4) are always on in the add-on |
