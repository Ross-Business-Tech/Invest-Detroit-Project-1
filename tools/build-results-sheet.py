# Run: python3 tools/build-results-sheet.py  (after node tools/run-test-set.mjs)
#      python3 tools/build-results-sheet.py --ai  (after node tools/run-test-set.mjs --ai)
# Turns docs/handoff/test-results.json into Invest-Detroit-Copilot-Test-Results.xlsx for Google Sheets.
import json, pathlib, sys
AI = '--ai' in sys.argv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
here = pathlib.Path(__file__).resolve().parent.parent / 'docs' / 'handoff'
data = json.loads((here / ('test-results-ai.json' if AI else 'test-results.json')).read_text())
rows = data['rows']
wb = Workbook()
ws = wb.active; ws.title = 'Results'
navy, green, red, grey = '0B2545', 'D9F2E3', 'F8D7DA', 'F2F4F5'
bold = Font(bold=True); thin = Side(style='thin', color='CCCCCC')
ws['A1'] = 'Invest Detroit Application Copilot: Test Results'; ws['A1'].font = Font(bold=True, size=16, color=navy)
ws['A2'] = 'Score'; ws['B2'] = data['score']; ws['B2'].font = Font(bold=True, size=14, color=navy)
ws['C2'] = ' · '.join(f"{k} {p}/{t}" for k, (p, t) in data['byCategory'].items())
misses = [r for r in rows if not r['pass']]
ws['A3'] = 'Main miss'; ws['C3'] = '; '.join(f"{r['id']}: {r['input']}. {r['notes']}" for r in misses) or 'none'
ws['A4'] = 'How it was run'; ws['C4'] = 'Expected answers were written before each run. Form rows use the real review rules; chat rows use ' + ('the AI service (OpenAI); a person reviewed each FAIL.' if AI else 'the built-in field-guide answers (AI key not connected).') + ' Rerun: node tools/run-test-set.mjs'
for c in ('A2', 'A3', 'A4'): ws[c].font = bold
head = ['ID', 'Area', 'Category', 'Input', 'Expected (written before running)', 'Actual', 'Pass/Fail', 'Notes']
ws.append([]); ws.append(head)
hr = ws.max_row
for i, h in enumerate(head, 1):
    c = ws.cell(hr, i); c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor=navy); c.alignment = Alignment(wrap_text=True, vertical='center')
for r in rows:
    ws.append([r['id'], r['area'], r['category'], r['input'], r['expected'], r['actual'], 'PASS' if r['pass'] else 'FAIL', r['notes']])
    row = ws.max_row
    for i in range(1, 9):
        c = ws.cell(row, i); c.alignment = Alignment(wrap_text=True, vertical='top'); c.border = Border(top=thin, bottom=thin)
    ws.cell(row, 7).fill = PatternFill('solid', fgColor=green if r['pass'] else red); ws.cell(row, 7).font = bold
for col, w in zip('ABCDEFGH', [6, 14, 12, 40, 40, 60, 10, 50]): ws.column_dimensions[col].width = w
ws.freeze_panes = ws.cell(hr + 1, 1)

h = wb.create_sheet('Score history')
h.append(['Run', 'Examples', 'Score', 'What happened'])
for r in [
    ['1. First run', 30, '28/30', 'Missed: a cheating question ("make my revenue look higher") and a Small Business rate question answered with Real Estate rates.'],
    ['2. Added 6 new wordings before fixing', 36, '30/36', 'Confirmed the misses were patterns, not one-offs (4 deception/eligibility wordings, 2 Small Business rate wordings).'],
    ['3. After the fixes', 36, '36/36', 'New wording rules for deception, eligibility and Small Business rates. 192 automated tests still pass.'],
    ['4. Added 7 fresh examples, not used for tuning', 43, '42/43', 'One real miss kept: ZIP-code/city-limits question (C14). One grading fix (C13), reviewed by a person.'],
]: h.append(r)
for c in h[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor=navy)
for col, w in zip('ABCD', [38, 10, 8, 100]): h.column_dimensions[col].width = w
for row in h.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')

k = wb.create_sheet('How to rerun')
steps = [
    'Reusable test kit: rerun this set after any change to the prompt, the knowledge base or the review rules.',
    '',
    '1. Open the project folder on a computer with Node.js 22 installed and run: npm ci',
    '2. Run: node tools/run-test-set.mjs   (prints PASS/FAIL per example and the score; writes docs/handoff/test-results.csv)',
    '3. Optional, for this spreadsheet: python3 tools/build-results-sheet.py',
    '4. With the OpenAI key: OPENAI_API_KEY=<key> node tools/run-test-set.mjs --ai  (same examples answered by OpenAI; a person reads every FAIL), then python3 tools/build-results-sheet.py --ai',
    '5. On the live site: node tools/check-chat.mjs https://<your-site>   (8 live checks)',
    '6. Compare the score with the one at the top of the Results tab.',
    '',
    'Rule: rerun the full set before changing the prompt. If the score drops, do not use the change.',
    'To add an example: add a row to docs/handoff/test-set.json with the expected answer written BEFORE you run it.',
]
for s in steps: k.append([s])
k['A1'].font = Font(bold=True, size=13, color=navy); k.column_dimensions['A'].width = 120
out = here / ('Invest-Detroit-Copilot-Test-Results-AI.xlsx' if AI else 'Invest-Detroit-Copilot-Test-Results.xlsx')
wb.save(out); print('wrote', out)
