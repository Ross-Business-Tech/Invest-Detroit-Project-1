// Generates public/embed-test/index.html: a plain test copy of Invest Detroit's FormAssembly
// intake form, using the same element ids, option codes, labels and Submit button as the live
// form, with the add-on script loaded. Run after changing formDefinition.js or formAssemblyMap.js:
//
//   node tools/build-embed-test-page.mjs
//
// It is generated from our own field map, so it proves the add-on works with FormAssembly-style
// markup. The final check still has to happen on the real page.

import { writeFileSync } from 'node:fs'
import { SECTIONS, FORM_INTRO } from '../src/copilot/formDefinition.js'
import { FORM_ASSEMBLY_MAP, FORM_ASSEMBLY_FORM_ID, FORM_ASSEMBLY_SUBMIT_ID } from '../src/copilot/adapters/formAssemblyMap.js'
import { SAMPLE_APPLICANT } from '../src/prototype/sampleApplicant.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// The live staff list has real names; the test page uses placeholders with made-up codes.
const STAFF_CODES = ['tfa_797', 'tfa_798', 'tfa_799', 'tfa_594']
const codesFor = (f, e) => e.codes || (f.id === 're_team_contact' ? STAFF_CODES : [])
const req = (f) => (f.required ? ' reqMark' : '')

function control(f) {
  const e = FORM_ASSEMBLY_MAP[f.id]
  const label = esc(f.label || '')
  if (f.type === 'disabled') {
    // The live form's SSN field (tfa_541). Kept so the page matches, but it can't be typed in.
    return `<div class="oneField" id="tfa_541-D"><label class="label preField reqMark" for="tfa_541">${label}</label><br><div class="inputWrapper"><input type="text" id="tfa_541" name="tfa_541" disabled placeholder="Disabled on this test page"></div></div>`
  }
  if (!e) return ''
  const { id } = e
  switch (e.kind) {
    case 'radio': {
      const choices = codesFor(f, e).map((code, i) => `<span class="oneChoice"><input type="radio" value="${code}" id="${code}" name="${id}"><label class="label postField" id="${code}-L" for="${code}"><span class="input-radio-faux"></span>${esc(f.options[i])}</label></span>`).join('')
      return `<div class="oneField" id="${id}-D" role="radiogroup" aria-labelledby="${id}-L"><label id="${id}-L" class="label preField${req(f)}">${label}</label><br><div class="inputWrapper"><span id="${id}" class="choices horizontal">${choices}</span></div></div>`
    }
    case 'select':
    case 'multi': {
      const opts = codesFor(f, e).map((code, i) => `<option value="${code}" id="${code}">${esc(f.options[i])}</option>`).join('')
      const multiple = e.kind === 'multi' ? ` multiple name="${id}[]" size="6"` : ` name="${id}"`
      return `<div class="oneField" id="${id}-D"><label id="${id}-L" class="label preField${req(f)}" for="${id}">${label}</label><br><div class="inputWrapper"><select id="${id}"${multiple}><option value="">Please select...</option>${opts}</select></div></div>`
    }
    case 'file':
      return `<div class="oneField" id="${id}-D"><label id="${id}-L" class="label preField${req(f)}" for="${id}">${label}</label><br><div class="inputWrapper"><input type="file" id="${id}" name="${id}"></div></div>`
    case 'checkbox':
      return `<div class="oneField" id="${id}-D"><span class="oneChoice"><input type="checkbox" value="${id}" id="${id}" name="${id}"><label class="label postField" for="${id}"><span class="input-checkbox-faux"></span>${label}*</label></span></div>`
    default: {
      const input = f.type === 'textarea'
        ? `<textarea id="${id}" name="${id}"${f.maxLength ? ` maxlength="${f.maxLength}"` : ''}></textarea>`
        : `<input type="text" id="${id}" name="${id}" value="">`
      return `<div class="oneField" id="${id}-D"><label id="${id}-L" class="label preField${req(f)}" for="${id}">${label}</label><br><div class="inputWrapper">${input}</div></div>`
    }
  }
}

const sections = SECTIONS.map((s) => {
  const inner = s.fields.map((f) => {
    if (f.type === 'subheading') return `<h4>${esc(f.text)}</h4>`
    if (f.type === 'paragraph') return `<p class="htmlContent">${esc(f.text)}</p>`
    return control(f)
  }).join('\n      ')
  return `    <fieldset id="sec_${s.id}" class="section"><legend>${esc(s.title)}</legend>${s.intro ? `<p class="htmlContent">${esc(s.intro)}</p>` : ''}\n      ${inner}\n    </fieldset>`
}).join('\n')

// Sample applicant, translated into the live form's element ids and option codes.
const fill = []
for (const [fieldId, value] of Object.entries(SAMPLE_APPLICANT)) {
  const e = FORM_ASSEMBLY_MAP[fieldId]
  const f = SECTIONS.flatMap((s) => s.fields).find((x) => x.id === fieldId)
  if (!e || !f) continue
  const code = (v) => e.codes?.[f.options.indexOf(v)]
  if (e.kind === 'radio') fill.push({ id: code(value), check: true })
  else if (e.kind === 'select') fill.push({ id: e.id, value: code(value) })
  else if (e.kind === 'multi') fill.push({ id: e.id, values: value.map(code) })
  else fill.push({ id: e.id, value })
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Add-on test page · Invest Detroit copilot (prototype)</title>
<!-- Generated by tools/build-embed-test-page.mjs. Do not edit by hand. -->
<style>
  body { margin: 0; font: 15px/1.5 Arial, sans-serif; color: #333; background: #fff; }
  .test-banner { background: #1f2423; color: #fff; padding: 12px 16px; font-size: 14px; }
  .test-banner strong { color: #fcaf17; }
  .test-tools { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 16px; background: #f4f5f4; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 10; }
  .test-tools button { font: 14px Arial, sans-serif; padding: 8px 12px; border: 1px solid #333; background: #fff; cursor: pointer; }
  .test-tools span { align-self: center; font-size: 13px; color: #555; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
  .loading { padding: 40px 0; text-align: center; color: #777; }
  .wForm fieldset { border: 0; border-top: 1px solid #ccc; padding: 12px 0 0; margin: 20px 0 0; min-width: 0; }
  .wForm legend { font-weight: bold; font-size: 18px; padding-right: 8px; }
  .oneField { margin: 12px 0; }
  .label.preField { font-weight: bold; }
  .reqMark::after { content: " *"; color: #c0392b; }
  .wForm input[type=text], .wForm textarea, .wForm select { width: 100%; max-width: 100%; padding: 8px; font: 15px Arial, sans-serif; border: 1px solid #aaa; box-sizing: border-box; }
  .choices .oneChoice { display: inline-block; margin-right: 16px; }
  .actions { text-align: center; margin: 24px 0; }
  .primaryAction { font: bold 16px Arial, sans-serif; padding: 12px 40px; background: #fcaf17; border: 0; cursor: pointer; }
  .primaryAction:disabled { background: #ddd; color: #888; cursor: not-allowed; }
  .submitted { background: #e5f4ea; color: #1e7b45; padding: 12px; font-weight: bold; text-align: center; }
  /* Stand-in for the spam-check badge the live page shows in the bottom-right corner. */
  .badge-standin { position: fixed; right: 0; bottom: 14px; background: #fff; border: 1px solid #aaa; padding: 8px 12px; font-size: 11px; box-shadow: 0 0 5px rgba(0,0,0,.2); }
</style>
</head>
<body>
<div class="test-banner"><strong>Add-on test page.</strong> A plain copy of the code behind Invest Detroit's FormAssembly intake form (form ${FORM_ASSEMBLY_FORM_ID}), with our add-on script loaded. Not the official form, and nothing is sent. Follow-up questions are always shown here; on the real form they appear only when they apply.</div>
<div class="test-tools">
  <button type="button" id="test-fill">Fill with sample applicant</button>
  <button type="button" id="test-translate">Simulate Spanish translation</button>
  <span id="test-status">Loading form…</span>
</div>
<div class="wrap">
  <div id="form-slot"><p class="loading">Loading form… (the real form also loads a moment after the page)</p></div>
</div>
<div class="badge-standin" aria-hidden="true">Spam check badge</div>

<template id="form-template">
<div class="wFormContainer"><div class="wForm" id="${FORM_ASSEMBLY_FORM_ID}-WRPR">
  <form method="post" class="hintsBelow labelsAbove" id="${FORM_ASSEMBLY_FORM_ID}" enctype="multipart/form-data" novalidate>
    <h1 style="text-align:center">Real Estate/C&amp;I In-Take Form</h1>
    ${FORM_INTRO.map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
${sections}
    <!-- Hidden field Invest Detroit adds in FormAssembly for the staff summary (any tfa id works). -->
    <input type="hidden" id="tfa_copilot_summary" name="tfa_copilot_summary" value="">
    <div class="actions" id="${FORM_ASSEMBLY_FORM_ID}-A"><input type="submit" data-label="Submit" class="primaryAction" id="${FORM_ASSEMBLY_SUBMIT_ID}" value="Submit"></div>
  </form>
</div></div>
</template>

<script>
  // Stand-in for FormAssembly: the form arrives a moment after the page, and has its own
  // submit handler, which must still run after the add-on allows the submit.
  var SAMPLE = ${JSON.stringify(fill)};
  var testStatus = document.getElementById('test-status');
  setTimeout(function () {
    var slot = document.getElementById('form-slot');
    slot.innerHTML = '';
    slot.appendChild(document.getElementById('form-template').content.cloneNode(true));
    testStatus.textContent = 'Form loaded.';
    document.getElementById('${FORM_ASSEMBLY_FORM_ID}').addEventListener('submit', function (e) {
      e.preventDefault();
      var done = document.createElement('p');
      done.className = 'submitted';
      done.textContent = 'The form\\'s own Submit handler ran: on the real site, this is where FormAssembly would send the application. (Test page: nothing was sent.)';
      var summary = document.createElement('pre');
      summary.id = 'test-summary';
      summary.style.cssText = 'white-space:pre-wrap;background:#f4f5f4;padding:12px;font-size:13px';
      summary.textContent = 'Hidden staff-summary field received:\\n\\n' + (document.getElementById('tfa_copilot_summary').value || '(empty)');
      this.querySelector('.actions').after(done, summary);
    });
  }, 800);

  function fire(el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  document.getElementById('test-fill').addEventListener('click', function () {
    SAMPLE.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (!el) return;
      if (s.check) el.checked = true;
      else if (s.values) Array.prototype.forEach.call(el.options, function (o) { o.selected = s.values.indexOf(o.value) !== -1; });
      else el.value = s.value;
      fire(el);
    });
    ['${FORM_ASSEMBLY_MAP.ack_truthful.id}', '${FORM_ASSEMBLY_MAP.ack_not_guaranteed.id}', '${FORM_ASSEMBLY_MAP.ack_credit.id}'].forEach(function (id) { var el = document.getElementById(id); el.checked = true; fire(el); });
    testStatus.textContent = 'Sample applicant filled in. Attach any file to the 3 required documents, then review.';
  });
  var WORDS = { 'Yes': 'Sí', 'No': 'No', 'Prefer not to say': 'Prefiero no decirlo', 'Retail': 'Comercio minorista', 'Mixed Use': 'Uso mixto', 'Other': 'Otro', 'None': 'Ninguno' };
  document.getElementById('test-translate').addEventListener('click', function () {
    document.querySelectorAll('.postField, option').forEach(function (el) {
      var text = el.textContent.trim();
      if (WORDS[text]) { el.lastChild.textContent = WORDS[text]; }
    });
    testStatus.textContent = 'Answer labels translated to Spanish (like the site\\'s translation menu). Reviews should still work.';
  });
</script>
<script src="/embed/copilot.js" defer data-launcher-bottom="84px" data-summary-field="tfa_copilot_summary" data-fill-helpers="true" data-progress-top="55px"></script>
</body>
</html>
`
writeFileSync(new URL('../public/embed-test/index.html', import.meta.url), page)
console.log('Wrote public/embed-test/index.html')
