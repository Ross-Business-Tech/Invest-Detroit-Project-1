# Read me first: the `claude/amazing-heisenberg-brezgi` branch

This is a plain-language guide to another team session's work, the Invest Detroit Application Copilot. It is not on `development` yet. The branch's own `README.md` has the full technical detail; this page is the short version.

## What the project is

An Invest Detroit loan application helper. Applicants fill in the Real Estate/C&I In-Take Form, and the copilot helps them get it right the first time.

## What it does

1. **Practice form.** A copy of the real form, with the same sections and questions.
2. **Review My Application.** A button above Submit lists problems to fix, items to double-check, and tips. It uses fixed rules, so it gives the same answer every time.
3. **Chat assistant.** A "Need help?" chat answers questions about the form. Invest Detroit facts come only from its own documents, with the source shown.
4. **Submit.** Submitting sends a short summary of what was flagged to staff.

## What it does not do

- It never approves loans, judges eligibility, or gives anyone's rate or terms.
- It does not give legal or tax advice.
- Staff make all of those decisions.

## How well it works (as reported on the branch)

- Test score: 42 of 43 on the team's test set.
- The one known miss is a question about whether a ZIP code is inside Detroit's city limits.
- Common mistakes caught: about 10 of 10 in the team's comparison, versus 2 of 10 with today's Submit checks alone.

## Open items before it could go live

- Invest Detroit needs to name an owner for the knowledge base and prompt.
- The chat needs its own AI key added in Render, which Invest Detroit would set up.
- Invest Detroit staff need to confirm the facts in the knowledge base.
- Next step on their list: a 30-day trial on Invest Detroit's real FormAssembly form.

## Things to know before you change it

- The branch's README includes the full instructions given to the AI. Because this repository is public, anyone can read them. Ask the team whether that should stay.
- The branch has its own `README.md`, `docs/` folder, and `server/` folder. Work on it in its own session so changes don't collide.
- This branch is newer than `development`. Merging it is a decision for the team, and it should go through a pull request.

## Where to look

- Full technical README: the branch's `README.md`
- Project overview: the branch's `docs/PROJECT-OVERVIEW.md`
- Setup and hosting: the branch's `docs/AI-SETUP.md`
- Hand-off package for Invest Detroit: the branch's `docs/handoff/`
