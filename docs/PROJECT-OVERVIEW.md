# AI Application Copilot for Invest Detroit

> Earlier, longer project overview (kept for the build team). The one-page README for whoever maintains the tool is [../README.md](../README.md).

A student prototype built during the Business+Tech AI Sprint. It explores how AI could make Invest Detroit loan applications easier to understand and more complete on the first try, so applicants get fewer follow-up calls and emails and staff spend less time chasing missing details.

> **This is not the official Invest Detroit website.** It is a practice copy for testing ideas. All sample data is made up, and nothing entered in the form is sent anywhere.

## What it does

The app is a practice copy of Invest Detroit's **"Need Support?"** page, which hosts the **Real Estate/C&I In-Take Form**, with two helpers built in:

| Feature | What the applicant sees | Status |
|---|---|---|
| **Practice intake form** | Every section and question from the real form, in the same order. Follow-up questions appear only when they apply (for example, choosing "Mixed Use" opens the Retail and Residential sections). | Done |
| **Review My Application** | A button above Submit runs 5 checks with a progress bar. It lists anything to fix, each with a "Go to field" link. A clean review shows a green "✓ Review successful". | Done |
| **Submit locked until review passes** | Submit stays greyed out until a successful review and locks again if an answer changes. Submitting shows a "Submitted successfully" pop-up. | Done |
| **Chat assistant** | A "Need help?" button in the corner opens a chat that knows which question you're on. It answers from the field guide and Invest Detroit's own documents (program flyers, lending guide), with a source. It can quote published rate and fee ranges ("subject to change"), but "Will I be approved?" always goes to staff, and it says when it doesn't know. **Guardrails** keep it on the application: unrelated requests (jokes, essays, trivia, code) get a fixed polite redirect, requests to falsify information get an accuracy reminder, and attempts to change its rules are ignored. It hides and warns about anything that looks like a Social Security Number. | Works without AI; a real AI can be connected later |
| **"?" on each question** | The questions people most often get wrong have a "?" button that opens the chat already explaining that question. | Done |
| **Field guide** | Plain-language explanation, example, common mistakes and source for about 40 questions, plus general topics like documents and saving. Written by the team as a draft for Invest Detroit to approve. English only for now. | Draft |
| **Before you start** | A checklist above the form of the documents and numbers to gather first, since the form can't be saved partway through. | Done |
| **Rating card** | After two answered questions, a small card under the chat asks for a 1–5 star rating. Only the rating, a random ID and the time are saved. | Done (saves on here.now sites) |
| **Document-upload preview** | After you attach a development budget, a clearly labeled demo card shows how a future version could suggest an answer from your file, with Accept / Edit / Leave blank. It never opens your file. | Mock-up |
| **Language dropdown** | Switch the whole page between English, Español, العربية, বাংলা and 简体中文 (Invest Detroit's site offers the first four; Chinese is our addition). Arabic reads right to left. The translations are AI-drafted and not yet professionally reviewed, and the page says so. | Done |
| **Add-on for the real website** | One script file that adds the review panel and chat to Invest Detroit's real FormAssembly form. It turns itself off safely if anything goes wrong. Try it on `/embed-test/`. | Built; not yet on their site |

### What the review checks

Only fixed rules are used, with no AI. Only real problems block Submit.

- **Must fix:** required questions left blank, wrong formats (zip code, state, email, numbers), missing required documents or acknowledgements, and a loan request bigger than the total budget.
- **Must fix:** a Community Development Organization share over 100%.
- **Please double-check:**
  - affordable (AMI) units that don't add up to total housing units;
  - net square footage bigger than gross;
  - an empty section for the chosen real estate type;
  - a "Yes" to the 10% contribution when the loan covers more than 90% of the budget;
  - ethnicity or gender counts that don't add up to the number of owners;
  - a total budget so small it may be missing zeros.
- **Good to know:** what answering "No" to the 10% cash or equity contribution means, and a tip when the project summary is very short.

## Try it

Ask the team for the latest test link, or open the team's dev site.

1. Tap **Fill with sample applicant** at the top of the form.
2. Attach any file to the 3 required documents.
3. Tick the 3 boxes at the bottom.
4. Press **Review My Application**, then **Submit**.

To see the review catch mistakes, change the loan amount to more than the total budget and review again.

## Safety and privacy choices

- **Social Security Number:** the field appears where the real form has it, but it is greyed out and can't be typed in. The chat also hides anything that looks like an SSN.
- **Staff names:** the "which team member are you working with" list uses placeholders instead of real names.
- **No real data:** sample applicants are fictional. Never enter real personal information.
- **No decisions:** the assistant explains questions and points to resources. It never approves loans, scores credit or decides eligibility.
- **Public repository:** everything here, including commit messages, can be read by anyone.

## Project plan

1. Practice form — done
2. Rule-based review — done
3. Field guide and "Before you start" checklist — done (the guide is a draft for Invest Detroit to approve, English only)
4. Chat assistant — answers from the field guide today; connecting a real AI needs an AI key added by the instructor in here.now
5. "Possible misunderstanding" checks — the ones plain rules can do are done; AI-based checks need the AI key and must never block Submit
6. Mock-up of document upload — done ("Talk to a person" was removed)
8. Guardrails — done in the browser and in a reference server handler; production needs that handler hosted by Invest Detroit
7. Add-on for Invest Detroit's real form — built and tested on a copy; needs Invest Detroit to install it

## For the team

- New here? Start with [START-HERE.md](../START-HERE.md). Ready-made prompts are in [PROMPTS.md](../PROMPTS.md).
- Built with React and Vite, hosted on here.now as a static website.
- How it's built, and how to connect it to Invest Detroit's real website: [docs/ARCHITECTURE.md](ARCHITECTURE.md).
- Where things live:
  - `src/copilot/`: the copilot itself, with no screen code (field definitions, review rules, assistant client, privacy rules, translations, and the connector for Invest Detroit's real FormAssembly form)
  - `src/embed/`: the add-on script for Invest Detroit's live page (built to `dist/embed/copilot.js`)
  - `src/components/`: the review panel and chat window
  - `src/copilot/fieldGuide.js`: the draft field guide the chat answers from
  - `src/prototype/`: our copy of the form, the checklist, the upload demo and the fictional sample applicant
  - `src/copilot/guardrails/`: what the chat will and won't answer
  - `server/`: reference backend that enforces the guardrails for direct API requests (not deployed on here.now)
  - `tests/`: automated checks; run `npm test`
