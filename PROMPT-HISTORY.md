# Prompt History

How we built the AI Application Copilot prototype with Claude, one change at a time. Each entry shows what we asked (lightly edited so it reads on its own) and what changed on the page. Only the prompts that changed the app are listed; planning discussions, questions and sharing steps are left out.

Sign-in steps and personal details are left out on purpose, because this repository is public.

## 1. Building the replica page

**1. Build the replica from the real form**
> Build the replica of Invest Detroit's "Need Support?" page that we will add the AI assistant to. *(Pasted the full page source of investdetroit.com/need-support.)*

Result: a replica of the "Need Support?" page with every section and question of the Real Estate/C&I In-Take Form, in the original order. Follow-up questions appear only when they apply, and required fields are checked on Submit. A "Fill with sample applicant" button fills it with fictional data. Real staff names in one dropdown were replaced with placeholders.

**2. Success pop-up *(sent while it was being built)***
> When Submit is pressed, show a pop-up that says "Submitted successfully".

Result: Submit opens a "Submitted successfully" pop-up. Nothing is actually sent.

**3. Keep the SSN field, greyed out *(sent while it was being built)***
> Grey out the SSN field but don't remove it, so the replica stays exact.

Result: the Social Security Number field appears exactly where the real form has it, but it is disabled and can't be typed in.

## 2. Review My Application

**4. Build the review**
> Add a review button at the bottom, above Submit, with a progress bar above it showing the steps of the review. When the bar is full, replace it with "Review successful" in green with a checkmark. Grey out Submit until the review has run.

Result: rule-based checks adapted to the Real Estate form (loan vs. budget, affordable units vs. total units, net vs. gross square footage), shown as:
- A 5-step progress bar: required questions, formats, numbers adding up, project details, documents and acknowledgements.
- A green "✓ Review successful" when nothing blocks the application.
- Otherwise, a grouped list of issues with "Go to field" buttons.
- Submit stays greyed out until a successful review, and greys out again if an answer changes.

## 3. AI assistant

**5. Chat window**
> Add the AI assistant chatbot in the corner. When the user presses it, the chat box pops up. It doesn't have to work yet.

Result:
- A "Need help?" button in the corner that opens a chat window.
- A welcome message, suggested questions, and an "Asking about:" line showing which question you're on.
- A Social Security Number warning that hides the number.
- Placeholder replies until the AI is connected.

## 4. Getting ready for the real website

**6. Integration-ready architecture**
> Can you review and refactor our existing AI application pipeline so that it will be easy to integrate our features into Invest Detroit's actual website and loan application system in the future? Our current application is a prototype, but we want to design the architecture with real-world integration in mind.

Result: no visible changes. Underneath:
- The copilot logic (field definitions, review rules, Submit lock, assistant, privacy rules) moved into a core that doesn't depend on our page.
- Review results now follow the data format from the brief.
- The assistant has a defined request and reply format, with sensitive numbers removed before anything is sent.
- A connector reads Invest Detroit's real FormAssembly form using its actual field IDs. It never reads the SSN field.
- 27 automated tests and an architecture guide (`docs/ARCHITECTURE.md`) were added.

**7. Build the add-on**
> Build the add-on script that adds our features to Invest Detroit's real form page, as far as we can build it now.

Result:
- `npm run build` now also makes **one add-on file** (`dist/embed/copilot.js`). It finds Invest Detroit's FormAssembly form, adds the review panel above its Submit button and the chat button in the corner, and locks Submit until a review passes. It also blocks attempts to get around the lock.
- Its look is **sealed off** from the host page in both directions.
- If anything breaks, it **removes itself and unlocks Submit**, so the official form always works.
- Answers are read by the form's **hidden option codes**, so reviews still work when the page is translated.
- A **test page** (`/embed-test/`) has a plain copy of the real form's structure. It acts out the form loading late, the form's own Submit handler, and a "Simulate Spanish translation" button.
- A phone-layout bug where the chat button covered the form's spam-check badge was found and fixed.

**8. Language dropdown *(sent while the add-on was being built)***
> Add a dropdown near the top of the page that accurately translates the page into the main languages.

Result:
- A language dropdown in the header with **English, Español, العربية (Arabic) and বাংলা (Bengali)**, the same languages Invest Detroit's own site offers.
- Instead of word-by-word machine translation, every piece of text has a written translation: all questions and choices, review messages, the chat, the pop-up and the page itself.
- Arabic switches the page to right-to-left.
- Answers and review rules stay in English underneath, so switching language never breaks a review.
- The choice is remembered on the device.
- A note on translated pages says they were drafted with AI and not yet checked by a professional translator.
- The add-on follows the language of whatever page it's on.

**9. Add Chinese**
> Add a Chinese option to the language dropdown.

Result: **简体中文 (Simplified Chinese)** was added to the language dropdown, with a full translation of every piece of text, like the other languages. Invest Detroit's own site offers English, Spanish, Arabic and Bengali; Chinese is the team's addition.

## 5. Building everything we can

**10. Build what's realistic now**
> Build as much of this application as you realistically can right now, given our current technical constraints, available resources, and existing codebase.

Result: everything in the plan that doesn't need an AI key or Invest Detroit's approval.
- **Field guide (draft):** plain-language help for about 40 questions (explanation, example, common mistakes, source) plus general topics. It never states policy like eligibility, rates or fees. English only for now.
- **A chat that answers without AI:** it answers from the field guide. Eligibility, rate and fee questions always go to staff, and unrelated questions get an honest "I don't have an approved answer".
- **"?" buttons** on the questions the guide covers. They open the chat already explaining that question.
- **More review checks:**
  - a "Yes" to the 10% contribution that the loan amount contradicts;
  - owner counts that don't add up;
  - a CDO share over 100% (blocks Submit);
  - a budget that seems to be missing zeros;
  - a tip for very short summaries.
- **"Before you start" checklist** of the documents and numbers to gather first.
- **"Talk to a person"** in the chat, with Invest Detroit's public contact details. It sends nothing.
- **Document-upload preview:** a clearly labeled demo with Accept / Edit / Leave blank that never opens your file.
- All new text was translated into all five languages.

Still needs other people: an AI key (instructor), approval of the field guide and translations (Invest Detroit), and installing the add-on on their site.

**11. Tidy the layout *(with a screenshot of the checklist)***
> Change these from checkboxes to compact bullet points and use consistent padding and alignment throughout the app.

Result:
- The "Before you start" checklist now uses compact bullet points instead of checkboxes.
- The whole app now uses one spacing scale (4, 8, 12, 16, 24, 32, 48, 64 pixels) in place of dozens of one-off numbers.
- Every box in the form column has the same inside padding. Boxes with a colored edge stripe compensate for it, so their text starts in exactly the same place, measured on desktop and phone, in English and in right-to-left Arabic.

## 6. Feedback and guardrails

**12. Rating card under the chat**
> Add a compact, rectangular 5-star feedback extension directly beneath our existing Invest Detroit AI chatbot window… *(13 detailed requirements: position, stars, Submit disabled until a star is picked, X to dismiss, save rating + ID + time, thank-you, hide after about 2 seconds, only after real interaction, once per session, retry on failure, responsive, don't disturb the chat.)*

Result:
- After the assistant has answered two questions, a card attached flush under the chat window asks "How was your AI assistant experience?".
- Five yellow stars; Submit stays disabled until one is chosen; an X dismisses it.
- Ratings are saved to here.now Site Data with only the star value, a random feedback ID and the time. Visitors can add ratings but not read them.
- On success it shows "Thank you for your feedback!" with a checkmark and disappears after about 2 seconds, while the chat stays open.
- If saving fails, it shows an error and lets you retry. One rating per chat session.
- The message list shortens and still scrolls, so nothing is covered.
- Tested on desktop and phone, including failure, retry, and dismissing.

**13. Guardrails *(two follow-ups sent while it was being built)***
> Implement Chatbot Guardrails and Off-Topic Request Handling… *(scope, exact rejection message, don't be over-restrictive, ask when unclear, block prompt injection and document injection, enforce server-side, tests.)*
>
> I'd make sure the system distinguishes off-topic requests from risky financial advice… "Should I lie about my revenue to qualify for a loan?"…

Result: a guardrail layer, kept separate from the answering logic, decides before any answer whether a message may be answered.
- **Allowed:** application questions and plain-language finance (net income, operating expenses, revenue vs. profit), plus follow-ups like "explain that more simply".
- **Exact approved rejection:** jokes, essays, trivia, programming.
- **Clarifying question:** unclear messages.
- **Accuracy reminder:** requests to falsify or hide information get a fixed reminder that applications must be accurate, with an offer to help report figures correctly.
- **Injection and probing blocked:** "ignore your instructions", roleplay, "I'm the developer", requests for the system prompt or keys, and l33t or s p a c e d tricks. Uploaded-document text is screened and treated as data, never instructions.
- **Enforced on the server, not just the browser:** the same checks run in the browser and in a new reference server handler (`server/`). That handler is what blocks direct API requests. It isn't deployed, because here.now only hosts static files.
- **Tests:** 74 guardrail tests with representative prompts. New field-guide entries were added for the finance terms the brief lists.

**14. Remove "Talk to a person" *(sent while the guardrails were being built)***
> As you work on the AI chatbot, remove "Talk to a person" option.

Result: the button and contact card were removed. The chat still gives Invest Detroit's contact details when it can't answer.

**15. Fix the rating card not showing *(with a screenshot)***
> The rating feature isn't showing up. Fix it so the card appears.

Result: the card only appeared after two real answers, and the replies in the screenshot were both clarifying questions. "Where do I start?" was also wrongly treated as unclear. Fixed:
- The chat now answers "Where do I start?", "How does this work?" and "What do I do first?" (also in the other four languages) with a step-by-step guide.
- The rating card now appears after 2 messages and at least 1 real answer.

**16. New banner *(with the original photo and a mockup)***
> Update our need support banner to look like the above.

Result: the banner is now the full-width photo of volunteers painting a Detroit street, with "Need Support?" in white, bold condensed type (Barlow Condensed) on a yellow box. The box sits at the bottom left, overlapping the photo's lower edge and lined up with the page content. Checked on desktop, phone and right-to-left Arabic.

Two things to check before the public reveal:
- White on yellow is hard to read for people with low vision, so dark text may be a better choice.
- The photo shows identifiable people, including children, in a public repository, so it needs permission before going public.

## 7. Using Invest Detroit's documents

**17. Answer from Invest Detroit's documents and quote published rates**
> Use these four Invest Detroit documents (Lending Process & Closing Guide, Real Estate Support flyer, Small Business Support flyer, Who is Invest Detroit) to make the assistant more accurate. You may quote published rates and fees; treat these as public documents. Also edit the info tips for each question so they're more relevant with the new information.

Result: instead of a full document search system (RAG), the facts were written as short, sourced "knowledge entries" tagged by program, because the four documents total only about 3,000 words.
- The chat now answers about 20 new kinds of questions from the documents, each with its source. Examples: how long the process takes, underwriting, site visits, term sheets and commitment letters, the closing checklist, construction timing, how money is paid out, and what happens after closing. It also covers loan sizes, terms, collateral, who can apply, which program fits, and who Invest Detroit is.
- Asking about rates or fees now gives the published ranges: 8%–9.5% pricing and 1%–3% fees for Real Estate, labeled "subject to change". "Will I be approved?" and "What rate will I get?" still go to the team.
- The help tips for each question were rewritten with the new facts, keeping the official form wording unchanged. There are new tips for tax returns, bank statements, "previous client" and "Real Estate team member".
- Review My Application has four new "Good to know" tips: a loan outside $150K–$2.5M, equipment loans (which may suit the Small Business program), not starting construction before closing, and mentioning the team's experience.
- The success pop-up now shows a four-step "What happens next" timeline. All new text is in all five languages.
- Things to confirm with Invest Detroit:
  - The lending guide is a draft.
  - The two flyers have no direct links yet.
  - The "Who is Invest Detroit?" sheet lists an older address (600 Renaissance Center). The flyers' 950 Selden Street is used instead.

**18. Add research from Invest Detroit's website**
> Besides the four documents, research Invest Detroit's official website and other credible online sources, and add what would improve the assistant.

Result: the cloud session can't open investdetroit.com or huduser.gov directly (blocked by its network settings), so Claude researched through web search.
- New chat answers:
  - The intake form is a first step, followed by a conversation with a team member.
  - The Commercial & Industrial program covers working capital, term business loans and equipment, with its own intake form.
  - Technical help with permits and city requirements.
  - The Strategic Neighborhood Fund.
- The equipment review tip now mentions both the C&I and Small Business programs.
- `docs/RESEARCH-NOTES.md` lists every source and what was added. It also lists conflicts for staff to confirm, such as a 2023 sheet showing 6%–8% pricing versus 8%–9.5% on the newer flyer. Detroit's AMI figures were found but held back until they can be checked at HUD.

**19. Add a second research brief, keeping the four documents first**
> Add this research knowledge base (from a second research agent) to the assistant. The four documents I sent should have priority wherever they disagree.

Result:
- New chat answers:
  - **How-tos:** Commercial & Industrial terms (from a 2023 sheet, labeled possibly outdated), ID Ventures, other funds (some closed), documents asked for later, getting a Certificate of Good Standing, Detroit building permits, and how to file a discrimination complaint.
  - **Glossary:** DSCR, NOI, loan-to-value, hard and soft costs, contingency, pro forma, title commitment, ALTA survey, Phase I environmental report, borrowing resolution and amortization.
- Help tips now include HUD's 2026 Detroit income limits (AMI) and the new Michigan entity search link (the old one no longer opens). They also explain why a Detroit ZIP code doesn't prove city limits, what the Personal Financial Statement template asks for, and a 5–10% contingency.
- Two claims were corrected: we can't say demographic answers "aren't a test", and what counts as equity isn't published.
- Where the research disagreed with the four documents, the documents were kept: timeline, 501(c)(3), impact figures, rates and address. A test now checks this. `docs/RESEARCH-NOTES.md` lists every conflict for Invest Detroit staff.

## 8. Upload tips

**20. Warnings before each upload**
> Add a short warning-style note right before each upload button, reminding applicants what to check in their file. No checklist, and add a small warning label before the text.

Result: instead of having an AI read uploaded files (which raises privacy questions for a lender), each required upload now has a short yellow "Warning" note above its button.
- **Project plan:** what to cover, including that construction starts only after closing.
- **Development budget:** uses the applicant's own numbers ("make sure this budget totals $1,450,000 ... and shows the Invest Detroit loan as $600,000"). If the total budget is blank, it asks them to enter it first.
- **Team list:** each person's name, role and experience.
- **Supporting documents:** one note asking applicants to check every page is readable, and never to send tax returns or bank statements by email.
- Nothing reads the files. Every warning is in all five languages.

**21. Make the upload notes friendlier**
> "Warning" is too alarming. Rename it "TIP", make it collapsible so it's easier on the eyes, and make it blue.

Result: each upload note is now a single blue line, "TIP · What to check before uploading", that opens when tapped and is closed by default. The text inside is unchanged, including the applicant's own budget and loan numbers. Translated into all five languages.

## 9. Easier form filling

**22. Ten improvements from user testing**
> Here are suggestions from testing. Implement the ones that fit the project best:
> - make the off-topic reply clear about the assistant's limits;
> - require a 10-digit phone number;
> - add "same as home address" for the business address;
> - fill in city and state from the ZIP code;
> - show the 10% equity math;
> - format money as people type;
> - check files without opening them;
> - check each question when people leave it;
> - let applicants explain a warning instead of changing the number;
> - add a progress bar with a section list.

Result: all ten were added, with one change on purpose.
- **Clear limits:** when the chat has no answer, it now says "I can only help with this form and Invest Detroit's lending process", instead of "I don't have an approved answer for that yet".
- **Phone:** a phone number needs 10 digits ("313-555" is now flagged).
- **Same address:** a "Business address is the same as my home address" checkbox copies the home address and keeps the two in step.
- **ZIP code:** a Michigan ZIP code fills in the state ("MI") when it's blank, and warns if a different state was chosen. The **city is not filled in on purpose**: a ZIP code doesn't decide the city, and Hamtramck and Highland Park share Detroit-style ZIP codes, which this form excludes.
- **Equity math:** "10% of $1,450,000 = $145,000" appears under the 10% equity question once a budget is entered.
- **Money:** amounts get commas as you type (1,450,000) with an "About $1.45 million" note underneath.
- **Files:** checked by name and size only, without opening them.
  - An empty file blocks Submit.
  - An unusual file type or a very large file gets a warning.
  - A vague name like "scan001.pdf" gets a renaming tip.
- **Checks as you go:** when you leave a question, format problems and numbers that don't fit, such as a loan bigger than the budget, show right there. Blank required answers still wait for the final review, so nobody is flagged for skipping ahead.
- **Explain instead of changing:** each "Please double-check" item has a "My answer is correct: explain why" link with a short note box. The success pop-up confirms how many notes were included. On Invest Detroit's real form, this would need a notes field added to their form.
- **Progress bar:** a slim bar stays at the top of the form, for example "11 of 48 required answers", with tappable sections ("Contact ✓ · Business info 7 left · Documents 0/3").
- All new text is in all five languages.

## Tips from this build

- **Give Claude the source material.** Pasting the real form's page source produced a much closer replica than describing it.
- **Describe what you want to see and click.** The most effective prompts said exactly where something goes and how it behaves ("above Submit", "grey out until…", "in green with a checkmark").
- **Small follow-ups mid-build work.** Requests like "make it a pop-up" or "grey it out, don't remove it" were picked up while Claude was still working.
- **Ask "what's next according to our plan?"** It keeps the build tied to the project plan instead of drifting.
- **Ask "what would we need?" before "build it".** Getting the list of pieces first made it clear which parts the team could build and which depend on Invest Detroit.
- **Say what "accurate" means to you.** For translations, that meant real written translations rather than an automatic widget, plus an honest note that they still need professional review.
- **Show a screenshot.** Pointing at the exact box ("change these") got a precise fix faster than describing it.
