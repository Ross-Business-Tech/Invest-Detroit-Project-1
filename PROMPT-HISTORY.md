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

## Tips from this build

- **Give Claude the source material.** Pasting the real form's page source produced a much closer replica than describing it.
- **Describe what you want to see and click.** The most effective prompts said exactly where something goes and how it behaves ("above Submit", "grey out until…", "in green with a checkmark").
- **Small follow-ups mid-build work.** Requests like "make it a pop-up" or "grey it out, don't remove it" were picked up while Claude was still working.
- **Ask "what's next according to our plan?"** It keeps the build tied to the project plan instead of drifting.
