# Handoff package (November 17, 2026)

Everything for the client's shared Google Drive folder. Put the [one-page README](../../README.md) first, with the live link at the top.

| Drive item | File here | Status |
|---|---|---|
| 1. README | [../../README.md](../../README.md): save as Google Doc or PDF | Ready (live link added); fill in the team names and the named owner |
| 2. Live tool | https://invest-detroit-project-1.onrender.com | Live; test on a phone that isn't the team laptop |
| 3. Slide deck (34 slides) | [../slides/Invest-Detroit-Copilot-Client-Deck.pptx](../slides/Invest-Detroit-Copilot-Client-Deck.pptx) (+ .pdf) | Ready (link added); fill in the team name, date and owner placeholders |
| 4. Test results sheet | [Invest-Detroit-Copilot-Test-Results.xlsx](Invest-Detroit-Copilot-Test-Results.xlsx): upload, then File → Save as Google Sheets | Ready: 42/43 |
| 5. Demo videos | Scripts: [DEMO-VIDEO-SCRIPTS.md](DEMO-VIDEO-SCRIPTS.md) | **The team needs to record them** |
| 6. User guide | [Invest-Detroit-Copilot-User-Guide.pdf](Invest-Detroit-Copilot-User-Guide.pdf) (+ .docx for Google Docs) | Ready; add the video links |
| 7. Exit email | [EXIT-EMAIL.md](EXIT-EMAIL.md) | Draft; send after the presentation |
| Extra: data-flow note for IT | [Invest-Detroit-Copilot-Data-Flow.pdf](Invest-Detroit-Copilot-Data-Flow.pdf) | Ready |
| Extra: reusable test kit | [test-set.json](test-set.json) + `node tools/run-test-set.mjs` (steps are in the sheet's "How to rerun" tab) | Ready |

## Handoff checklist

- [ ] The link opens on a device that isn't the team laptop and runs a new input
- [x] No API key on the slides, screenshots or in the code (the key lives only in Render's settings)
- [x] The test score matches in the sheet, deck and README (42/43)
- [x] The measured impact uses only measured figures (2/10 today vs. 10/10 with the copilot, same 10 examples)
- [x] The README fits on one page and covers all four parts (the prompt is pasted after the page)
- [x] "What it can't do" names real misses from the test set (C14; the first-run misses M02 and C10)
- [ ] "Run it for real" names an owner (fill in the name; the cost estimate is in)
- [x] The videos and user guide use only the fictional sample applicant
- [ ] Client data is deleted and the exit email is ready
- [ ] The user guide is tested by an AI Solutions Specialist

## Regenerating

- **Test results:** `node tools/run-test-set.mjs && python3 tools/build-results-sheet.py`
- **Measured impact:** `node tools/measure-impact.mjs`
- **User guide PDF:** built from [USER-GUIDE.md](USER-GUIDE.md). Screenshots are in `img/`, taken from the app with the sample applicant.
