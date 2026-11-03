# AI Application Copilot for Invest Detroit

A student prototype built during the Business+Tech AI Sprint. It explores how AI could make Invest Detroit loan applications easier to understand and more complete on the first try, so applicants get fewer follow-up calls and emails and staff spend less time chasing missing details.

> **This is not the official Invest Detroit website.** It is a practice copy for testing ideas. All sample data is made up, and nothing entered in the form is sent anywhere.

## What it does

The app is a practice copy of Invest Detroit's **"Need Support?"** page, which hosts the **Real Estate/C&I In-Take Form**, with two helpers built in:

| Feature | What the applicant sees | Status |
|---|---|---|
| **Practice intake form** | Every section and question from the real form, in the same order. Follow-up questions appear only when they apply (for example, choosing "Mixed Use" opens the Retail and Residential sections). | Done |
| **Review My Application** | A button above Submit runs 5 checks with a progress bar. It lists anything to fix, each with a "Go to field" link. A clean review shows a green "✓ Review successful". | Done |
| **Submit locked until review passes** | Submit stays greyed out until a successful review and locks again if an answer changes. Submitting shows a "Submitted successfully" pop-up. | Done |
| **AI assistant chat** | A "Need help?" button in the corner opens a chat window that knows which question you're on. It hides and warns about anything that looks like a Social Security Number. | Window done; AI not connected yet |
| **Field guide** | Plain-language explanation, example and official source link for each question, used by the assistant. | Next |

### What the review checks

Only fixed rules are used, with no AI. Only real problems block Submit.

- **Must fix:** required questions left blank, wrong formats (zip code, state, email, numbers), missing required documents or acknowledgements, and a loan request bigger than the total budget.
- **Please double-check:** affordable (AMI) units that don't add up to total housing units, net square footage bigger than gross, and an empty section for the chosen real estate type.
- **Good to know:** what answering "No" to the 10% cash or equity contribution means.

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
3. Field guide and "Before you start" checklist — next
4. Connect the AI assistant, which needs an AI key added by the instructor in here.now
5. AI review checks (for example, "Is this a monthly amount?"), which never block Submit
6. Mock-ups (document upload, "Talk to a person") and polish

## For the team

- New here? Start with [START-HERE.md](START-HERE.md). Ready-made prompts are in [PROMPTS.md](PROMPTS.md).
- Built with React and Vite, hosted on here.now as a static website.
- How it's built, and how to connect it to Invest Detroit's real website: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Where things live:
  - `src/copilot/`: the copilot itself, with no screen code (field definitions, review rules, assistant client, privacy rules, and the connector for Invest Detroit's real FormAssembly form)
  - `src/components/`: the review panel and chat window
  - `src/prototype/`: our copy of the form and the fictional sample applicant
  - `tests/`: automated checks; run `npm test`
