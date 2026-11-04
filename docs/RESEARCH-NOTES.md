# Research notes: online sources for the assistant (Nov 2026)

**How this was researched.** The build session's network settings block investdetroit.com and huduser.gov, so their pages couldn't be opened directly. Everything below comes from web-search excerpts of those pages. Invest Detroit staff should confirm it before real use. To check the pages directly next time, add `investdetroit.com` and `huduser.gov` under *Allowed domains* in the cloud environment's network settings.

## Added to the assistant

| Finding | Source | Where it shows up |
| --- | --- | --- |
| The intake form is a pre-qualification step. "The first step in our financing process is a discussion with an Invest Detroit team member about your project." | [Need Support?](https://investdetroit.com/need-support/), [Developer info sheet (2021)](https://investdetroit.com/wp-content/uploads/2021/02/Developer-Info-Sheet_v21.pdf) | Chat: "What happens after I submit / how long does it take?" |
| Commercial & Industrial covers secured business credit: working capital advances, term business loans and equipment financing. It has its own intake form, which asks for a business plan or pitch deck and financial projections. | [Commercial and Industrial](https://investdetroit.com/commercial-industrial/) | Chat: "Which program / right form?"; review tip for Machinery & Equipment |
| Invest Detroit works with established and emerging developers, and the 2021 sheet says it prioritizes teams led by developers of color or Detroit residents. | [Developer info sheet (2021)](https://investdetroit.com/wp-content/uploads/2021/02/Developer-Info-Sheet_v21.pdf) | Chat: "Who can apply?" |
| It offers technical assistance with community engagement, permitting and city requirements. | Same sheet | Chat: "Can you help with permits?" |
| The Strategic Neighborhood Fund began in 2016 in three neighborhoods and later covered about 11 (as of 2023). | [Knight Foundation](https://legacy.knightfoundation.org/articles/strategic-neighborhood-fund-harnesses-the-power-of-partnerships-to-revitalize-detroit-neighborhoods/), [Crain's Detroit](https://prod.crainsdetroit.com/node/870571) | Chat: "What is the Strategic Neighborhood Fund?" |

## Conflicts found: staff should confirm

1. **Real Estate pricing.** The 2023 [Real Estate Overview PDF](https://investdetroit.com/wp-content/uploads/2023/11/Invest-Detroit-Real-Estate-Overview.pdf) shows **6%–8%**. The newer flyer the team received shows **8%–9.5%**. The assistant uses the newer flyer.
2. **Small Business fees.** An older [loan process infographic (2020)](https://investdetroit.com/wp-content/uploads/2020/07/Small-Business-Loan-Process-Infographic.pdf) lists "$0–$250 or 1%". The newer flyer lists "minimum $1,500 or 1% plus third-party costs" and a $250 assessment fee. The assistant uses the newer flyer.
3. **Address.** The flyers list 950 Selden St, Suite 360. "Who is Invest Detroit?" lists 600 Renaissance Center. The assistant uses 950 Selden.
4. **Contacts.** The 2021 developer sheet names a staff contact and a direct number. The assistant uses only the general line, 313.259.6368, and does not name staff.

## Found but not added (yet)

- **Detroit Area Median Income (AMI).** A city page reproducing HUD's figures lists FY2025 median family income for Detroit–Warren–Livonia as **$101,000** for a family of 4 ([City of Westland](https://cityofwestland.com/220/HUD-Income-Limits)). FY2024 was $95,900 ([City of Detroit](https://devtraining.detroitmi.gov/sites/training.detroitmi/files/2024-07/Worker%20Income%20Limit%20By%20Fiscal%20Year%2007%2001%202024.pdf)). These weren't added because they should come straight from HUD (huduser.gov), and they change every spring. Once confirmed, they would let the AMI help tip give an example such as "60% AMI for a family of 4 is about $60,600".
- **Small Business intake questions** (own or lease the space, required business plan and projections) are already covered by `which_program` and don't apply to this form.
- **Property Owner Fund** ([page](https://investdetroit.com/propertyownerfund/)) appeared in results, but its terms weren't visible in the excerpt. Worth reading when the site can be opened.

## Suggested next steps

1. Allow `investdetroit.com` and `huduser.gov` in the environment's network settings. Then re-check the pages above and add HUD's AMI table.
2. Ask Invest Detroit staff which pricing sheet is current, and whether the lending guide can be published with a link.
3. Ask whether the "Real Estate/C&I" form and the separate C&I intake form serve different applicants. The help text currently says equipment and working-capital loans may belong on the C&I form.
