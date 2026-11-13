# Putting the copilot on Invest Detroit's real form

This guide is for Invest Detroit's web team, for adding the copilot to the live "Need Support?" page. On that page:
- **WordPress** shows the page;
- **FormAssembly** runs the Real Estate/C&I In-Take Form (form `4907942`);
- **Emma** (myemma.com) handles email marketing.

The copilot is **one script tag** plus a small server. It works on top of the existing FormAssembly form and doesn't replace or rebuild it.

```
 investdetroit.com/need-support (WordPress)
 ┌──────────────────────────────────────────────┐
 │  FormAssembly form 4907942   (unchanged)     │        Copilot server (Render)
 │   + progress bar, ? buttons, notes,          │  ───►  /embed/copilot.js   the add-on
 │     upload tips, Review My Application,      │  ───►  /api/assistant      chat (OpenAI + guardrails)
 │     chat  ← all drawn by the add-on          │  ───►  /api/feedback       star ratings (counts)
 │                                              │  ───►  /api/events         usage counts
 │  Submit → FormAssembly, as today             │        /insights           staff dashboard (password)
 │  (with the staff summary in a hidden field)  │
 └──────────────────────────────────────────────┘
 Emma: not involved (see "Emma" below).
```

## What carries over to the real form

| Feature (demo site) | On the real FormAssembly form | How |
|---|---|---|
| Review My Application; Submit locked until it passes | ✅ Automatic | Panel above FormAssembly's Submit button |
| "My answer is correct: explain why" notes | ✅ Automatic | Included in the staff summary |
| Staff summary for screening staff | ✅ Needs one hidden field | Step 2 below, then `data-summary-field` |
| Chat assistant, AI answers with guardrails | ✅ Automatic | Calls our server; falls back to built-in answers if the server can't be reached |
| **?** button next to each question | ✅ Automatic | Added inside each question's label |
| Notes as questions are answered (loan larger than budget, ZIP/state mismatch…) | ✅ Automatic | Under the question, once the applicant leaves it |
| "About $1.45 million", 10% equity math | ✅ Automatic | Under the money and equity questions. The answer itself isn't changed. |
| Upload tips; empty, oversized or wrong-type file checks | ✅ Automatic | Tip before each required upload. Only the file's name, size and type are read, never its contents. |
| Progress bar with section chips | ✅ Automatic | Sticks to the top of the form; `data-progress-top` makes room for a sticky site header |
| Five languages (incl. Arabic right to left) | ✅ Automatic | Follows the page's language; answers are read by FormAssembly's option codes, so translated pages still work |
| Star ratings, usage insights (`/insights`) | ✅ Automatic | Sent to our server; counts only |
| "Business address is the same as my home address"; state from a Michigan ZIP | ⚙️ Opt-in | `data-fill-helpers="true"`. These fill in answers, so they're off unless turned on. |
| Save & resume | ⚙️ FormAssembly setting | Turn on FormAssembly's own **Save & Resume** for the form (step 3) |
| "What happens next" after Submit | ⚙️ FormAssembly setting | Paste the text below into the form's thank-you message (step 3) |
| "How it works" and "Before you start" | ⚙️ WordPress content | Copy into the page above the form if wanted (step 5) |
| Money boxes adding commas as you type | ❌ Not carried over | It would change what FormAssembly receives, and FormAssembly's number checks may reject commas. The "About $…" note gives the same reassurance. |
| Document "suggestion" mock-up | ❌ Demo only | Never reads files; not part of the add-on |

## Step 1: run the copilot server (Render)

WordPress can't run the copilot's server (WordPress runs PHP; the copilot is Node.js), so the server lives on Render, as in the pilot.
1. Create a Render account for Invest Detroit and a **Web Service** from this repository. `render.yaml` has every setting (see [SETUP.md](SETUP.md)).
2. In the service's **Environment**, set:

   | Key | Value |
   |---|---|
   | `OPENAI_API_KEY` | Invest Detroit's own OpenAI API key |
   | `ALLOWED_ORIGINS` | `https://investdetroit.com,https://www.investdetroit.com` (the default). Add a staging address if you test there. |
   | `INSIGHTS_PASSWORD` | a password for the `/insights` dashboard |
   | `DATABASE_URL` | a Render Postgres database, so counts survive restarts |
   | `ASSISTANT_SALT` | any long random text |
3. Open `https://<your-service>.onrender.com/healthz`; it should say `ok`.

## Step 2: add a hidden field for the staff summary (FormAssembly)

1. In the FormAssembly form builder, add a field to form 4907942 (for example a **Text Area** called "Application Copilot summary") and make it **hidden** (FormAssembly's hidden-field option, so applicants don't see it).
2. Note its ID. It looks like `tfa_1234`; you can find it in the field's settings or the published page's source.
3. Make sure the field reaches staff in the usual way: in the response list, the notification email, or wherever screening staff read applications today.

At Submit, the add-on writes a short English summary into that field:
- whether the review passed;
- each item to double-check, with the applicant's own note;
- the tips shown;
- the language used.

It never includes an SSN. It's sent only inside the application, to FormAssembly, and never to our server.

## Step 3: FormAssembly settings

- **Save & Resume:** turn on FormAssembly's Save & Resume for the form, so applicants can finish later. The demo site's on-device drafts aren't part of the add-on; FormAssembly's version saves on their side and works across devices.
- **Thank-you message:** paste this in (edit as needed):

  > Thank you. Your intake form has been received. A member of the Invest Detroit team will be in touch about next steps.
  >
  > **What happens next** (typical times from Invest Detroit's lending guide; every project is different):
  > 1. **Screening** (1–2 weeks): Invest Detroit reviews mission fit and feasibility.
  > 2. **Term sheet** (2–6 weeks): site visit, credit review and an indicative term sheet.
  > 3. **Commitment** (5–10 weeks): underwriting and committee decision. Approval brings a commitment letter.
  > 4. **Closing** (4–6 weeks): closing checklist, loan documents and funding.
  >
  > Please don't start construction before your loan closes.

## Step 4: add the script tag

```html
<script src="https://<your-service>.onrender.com/embed/copilot.js" defer
        data-summary-field="tfa_1234"
        data-launcher-bottom="84px"></script>
```

- Replace `tfa_1234` with the hidden field's ID from step 2.
- `data-launcher-bottom` lifts the chat button above FormAssembly's spam-check badge.

**Where to put it (one of these):**
- **WordPress (recommended):** on the Need Support page, add a **Custom HTML** block below the form, or use your header/footer code plugin limited to that page.
  - If a caching or optimization plugin combines or delays scripts, exclude `copilot.js` from it.
- **FormAssembly:** the form's own custom-code area (the live form has one: `#code-4907942`). **Use this if the form is ever published as an iframe**: the add-on must run on the same page as the form's fields, so inside an iframe only FormAssembly's custom code can reach them.

**Optional settings:**

| Attribute | What it does |
|---|---|
| `data-progress-top="80px"` | Room for a sticky site header above the progress bar |
| `data-fill-helpers="true"` | Turns on "same as home address" and state-from-ZIP |
| `data-locale="es"` | Fixes the language; otherwise it follows the page's `<html lang>` |
| `data-server="https://…"` | Our server's address, if `copilot.js` is hosted somewhere else |
| `data-server="none"` | No server at all: built-in answers only, no ratings or counts |

**If the site uses a Content Security Policy,** allow the server's address in `script-src` and `connect-src`.

## Step 5: page content (optional, WordPress)

The demo site has "How it works" and "Before you start" sections above the form: the 3 required documents and the numbers to gather. They're page text, not part of the form. If Invest Detroit wants them, copy the wording from the demo site into the WordPress page. The English text is in `src/prototype/howItWorksText.js` and `src/prototype/BeforeYouStart.jsx`.

## Step 6: test before going live

1. **Try the test page first:** `https://<your-service>.onrender.com/embed-test/` is a copy of the form's structure with the add-on loaded, the staff-summary field and the fill helpers on. It shows the summary after Submit.
2. **Then try the real page, ideally on a staging copy first.** Check that:
   - the progress bar and **?** buttons appear;
   - leaving the loan amount larger than the budget shows a note;
   - Review blocks, then unlocks Submit;
   - the chat answers;
   - a test submission shows the summary in the hidden field;
   - `/insights` counts it.
3. **Turning it off:** remove the script tag. If anything ever goes wrong while it's on, the add-on removes itself and unlocks Submit, so the official form keeps working.

**If Invest Detroit edits the form** (new or renamed questions), update `src/copilot/adapters/formAssemblyMap.js` and `src/copilot/formDefinition.js` from the page source, regenerate the test page (`node tools/build-embed-test-page.mjs`), and run `npm test`. Until then, a changed question is simply skipped: its extras don't appear, and the form still works.

## Emma (myemma.com)

Emma is Invest Detroit's email-marketing tool: mailing lists, newsletters and email reports. **The copilot doesn't need Emma, and doesn't send anything to it.**
- **Applicants' contact details and answers** still go only to FormAssembly, exactly as today. If FormAssembly is already connected to Emma (for example to add applicants to a mailing list), that keeps working unchanged. Leave the new staff-summary field **out** of any such connection: it's for screening staff, not marketing.
- **Insights** are anonymous counts (forms started, review findings, chat topics, ratings). They live in the copilot's own database and dashboard, not in a marketing list.
  - To use them in a report, open `/insights` and choose **Download as CSV** (or open `/insights?format=csv`), then use the spreadsheet in Excel or Google Sheets.
- **Never** put chat messages, applicant notes or staff summaries into Emma.

## What to review before going live (privacy and security)

- **The add-on reads mapped answers in the browser** to run its checks. It never reads the SSN field, and never reads file contents.
- **Chat questions go to our server and then to OpenAI,** with Social Security and account numbers removed. Nothing typed in the chat is stored; only counts are.
- **Keys live only in Render's environment settings,** never in the page or the code.
- **The full picture for IT:** see [Invest-Detroit-Copilot-Data-Flow.pdf](handoff/Invest-Detroit-Copilot-Data-Flow.pdf).
