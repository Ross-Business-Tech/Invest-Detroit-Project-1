// Rebuilds the backend guide PDF from its Markdown source.
//   node tools/build-backend-guide.mjs [source.md] [output.pdf]
// Defaults: docs/handoff/BACKEND-GUIDE.md -> docs/handoff/Invest-Detroit-Copilot-Backend-Guide.pdf
// Needs pandoc and Playwright's Chromium. Fonts: Caladea (headings), Carlito (body), Inter (footer).

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const src = resolve(process.argv[2] || 'docs/handoff/BACKEND-GUIDE.md')
const out = resolve(process.argv[3] || 'docs/handoff/Invest-Detroit-Copilot-Backend-Guide.pdf')

const meta = readFileSync(src, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] || ''
const title = meta.match(/title:\s*"(.*)"/)?.[1] || 'Backend guide'

const css = `
  @page { size: letter; margin: 0.75in 0.8in 0.8in; }
  body { font-family: Carlito, Calibri, sans-serif; font-size: 10pt; line-height: 1.5; color: #222; }
  header#title-block-header { border-top: 1px solid #ddd; padding-top: 14pt; margin-bottom: 18pt; border-bottom: 3px solid #f2b705; padding-bottom: 12pt; }
  h1.title { border-top: none; padding-top: 0; font-family: Caladea, Cambria, serif; font-size: 24pt; line-height: 1.3; margin: 0 0 8pt; }
  p.subtitle { color: #555; font-size: 10.5pt; margin: 0; }
  h1 { font-family: Caladea, Cambria, serif; font-size: 16pt; margin: 22pt 0 8pt; padding-top: 10pt; border-top: 1px solid #ddd; break-after: avoid; }
  h2 { font-family: Caladea, Cambria, serif; font-size: 12.5pt; margin: 14pt 0 6pt; break-after: avoid; }
  p, li { margin: 0 0 6pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 8.5pt; }
  th { background: #222; color: #fff; text-align: left; font-weight: bold; padding: 5pt 7pt; }
  td { border-bottom: 1px solid #ddd; padding: 5pt 7pt; vertical-align: top; }
  tr:nth-child(even) td { background: #f7f7f7; }
  tr { break-inside: avoid; }
  code { font-family: 'DejaVu Sans Mono', monospace; font-size: 8pt; background: #eee; padding: 1pt 3pt; border-radius: 2pt; }
  a { color: #222; }
`

const html = execFileSync('pandoc', [src, '-f', 'markdown', '-t', 'html5', '-s', '--metadata', `pagetitle=${title}`], { encoding: 'utf8' })
  .replace(/<style>[\s\S]*?<\/style>/, '') // drop pandoc's default look
  .replace('</head>', `<style>${css}</style></head>`)

const footer = `<div style="font-family: Inter, sans-serif; font-size: 6.5pt; color: #444; width: 100%; padding: 0 0.8in; display: flex; justify-content: space-between;">
  <span>${title.replace(/&/g, '&amp;')} · Invest Detroit Team #1</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'load' })
await page.pdf({ path: out, format: 'Letter', displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer, preferCSSPageSize: true, printBackground: true })
await browser.close()
console.log(`Wrote ${out}`)
