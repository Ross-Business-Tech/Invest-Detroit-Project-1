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

**23. Fit the section list on one row** *(with a screenshot)*
> Make the section list fit in one row; it's taking up too much space.

Result: each section now shows a small number badge instead of "8 left" (the full wording still appears on hover and for screen readers). Three names were shortened: "Project", "Business" and "Sign-off". The list fits on one row on desktop, and on phones it's one row you swipe sideways.

**24. Make the top of the page easier to scan** *(with a screenshot)*
> This section looks like an essay and is really compact. Make it more visually appealing; imagine you're someone opening this form.

Result:
- **"How it works"** keeps Invest Detroit's mission line as a short intro, then adds two parts:
  - **Which form is right for you?** Three cards with icons. *Real estate & industrial* is marked "This form" and has a "Start the form" button that jumps to the form. *Small business* and *ID Ventures* each link to their own pages.
  - **How applying works:** four numbered steps (gather your documents, fill in the form, review and submit, hear from the team).
- **"Before you start"** now opens with a highlighted line saying the form can't be saved. Three cards follow, each with an icon: required documents, "Helpful if you have them" (marked Optional), and the numbers you'll be asked for. The "Prefer not to say" note became a small info line.
- Works on phones (cards stack) and in all five languages, including right-to-left Arabic.

**25. Start "Before you start" closed**
> Make "Before you start" begin collapsed; right now it opens expanded.

Result: the "Before you start" panel now loads closed, as a single line, and opens when tapped.

**26. Tighten the long checkbox lists** *(with a screenshot)*
> The lenders and community partners lists have a lot of white space. Fix it a little.

Result: long checkbox lists now flow top to bottom in columns, so a long name no longer leaves an empty gap beside short ones. The spacing between items is tighter too. The community partners list is less than half its old height. On phones they stay a single list.

**27. Client presentation with a measured impact number**
> Create a Google Slides deck highlighting all our key features with screenshots, using the original website as a reference. The client should walk away knowing the problem, who it's for, how the tool works, how well it works, what difference it makes, what it can't do, and what we recommend next. Show one measured number, comparing today with our tool on the same examples, with no invented figures.

Result: a 14-slide deck (`docs/slides/Invest-Detroit-Copilot-Client-Deck.pptx`, opens in Google Slides, with a PDF preview).
- **Today vs. with the copilot:** "today" screenshots come from our first, unchanged replica of the official form. They show the same example (a $2M loan on a $1.45M budget) submitted without a warning, then caught by Review My Application.
- **Measured impact:** we ran the same 10 example applications, each with one common mistake, through the official form's own Submit checks and through the copilot. Today catches **2 of 10**; the copilot catches **10 of 10**. The deck explains the method and that real-world frequency isn't known yet. `tools/measure-impact.mjs` re-runs it.
- **Other slides:** who it's for, how it works, the features with screenshots, how well it works (160 automated checks, 79 sourced help entries, 0 files stored), what it can't do, and a recommendation: check our facts, pilot the add-on, then measure follow-up emails and incomplete applications.

## 10. Connecting a real AI

**28. Get the chatbot ready for an API key**
> We are getting an API key for our chatbot tomorrow. Prepare everything so our chatbot will work correctly and we would just have to enter the key tomorrow. *(Answered: the key is from Anthropic, and it runs on our Vercel site.)*

Result:
- **A Vercel endpoint** (`api/assistant.js`) runs our existing guardrails on the server, then asks Claude, which answers from our whole knowledge base:
  - each answer comes with its sources and a flag when the team must take over;
  - it answers in the applicant's language;
  - if Claude's safety filters decline a request, it's retried automatically on a suitable model.
- **The key goes only in Vercel's settings**, never in the website.
- **Before the key is added**, and whenever Claude can't be reached, the chat quietly answers from the built-in knowledge base. A local test with a fake key showed Anthropic rejecting it and the chat still answering normally.
- **The chat's subtitle** switches to "AI helper · Answers from official Invest Detroit sources" once Claude has answered.
- **The star rating** is hidden on Vercel, because ratings can only be saved on here.now.
- **Tomorrow's steps:** `docs/AI-SETUP.md` covers the 5 steps, how to test, and what the error logs mean.

**29. Switch hosting to Render** *(with screenshots of Render's setup page)*
> Are these settings right? I'm switching to Render.

Result:
- **Static Site doesn't fit:** a Render Static Site can't run the chat endpoint, so the key would have nowhere to live. The team chose a **Web Service** instead.
- **New server file:** `server/webServer.js` (started with `npm start`) serves the website and the chat endpoint together. It runs the same guardrails and Claude code as Vercel, refuses paths outside the website folder, and has a `/healthz` check for Render.
- **Tested locally** with no key and with a fake key: the chat worked both times and fell back to built-in answers.
- `docs/AI-SETUP.md` now lists the exact Render settings.

**30. Tune the repository for Render**
> Is our repo set up and optimized for Render now?

Result: it already worked; four improvements were added.
- **Compression:** the server now sends text files compressed. The app's main file drops from 615 KB to 153 KB, which is faster on phones.
- **Pinned Node version:** Node 22, the version it was tested with.
- **Saved settings:** `render.yaml` records the Render settings in the repository, so the service can be recreated from it.
- **Clean restarts:** the server finishes open requests before Render restarts it for a new version.

**31. Let Claude explain more, while keeping the facts locked**
> Since we're giving the chatbot an API key, we don't have to be so strict about the knowledge base, right? It should understand what the user needs and explain appropriately, just not outside the scope. *(Follow-up: make the two suggested changes.)*

Result:
- **Claude's instructions now split answers in two:**
  - Invest Detroit specifics (rates, fees, loan sizes, terms, programs, eligibility, process, documents, contacts) come only from the knowledge base, with sources, and are never guessed.
  - General guidance (finance concepts, structuring a summary or budget, math with the applicant's numbers) is welcome.
  - It still never predicts approval, helps falsify, writes documents wholesale or invents project facts.
- **The pre-filter is relaxed only when Claude is connected:**
  - Unclear questions, such as "How should I present my bakery idea so it sounds credible?", which was turned away before, now go to Claude.
  - Jokes, trivia, falsifying, rule-changing and prompt-fishing are still blocked first.
  - Claude can also mark a question off-topic, and the chat then shows the standard reply.
- **Checks:** 5 new automated tests, and `tools/check-chat.mjs` runs 8 live pass/fail checks on the real site once the key is in.

**32. Features for Invest Detroit's business needs**
> Go ahead and implement these all: save and resume, a staff summary with each application, private usage insights, the star rating on Render, an accessibility pass, and abuse and cost protection. *(Follow-up: where would the staff summary be saved, since it should stay private?)*

Result:
- **Save and resume:**
  - Answers are kept on the applicant's own device as they type, never the SSN or files.
  - A "Continue where I left off / Start over" choice appears on return, with an option to turn saving off.
  - Drafts expire after 7 days and are cleared on submit.
- **Staff summary:**
  - Built in the browser at submission. On the real form, it goes inside the application into a hidden field only Invest Detroit's staff see.
  - It is never stored by our site. The prototype's success pop-up shows what staff would receive.
- **Usage insights:**
  - A password-protected `/insights` page shows forms started and submitted, where people stop, the most common review findings, what people ask about, chat outcomes and ratings.
  - Only counts are stored, never what anyone typed.
  - Counts last across restarts once Render's free Postgres database is attached.
- **Star ratings** are saved through our server on Render.
- **Accessibility:** an automated check went from 6 kinds of issues to none. The fixes include dark text on the yellow banner, darker links, the heading order and labeled page areas.
- **Limits:**
  - daily Claude limits per visitor and for the whole site, after which the chat answers from the built-in guide;
  - no IP addresses stored;
  - plus a reminder to set a spending cap in the Anthropic Console.
- **Honest banner:** the top banner now says chat questions are answered by an AI service.

**33. Take down the here.now preview**
> Delete our Invest Detroit website preview from here.now, or make it private so people who have the link can't open it.

Result: the class's publishing script can't delete a site or make an existing one private. So the preview's contents were replaced with a "This preview is no longer available" page, and every address under the link shows only that. The link expires on Nov 18. No more here.now previews are being published, because one would bring the app back; the Render site is now the main link.

## 11. Final deliverables

**34. Create the final deliverables**
> These are the deliverables we need (the AI Sprint Final Deliverable Outline). Could you create what you can right now, for example the README?

Result:
- **One-page README** in the outline's template, with the full prompt pasted after it. The old, longer README moved to `docs/PROJECT-OVERVIEW.md`.
- **A test set of 43 examples:** normal, tricky and "must never" cases, with expected answers written before each run. A one-command rerun (`node tools/run-test-set.mjs`) and a Test Results spreadsheet for Google Sheets: score at the top, a score-history tab and a "How to rerun" tab.
  - **First run: 28/30.** Real misses: "make my revenue look higher" was answered instead of refused, and a Small Business rate question got Real Estate rates.
  - Those were fixed, then 7 fresh examples were added that weren't used for tuning. **Final: 42/43.** The one known miss is a ZIP-code/city-limits question.
- **A 7-page user guide** (PDF and Word) with real screenshots, for applicants and screening staff.
- **A one-page data-flow note** for Invest Detroit's IT team.
- **Demo video scripts**, a draft exit email and a handoff checklist.
- **The client deck**, rebuilt to 10 slides: problem, who it's for, how it works, live demo, test results, measured impact, limits and a 30-day trial recommendation.

**35. Hand the project to a new chat**
> I want to share this project with another chat. Is there a way to carry over everything you know from this chat?

Result: a new file, `docs/AI-HANDOFF.md`, sums up the goal, current status, the decisions already made, the deliverables and the numbers that must stay consistent, the code map, the rules, and the next steps. A new chat reads it first.

**36. Switch the chatbot to OpenAI**
> We got the API key, but it's a Codex one. Rebuild everything around our Codex API key; take your time.

Result:
- **OpenAI connection:** the chatbot now answers with OpenAI, using the same instructions, knowledge base and safety checks as before.
- **Which AI answers:** the key in Render decides: `OPENAI_API_KEY` for OpenAI, `ANTHROPIC_API_KEY` for Claude (kept as an alternative), and neither for the built-in guide.
- **Failures:** if the AI fails, the chat falls back to the guide, and `/insights` counts the failure by type (for example "401 = wrong key"), never what anyone typed.
- **Test set:** it can now be rerun with the AI (`--ai`).
- **Documents:** the setup guide, README, deck, data-flow note, exit email, video scripts and handoff note now say OpenAI, with a new cost estimate of about $20–$35 a month.

**37. Make the University of Michigan key work**
> It's from UM-GPT (shared U-M's Codex setup page).

Result:
- **Why the key was rejected:** U-M's "Codex for the Classroom" keys only work through U-M's GPT Toolkit gateway, so OpenAI rejected the key (401).
- **The fix:** two more Render settings, `OPENAI_BASE_URL=https://api.toolkit.umgpt.umich.edu/v1` and `OPENAI_MODEL=gpt-5.6-terra`.
- **Hardening:** the server now ignores stray spaces around the key, and retries without any optional setting a gateway rejects.
- **Subtitle:** the chat no longer says "AI not connected" before anyone has asked anything.
- **Result:** the chatbot answered live with "AI helper" showing.

**38. Rebuild the client deck**
> Here is the Render link and the original form. Remake the Google Slides with snapshots of all our new features, their purpose, why we did it and why it's better. Make it very comprehensive. Make the measurements clear, with snapshots from the old form to the new one. Send me the pptx I can import into Slides.

Result:
- **The deck:** 34 slides in `docs/slides/` (PowerPoint file plus PDF), built to import into Google Slides. It covers the problem, who it's for, how it works, then one slide per feature with a real screenshot, what it does, why we built it and why it beats the original form.
- **Features shown:** Before You Start, progress bar, checks as you type, the ? help, Review My Application, "explain why" notes, the AI chat assistant, the guardrails, five languages (including Arabic right to left), save and resume, submit and next steps, the staff summary, the insights page and the FormAssembly add-on.
- **Measurements:** an old-form vs. copilot snapshot, a chart and a table for 2 of 10 vs. 10 of 10, the 42/43 test score by kind, the history from 28/30 to 42/43 and the one known miss.
- **Also in it:** cost estimate, privacy, limits, the 30-day trial and a next-steps table with the team name, date and owner left as marked placeholders.
- **Screenshots:** all taken from the app with the fictional sample applicant. "Before" pictures are from our replica of the original form with the copilot off, because the cloud environment can't open investdetroit.com.
- **Rebuilding:** `tools/build-client-deck.mjs` regenerates the deck from `docs/slides/deck-images/`.

**38. A clean copy of the project for Invest Detroit**
> We're about to send our GitHub repo to the company. Remove anything that's not relevant, like the prompt history, keep only what the team will need (and the README), and organize everything. Make it a separate repo.

Result: a new repository, `ojhnny/invest-detroit-application-copilot`, holds one fresh commit with no class history, branches or pull requests.
- **Kept:** the app, server, tests and test tools.
- **Organized:** the README (with a project map and "run it" steps); `docs/` now holds the setup, architecture, user guide, testing, presentation and data-flow files.
- **Removed:** the prompt history, class instructions, AI-chat notes, stray screenshots, Ross IT's class setup and here.now publishing commands, the exit email and the video scripts.
- **Checked:** it builds and passes the same tests (201, test set 42/43). The class repo and the dev site are unchanged.

**39. Make sure every feature carries over to the real FormAssembly form**
> Double-check that all our new features are easily integrable into FormAssembly, which their original form is built on. Make sure the code is suitable and the embedded parts transfer over. Update both repos. I also heard they use WordPress, and MyEmma for database/insights, so make sure the backend is ready to be sent over.

Result:
- **What was missing:** the add-on for the real form only had the review, the chat and the staff summary.
- **What it adds now:**
  - the progress bar, a **?** button by each question, and notes as questions are answered ("About $1.45 million", the 10% equity math, "loan is larger than the budget");
  - upload tips and file checks;
  - the applicant's "this is correct because…" notes in the staff summary;
  - AI answers, ratings and usage counts through our server.
  - The address helpers are optional.
- **Server:** it now accepts calls from investdetroit.com (and refuses other websites), and `/insights` can download a CSV.
- **Tested:** everything was checked on the FormAssembly test page from a different web address, as on the real site.
- **New guide:** `docs/FORMASSEMBLY-INTEGRATION.md` walks Invest Detroit's web team through the Render server, the FormAssembly hidden field, Save & Resume and the thank-you text, the WordPress script tag, and testing.
- **Emma:** it's their email-marketing tool, so the copilot sends it nothing. Insights stay anonymous counts, downloadable as CSV.

**40. Make the real form look and work like our demo, and remove the document mock-up**
> Create an add-on for everything on our form that's not on theirs, so it looks almost exactly the same and works exactly the same. They loved our website. Also, remove this (the "Preview of a future feature" document-suggestion box).

Result:
- **Mock-up removed:** the document-suggestion box is gone from the demo site.
- **New add-on options** (each turned on with one setting on the script line):
  - `data-intro` draws "How it works" and "Before you start" above their form, exactly as on the demo.
  - `data-theme` restyles their FormAssembly form to the demo's look.
  - `data-drafts` adds the demo's save & resume ("Continue where I left off").
  - `data-load-font` loads the demo's fonts.
- **Thank-you page:** the guide now has a ready-made "What happens next" message for FormAssembly, styled like the demo's success screen.
- **Wording fix:** "the form can't be saved partway through" now changes to "you can save and finish later" wherever saving is on, including on the demo itself.
- **Not carried over, on purpose:** the money boxes' commas, because their form only accepts numbers.
- **Tested:** all options on, on the FormAssembly test page, desktop and phone, from a separate web address.

## Tips from this build

- **Give Claude the source material.** Pasting the real form's page source produced a much closer replica than describing it.
- **Describe what you want to see and click.** The most effective prompts said exactly where something goes and how it behaves ("above Submit", "grey out until…", "in green with a checkmark").
- **Small follow-ups mid-build work.** Requests like "make it a pop-up" or "grey it out, don't remove it" were picked up while Claude was still working.
- **Ask "what's next according to our plan?"** It keeps the build tied to the project plan instead of drifting.
- **Ask "what would we need?" before "build it".** Getting the list of pieces first made it clear which parts the team could build and which depend on Invest Detroit.
- **Say what "accurate" means to you.** For translations, that meant real written translations rather than an automatic widget, plus an honest note that they still need professional review.
- **Show a screenshot.** Pointing at the exact box ("change these") got a precise fix faster than describing it.
