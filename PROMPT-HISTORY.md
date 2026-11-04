# Prompt History

How we built the AI Application Copilot prototype with Claude, one request at a time. Each entry shows what we asked (lightly edited for clarity) and what came out of it. Use it to see how the app got here, or to reuse prompts that worked well.

Sign-in steps and personal details are left out on purpose, because this repository is public.

## 1. Planning

**1. Review the brief**
> *(Shared our 12-page "AI Application Copilot & Pre-Submission Reviewer" brief as a PDF.)* This is what we are currently trying to build. What do you think? Any suggestions / improvements?

Result: feedback on the brief. It was strong on scope, non-goals and safety, but written for a production system. The suggestions were to:
- build a practice copy of the form instead of plugging into the live one;
- use a team-written field guide instead of full AI search;
- do the rule-based checks first;
- put a "?" help button on each question;
- leave out the SSN;
- plan the demo around three made-up applicants.

**2. Choose the form**
> *(Shared the link to investdetroit.com/need-support.)* This is the form. Will this work?

Result: flagged that this link is the **Real Estate/C&I** form, while the brief was written around the **Small Business** form. The session couldn't open the website directly, so the page source had to be pasted in later.

**3. Revised plan**
> Can you send a revised project plan?

Result: a revised plan as a web page. It covered what changed from the brief, scope (build / mock-up only / not doing), a 6-step build order, the review checks, demo applicants, assumptions, and questions for Invest Detroit.

**4. Plan as a PDF**
> In PDF form please.

Result: the same plan as a 6-page PDF for sharing.

## 2. Building the replica page

**5. Start the replica**
> Can you start by building the replica starting page that we will be trying to integrate the AI assistant in? Show me what it would look like.

Result: we stopped this attempt partway through so we could provide the real form first.

**6. Paste the real form**
> *(Pasted the full page source of investdetroit.com/need-support.)* How about now?

Result: a replica of the "Need Support?" page with every section and question of the Real Estate/C&I In-Take Form, in the original order. Follow-up questions appear only when they apply, and required fields are checked on Submit. A "Fill with sample applicant" button fills it with fictional data. Real staff names in one dropdown were replaced with placeholders.

**7. Success pop-up** *(sent while it was being built)*
> When pressed submit, can you just create like a popup that's like "submitted successfully" or something?

Result: Submit opens a "Submitted successfully" pop-up. Nothing is actually sent.

**8. Keep the SSN field, greyed out** *(sent while it was being built)*
> For the SSN number, just gray it out but don't remove it. I want it to be an exact replica.

Result: the Social Security Number field appears exactly where the real form has it, but it is disabled and can't be typed in.

## 3. Publishing a test link

**9. Hosting questions**
> How do I sign into here.now?
> Where do we upload the website? Is it public to the group?
> Will it save to my storage on my here.now account or into the Business+Tech group?
> Could we do it without here.now for now and run it locally?

Result: explanations of how test links work (private to anyone with the link, they expire), the team dev site, and the public "Coming soon" site. Previews go into the class workspace, not personal storage. "Running locally" isn't possible from a cloud session.

**10. Publish to the right place**
> Can you make sure to put it in the right folder according to the instructions?

Result: signed in to here.now and published the first test link into the class workspace.

## 4. Review My Application

**11. What's next**
> According to our project plan, what is next?

Result: Step 2 of the plan, the rule-based "Review My Application" button. The checks were adapted to the Real Estate form: loan vs. budget, affordable units vs. total units, and net vs. gross square footage.

**12. Build the review**
> Add a review button at the bottom above submit, and add a bar above it showing the progress bar with steps of the review. Once the progress bar is full, replace it and in green text with a checkmark say "review successful". Gray out submit until the review button is pressed and done.

Result:
- A 5-step progress bar: required questions, formats, numbers adding up, project details, documents and acknowledgements.
- A green "✓ Review successful" when nothing blocks the application.
- Otherwise, a grouped list of issues with "Go to field" buttons.
- Submit stays greyed out until a successful review, and greys out again if an answer changes.

## 5. AI assistant

**13. Chat window**
> Now add the AI assistant chatbot at the corner. If the user presses on it, the AI chatbot box will pop up. It doesn't have to work for now.

Result:
- A "Need help?" button in the corner that opens a chat window.
- A welcome message, suggested questions, and an "Asking about:" line showing which question you're on.
- A Social Security Number warning that hides the number.
- Placeholder replies until the AI is connected.

## 6. Sharing with the team

**14. Check GitHub**
> Is this pushed on GitHub?

Result: confirmed all work was saved on our branch.

**15. Pull request text**
> What's a good title and description?

Result: a pull request title and plain-language description covering what was added, the safety choices, what was tested and how to try it.

**16. README**
> Can you edit our README.md to make it relevant?

Result: the README now explains the project, its features, how to try it, the safety choices and the plan.

**17. Failed workflow**
> Why did my here.now workflow fail? Is this something we should fix right now?

Result: the repository's here.now publishing key and settings were never added during class setup, and there is no `development` branch yet. This isn't caused by our code. It needs the instructor to finish the setup.

**18. This file**
> Can you create a md summarizing the prompts I asked you to create what we have now, to the branch?

Result: this file.

## 7. Getting ready for the real website

**19. Integration-ready architecture**
> Can you review and refactor our existing AI application pipeline so that it will be easy to integrate our features into Invest Detroit's actual website and loan application system in the future? Our current application is a prototype, but we want to design the architecture with real-world integration in mind.

Result: no visible changes. Underneath:
- The copilot logic (field definitions, review rules, Submit lock, assistant, privacy rules) moved into a core that doesn't depend on our page.
- Review results now follow the data format from the brief.
- The assistant has a defined request and reply format, with sensitive numbers removed before anything is sent.
- A connector reads Invest Detroit's real FormAssembly form using its actual field IDs. It never reads the SSN field.
- 27 automated tests and an architecture guide (`docs/ARCHITECTURE.md`) were added.

**20. Planning the add-on**
> What would we need for the add-on script?

Result: a plain-language list. On our side: one add-on file, styles that can't clash with Invest Detroit's site, a "fail safely" rule, a fix for translated pages, a test page, and somewhere to host the file. On Invest Detroit's side: someone to add one line to their page (in WordPress or in FormAssembly's custom-code area), privacy and security approval, a decision on what blocks Submit, an AI service, and a heads-up when they edit the form.

**21. Build the add-on**
> Build whatever pieces that we can build so far.

Result:
- `npm run build` now also makes **one add-on file** (`dist/embed/copilot.js`). It finds Invest Detroit's FormAssembly form, adds the review panel above its Submit button and the chat button in the corner, and locks Submit until a review passes. It also blocks attempts to get around the lock.
- Its look is **sealed off** from the host page in both directions.
- If anything breaks, it **removes itself and unlocks Submit**, so the official form always works.
- Answers are read by the form's **hidden option codes**, so reviews still work when the page is translated.
- A **test page** (`/embed-test/`) has a plain copy of the real form's structure. It acts out the form loading late, the form's own Submit handler, and a "Simulate Spanish translation" button.
- A phone-layout bug where the chat button covered the form's spam-check badge was found and fixed.

**22. Language dropdown** *(sent while the add-on was being built)*
> Add a dropdown somewhere convenient on the page, perhaps on the top, that translates the page accurately into some main core languages.

Result:
- A language dropdown in the header with **English, Español, العربية (Arabic) and বাংলা (Bengali)**, the same languages Invest Detroit's own site offers.
- Instead of word-by-word machine translation, every piece of text has a written translation: all questions and choices, review messages, the chat, the pop-up and the page itself.
- Arabic switches the page to right-to-left.
- Answers and review rules stay in English underneath, so switching language never breaks a review.
- The choice is remembered on the device.
- A note on translated pages says they were drafted with AI and not yet checked by a professional translator.
- The add-on follows the language of whatever page it's on.

**23. Keep this file current** *(sent while the language work was being built)*
> After you are done, update our Prompt History md.

Result: entries 20–23 were added to this file (and later entries are added the same way).

**24. Add Chinese**
> You forgot a Chinese option.

Result: **简体中文 (Simplified Chinese)** was added to the language dropdown, with a full translation of every piece of text, like the other languages. Invest Detroit's own site offers English, Spanish, Arabic and Bengali; Chinese is the team's addition.

## 8. Building everything we can

**25. Build what's realistic now** *(sent while Chinese was being added)*
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

**26. Tidy the layout** *(with a screenshot of the checklist)*
> Change these from checkboxes to compact bullet points and use consistent padding and alignment throughout the app.

Result:
- The "Before you start" checklist now uses compact bullet points instead of checkboxes.
- The whole app now uses one spacing scale (4, 8, 12, 16, 24, 32, 48, 64 pixels) in place of dozens of one-off numbers.
- Every box in the form column has the same inside padding. Boxes with a colored edge stripe compensate for it, so their text starts in exactly the same place, measured on desktop and phone, in English and in right-to-left Arabic.

## Tips from this build

- **Give Claude the source material.** Pasting the real form's page source produced a much closer replica than describing it.
- **Describe what you want to see and click.** The most effective prompts said exactly where something goes and how it behaves ("above Submit", "grey out until…", "in green with a checkmark").
- **Small follow-ups mid-build work.** Requests like "make it a pop-up" or "grey it out, don't remove it" were picked up while Claude was still working.
- **Ask "what's next according to our plan?"** It keeps the build tied to the project plan instead of drifting.
- **Ask "what would we need?" before "build it".** Getting the list of pieces first made it clear which parts the team could build and which depend on Invest Detroit.
- **Say what "accurate" means to you.** For translations, that meant real written translations rather than an automatic widget, plus an honest note that they still need professional review.
- **Show a screenshot.** Pointing at the exact box ("change these") got a precise fix faster than describing it.
