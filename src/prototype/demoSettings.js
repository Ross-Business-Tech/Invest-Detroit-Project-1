// Demo-only settings for our replica of Invest Detroit's page.
// None of this is part of the add-on that goes on Invest Detroit's real form.

// The "Fill with sample applicant" button above the form fills every answer with a made-up
// applicant (see sampleApplicant.js), so a demo can skip straight to "Review my application".
//
// To turn it off, pick one:
//   - Change `true` to `false` on the last line below, or
//   - Set VITE_SHOW_SAMPLE_BUTTON=false in the host's environment settings (on Render:
//     Environment), then redeploy. Vite reads it when the site is built.
//
// To delete it for good: delete this file, then remove the lines marked
// "DEMO: sample applicant button" in IntakeForm.jsx. Keep sampleApplicant.js:
// the automated tests use it as test data.
const fromHost = import.meta.env?.VITE_SHOW_SAMPLE_BUTTON
export const SHOW_SAMPLE_APPLICANT_BUTTON = fromHost === undefined || fromHost === '' ? true : fromHost !== 'false'
