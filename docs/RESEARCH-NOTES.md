# Research notes: sources for the assistant (Nov 2026)

## Priority rule

**The four documents Invest Detroit shared win.** These are the Real Estate Support flyer, the Small Business Support flyer, the Lending Process & Closing Guide, and "Who is Invest Detroit?". Web research only fills gaps they don't cover and never replaces them. `tests/fieldGuide.test.js` checks this ("the four Invest Detroit documents keep priority").

## How the research was done

1. **Web search from the build session.** That session couldn't open investdetroit.com or huduser.gov directly.
2. **A research brief from a second agent (4 Nov 2026).** It read Invest Detroit's website and PDFs plus official government pages. It's self-contained and pasted into the build chat. Staff should still confirm anything marked below.

## Where research and the documents disagree (documents used)

| Topic | Four documents (used) | Research found | Note for staff |
| --- | --- | --- | --- |
| Lending process timeline | Lending guide: Screening 1–2 wks, Term sheet 2–6, Commitment 5–10, Closing 4–6 | Website publishes only a 2020 small business process (6–12 weeks); the brief calls the lending guide "internal" | Team was told to treat the guide as public. Confirm it can be shared with applicants |
| 501(c)(3) status | "Who is Invest Detroit?" says Non-Profit (501c3) | Website text says "nonprofit lender" only | – |
| Impact figures | Sheet: $593.4M deployed, $3.88B leveraged, 5,622 housing units, 984 projects, 16,610 jobs | Homepage (undated): $661M, $4.7B, 6,072 units, 1,094 projects, 18,073 jobs | Website numbers look newer. Staff may want the newer figures |
| Real Estate pricing | Flyer (2026): 8%–9.5% | 2023 overview PDF: 6%–8% | Older PDF still linked from What We Do |
| Small Business pricing and fees | Flyer: 8%–10%; ≥$1,500 or 1%; $250 assessment fee | 2023–24 sheets 7%–8%; 2020 infographic fees "$0–$250 or 1%" | Older sheets still linked from Small Business page |
| Address | Flyers: 950 Selden St, Suite 360 | 600 Renaissance Center appears only in third-party directories (and on the "Who is" sheet) | – |
| SNF neighborhoods | Not covered | 10 neighborhoods since 2018 (Invest Detroit); Knight/Crain's reported 3 → 11 | Invest Detroit's page used. No official list of the ten is published |

## Added from research (documents are silent)

- **Commercial & Industrial.** It has its own two-step intake form, and Invest Detroit doesn't say who should use which form. The only published C&I fact sheet (Feb 2023, labeled possibly outdated) lists $150K–$2.5M, 7%–9% pricing, 1%–3% fees and terms. Venture capital goes to ID Ventures.
- **Other funds.** The Property Owner Rental Relief Fund is closed. The Motor City Contractor Fund has no published terms. SNF grants have no application process.
- **Later documents.** Invest Detroit's 2020 checklist lists what may be requested after the intake.
- **Personal Financial Statement.** What the template asks for.
- **Michigan and Detroit how-tos from official sources.**
  - The new LARA entity search is at michigan.gov/corpentitysearch. The official form's link to `cofs.lara.state.mi.us` no longer loads, so the prototype's link now points to the new search.
  - Getting a Certificate of Good Standing.
  - Why a Detroit ZIP code isn't proof of city limits, and checking with the Parcel Viewer.
  - BSEED building permit steps.
- **HUD FY2026 income limits** for Detroit-Warren-Livonia, effective May 1, 2026. Median family income is $104,800. MTSP limits for 4 people: 50% $52,400, 60% $62,880, 80% $83,840. HUD doesn't publish 10/100/110/120% tables.
- **Glossary** (`src/copilot/glossary.js`). Sources are the OCC, FDIC, CFPB, EPA, ALTA, SBA and the CDFI Fund. Terms: DSCR, NOI, LTV/LTC, hard and soft costs, contingency (5–10%), pro forma, title commitment, ALTA survey, Phase I ESA, borrowing resolution, amortization, and the CDFI definition.
- **Discrimination complaint contacts.** Already on both flyers.

## Corrections made because of the research

- The owner-demographics tip no longer says the answers "are not a test". Only the Small Business page says impact questions are for reporting only; this form doesn't say.
- The equity tip says what counts as equity isn't published.

## Not used

- The brief suggested writing the executive summary "in a few short paragraphs", but the box is limited to 500 characters, so the tip keeps the short version.
- An unconfirmed $10 Good Standing fee and exact LARA restoration fees were left out. The chat says "check current fees on LARA's site".
- A second Invest Detroit phone number (313.259.6393), because its purpose isn't stated.

## Still unknown: ask Invest Detroit

- Current C&I pricing.
- Maximum LTV, minimum DSCR, required contingency, and the guarantor ownership threshold.
- What counts toward the 10% equity.
- The official list of the ten SNF neighborhoods.
- Which HUD table the AMI boxes use.
- Whether demographic answers on this form are used in underwriting.
- Motor City Contractor Fund terms.
- Office hours and details of language assistance.
- What happens after a "Yes" on a screening question.
