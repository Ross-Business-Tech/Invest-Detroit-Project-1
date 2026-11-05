// Knowledge entries: what Invest Detroit's own documents say about the lending process, the
// Real Estate program, the Small Business program and the organization.
//
// Sources (see SOURCES in config.js):
//   re_flyer       Real Estate Support flyer        (this form's program)
//   sb_flyer       Small Business Support flyer      (a DIFFERENT program: always labeled as such)
//   lending_guide  Lending Process & Closing Guide   (draft: staff should confirm)
//   about_id       Who is Invest Detroit?
//
// Rules for this file:
//   - Published rates, fees and loan sizes may be quoted, but only as ranges from a named source,
//     with "subject to change", and never as a quote for the applicant's own loan.
//   - Whether a project is approved or qualifies is never answered here (TOPICS.staff_only).
//   - `program` says which program a fact belongs to, so Small Business numbers are never
//     presented as rules for this Real Estate form.
//
// PRIORITY: the four documents above win. Facts from the team's web research
// (docs/RESEARCH-NOTES.md) only fill gaps the documents don't cover, and never replace them.
//
// Same shape as the field guide topics: { id, program, keywords, explain, example?, mistakes?,
// source_ids, needs_staff?, published_terms? }. English only for now.

const CONTACT = 'You can reach the Invest Detroit team at info@investdetroit.com or 313.259.6368.'
const SUBJECT = 'These are published ranges, not a quote for your project. Terms and conditions are subject to change, and your own terms would be set out in a term sheet.'

export const KNOWLEDGE = [
  // ---- Lending process (applies to every program) -------------------------------------------
  {
    id: 'process_timeline',
    program: 'all',
    keywords: ['how long', 'timeline', 'how many weeks', 'how many months', 'what happens next', 'after i submit', 'after submitting', 'lending process', 'loan process', 'review process', 'when will i hear', 'when will i know', 'cuánto tiempo', 'cuánto tarda', 'proceso', 'كم من الوقت', 'المراحل', 'কত সময়', 'কতদিন', 'প্রক্রিয়া', '多长时间', '多久', '流程'],
    explain: 'This intake form is a first, pre-qualification step. Invest Detroit says the first step in its financing process is a discussion with a team member about your project, so expect someone to contact you after you submit. Every loan is different, but the lending guide then describes four stages:\n1. Screening (1–2 weeks): you share the project overview, budget, financials and team; Invest Detroit checks mission fit and feasibility.\n2. Term sheet (2–6 weeks): you send projections and extra information; Invest Detroit does a site visit, structures the loan and reviews credit. You receive an indicative term sheet.\n3. Commitment (5–10 weeks): you provide due diligence documents; Invest Detroit underwrites the loan and its committee decides. You receive a commitment letter.\n4. Closing (4–6 weeks): you complete the closing checklist; loan documents are signed and the loan is funded.\nComplex real estate and construction projects can take longer.',
    source_ids: ['lending_guide', 'developer_sheet'],
  },
  {
    id: 'speed_up',
    program: 'all',
    keywords: ['speed up', 'move forward', 'go smoothly', 'avoid delays', 'más rápido', 'أسرع', 'تأخير', 'দ্রুত', '更快', '加快'],
    explain: 'The lending guide says the fastest closings happen when borrowers:\n• send complete and accurate documents,\n• answer information requests promptly,\n• name their lawyer and accountant early,\n• keep financial statements up to date, and\n• tell Invest Detroit right away about changes to scope, budget, ownership, construction timing or other financing.\nKeeping all your documents in one folder and checking insurance and legal documents early also helps.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'underwriting',
    program: 'all',
    keywords: ['underwriting', 'underwrite', 'underwriter', 'credit review', 'what do you look at', 'what do they look at', 'how do you evaluate', 'how is my application evaluated', 'suscripción', 'evaluación', 'الاكتتاب', 'التقييم', 'আন্ডাররাইটিং', 'মূল্যায়ন', '核保', '审核'],
    explain: 'Underwriting is Invest Detroit\'s detailed review of a loan request. The lending guide lists what it looks at: the borrower\'s financial strength, management capacity, project feasibility, cash flow projections, collateral and repayment sources, and community and economic impact. The aim is a loan structure that supports the project\'s long-term success. Only the Invest Detroit team can say how your project would be assessed.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'site_visit',
    program: 'all',
    keywords: ['site visit', 'visit my', 'visit the property', 'visit the site', 'come to the property', 'inspection', 'visita', 'زيارة', 'পরিদর্শন', '实地考察', '现场'],
    explain: 'Often, yes. The lending guide says Invest Detroit may visit the site during the review to understand operations, how ready the project is and market conditions. It usually happens in the term sheet stage. For construction loans, inspections are also used before money is advanced.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'after_approval',
    program: 'all',
    keywords: ['after approval', 'after my loan is approved', 'once approved', 'if approved', 'if i am approved', 'commitment letter', 'term sheet', 'carta de compromiso', 'خطاب الالتزام', 'কমিটমেন্ট লেটার', '承诺函', '条款清单'],
    explain: 'A term sheet is an early, non-final outline of the proposed loan (amount, rate, fees, term and conditions). It is usually not a promise to lend: the FDIC describes a term sheet as a summary of basic terms that does "not constitute a commitment to lend". A commitment letter comes after underwriting and committee approval. After approval, the lending guide says: a commitment letter is issued, due diligence requirements are finalized, legal documents are prepared, the remaining closing conditions are met, and then the loan documents are signed and funds are disbursed.',
    source_ids: ['lending_guide', 'fdic_terms'],
  },
  {
    id: 'closing_checklist',
    program: 'all',
    keywords: ['due diligence', 'closing checklist', 'closing documents', 'what do i need to close', 'to close', 'title work', 'appraisal', 'zoning', 'w-9', 'operating agreement', 'articles of incorporation', 'articles of organization', 'bylaws', 'insurance certificate', 'proof of equity', 'debida diligencia', 'العناية الواجبة', 'ডিউ ডিলিজেন্স', '尽职调查'],
    explain: 'You don\'t need these to submit this form. They come later, before closing. The lending guide\'s closing checklist includes:\n• Organization: articles of incorporation or organization, bylaws or operating agreement, W-9, good standing certificate, borrowing resolution.\n• Financial: current financial statements, tax returns, personal financial statements (if applicable), proof of your equity contribution.\n• Property: title commitment, survey, appraisal, environmental reports, zoning evidence, leases and contracts.\n• Construction (if applicable): plans and specifications, construction contract, budget and sources/uses, permits, insurance certificates, draw schedule.\n• At closing: signed loan documents, payment of closing fees, wire/ACH instructions and proof of insurance.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'construction_timing',
    program: 'all',
    keywords: ['start construction', 'begin construction', 'start building', 'start work', 'start the work', 'start renovating', 'begin work', 'break ground', 'before closing', 'already started', 'empezar la construcción', 'بدء البناء', 'নির্মাণ শুরু', '开工', '开始施工'],
    explain: 'Don\'t start construction before the loan closes unless Invest Detroit has specifically approved it in writing. The lending guide warns that starting early can affect lien rights, project costs and the financing requirements. If work has already started, tell the team now.',
    mistakes: ['Signing a contractor and starting work while the application is still under review.'],
    source_ids: ['lending_guide'],
    needs_staff: true,
  },
  {
    id: 'disbursement',
    program: 'all',
    keywords: ['disburse', 'disbursed', 'disbursement', 'draw', 'draws', 'draw request', 'draw schedule', 'get the money', 'receive the money', 'receive the funds', 'when are funds', 'paid out', 'desembolso', 'صرف', 'السحب', 'বিতরণ', 'ড্র', '放款', '提款'],
    explain: 'It depends on the loan. For construction loans, money is usually advanced in stages ("draws") based on approved draw requests, inspections and supporting paperwork, following a draw schedule agreed before closing. For term loans and acquisitions, funding generally happens at closing.',
    source_ids: ['lending_guide'],
  },
  {
    id: 'after_closing',
    program: 'all',
    keywords: ['after closing', 'after the loan closes', 'post-closing', 'reporting requirements', 'después del cierre', 'بعد الإغلاق', 'ক্লোজিংয়ের পর', '交割后'],
    explain: 'Invest Detroit stays your financing partner for the life of the loan. The lending guide lists typical ongoing obligations: financial reporting, project progress reports, insurance renewals, compliance certifications and, for construction loans, draw submissions. Invest Detroit\'s 2020 small business process sheet adds that some borrowers take part in post-closing technical assistance.',
    source_ids: ['lending_guide', 'sb_process_2020'],
  },

  // ---- Real Estate program (this form) -------------------------------------------------------
  {
    id: 're_rates_fees',
    program: 'real_estate',
    published_terms: true,
    keywords: ['interest rate', 'interest rates', 'rate', 'rates', 'pricing', 'apr', 'fee', 'fees', 'closing costs', 'closing fees', 'application fee', 'how much does the loan cost', 'cost of the loan', 'tasa', 'tasa de interés', 'comisiones', 'cargos', 'فائدة', 'سعر الفائدة', 'رسوم', 'সুদ', 'সুদের হার', 'ফি', '利率', '费用', '手续费'],
    explain: 'Invest Detroit\'s Real Estate Support flyer lists:\n• Loan pricing: typically 8%–9.5%.\n• Fees: 1%–3%. Fees can apply for administration and servicing, extensions, non-use and conversion, as applicable.\nThe lending guide adds that closing costs vary and may include commitment, documentation and legal fees, third-party reports (such as an appraisal or environmental report), and title and recording fees. ' + SUBJECT + ' The Invest Detroit team can tell you what would apply to your project.',
    source_ids: ['re_flyer', 'lending_guide'],
  },
  {
    id: 're_loan_size',
    program: 'real_estate',
    published_terms: true,
    keywords: ['how much can i borrow', 'how much can i ask', 'loan size', 'minimum loan', 'maximum loan', 'smallest loan', 'largest loan', 'transaction size', 'loan range', 'monto mínimo', 'monto máximo', 'cuánto puedo pedir', 'الحد الأدنى', 'الحد الأقصى', 'সর্বনিম্ন', 'সর্বোচ্চ', '最低', '最高', '贷款额度'],
    explain: 'The Real Estate Support flyer gives a typical transaction size of $150,000 to $2,500,000. A request outside that range is worth discussing with the team first. Invest Detroit often lends alongside other lenders, so the loan is usually only part of the total budget. ' + SUBJECT,
    source_ids: ['re_flyer'],
  },
  {
    id: 're_loan_terms',
    program: 'real_estate',
    published_terms: true,
    keywords: ['loan term', 'loan terms', 'how many years', 'length of the loan', 'repay', 'repayment', 'pay back', 'maturity', 'plazo', 'مدة القرض', 'السداد', 'মেয়াদ', 'পরিশোধ', '期限', '还款'],
    explain: 'The Real Estate Support flyer says terms are specific to each loan product:\n• Acquisition, predevelopment and bridge loans: typically 1 to 3 years.\n• Construction and term loans: 6 months to 7 years.\nThe program supports acquisition, predevelopment, construction, term and bridge loans. ' + SUBJECT,
    source_ids: ['re_flyer'],
  },
  {
    id: 're_collateral',
    program: 'real_estate',
    keywords: ['collateral', 'guarantee', 'guarantees', 'guarantor', 'personal guarantee', 'mortgage', 'garantía', 'aval', 'ضمان', 'كفالة', 'জামানত', 'গ্যারান্টি', '抵押', '担保'],
    explain: 'The Real Estate Support flyer says loans are usually secured by a senior or subordinate mortgage on the property, or a pledge of business assets, plus guarantees from the principals (the main owners). "Senior" means first in line to be repaid; "subordinate" means behind another lender. A personal guarantee is an owner\'s promise to repay the loan personally if the business doesn\'t. Invest Detroit doesn\'t publish which owners must guarantee (for comparison, the SBA 7(a) program requires owners of 20% or more), so ask the team. This is why a Personal Financial Statement can be requested.',
    source_ids: ['re_flyer'],
  },
  {
    id: 're_eligibility',
    program: 'real_estate',
    keywords: ['eligible', 'eligibility', 'who can apply', 'experience', 'new developer', 'first-time developer', 'first time developer', 'what kind of projects', 'what projects', 'requisitos', 'experiencia', 'الشروط', 'الخبرة', 'শর্ত', 'অভিজ্ঞতা', '条件', '经验'],
    explain: 'The Real Estate Support flyer says financing typically goes to borrowers with successful prior experience, demonstrated financial strength and a successful operating model. New developers and startups can be eligible if they have relevant experience, a viable business plan and opportunities for technical support. The program finances multi-family residential, mixed-use and commercial projects, with a focus on targeted Detroit neighborhoods (including the Strategic Neighborhood Fund areas). Invest Detroit works with both established and emerging developers; its 2021 developer sheet said it prioritizes teams led by developers of color or Detroit residents. The form also asks some yes/no questions, such as whether the project is inside Detroit\'s city limits. Whether your project qualifies is decided only by the Invest Detroit team after review. ' + CONTACT,
    source_ids: ['re_flyer', 'developer_sheet', 'intake_form_v59'],
    needs_staff: true,
  },
  {
    id: 'which_program',
    program: 'all',
    keywords: ['right form', 'wrong form', 'which form', 'which program', 'right program', 'what program', 'small business', 'c&i', 'commercial and industrial', 'equipment', 'inventory', 'furniture', 'fixtures', 'owner-occupied', 'storefront', 'pequeña empresa', 'pequeño negocio', 'الأعمال الصغيرة', 'ছোট ব্যবসা', '小企业'],
    explain: 'This form is for Invest Detroit\'s Real Estate and Commercial & Industrial (C&I) lending: buying, developing, building or refinancing property such as apartments, mixed-use, retail, office or industrial space.\nInvest Detroit\'s Commercial and Industrial page describes secured business credit for commercial and industrial purposes, such as working capital advances, term business loans and equipment financing. It has its own two-step intake form (a pre-application, a call with the team, then the full C&I form), which asks for a business plan or pitch deck and financial projections. As a rule of thumb (not official policy): use this form for a building or development project, and the C&I form to finance an operating business. Its only published fact sheet (February 2023, possibly outdated) lists loans of $150,000–$2,500,000, pricing 7%–9%, fees 1%–3%, and terms of 1–3 years for acquisition, equipment and working capital or 6 months–5 years for construction and term loans; subject to change, so confirm with the team.\nVenture capital goes to ID Ventures (idventures.com).\nIf you mainly need money for a smaller business you run (equipment, furniture, fixtures, inventory, or renovating or buying the space your own business uses), Invest Detroit\'s separate Small Business program may fit better. Its flyer lists: loans of $50,000–$750,000 (average $125,000–$200,000), pricing 8%–10%, a fee of at least $1,500 or 1% of the loan plus third-party costs, a free pre-application and a $250 non-refundable assessment fee with the formal application, at least 2 employees, a Detroit location, and at least 10% cash equity. Those Small Business terms do not apply to this form, and they are subject to change. The team can tell you which program fits: ' + CONTACT.replace('You can reach the Invest Detroit team at ', ''),
    source_ids: ['program_overviews', 'cni_page', 'cni_factsheet_2023', 'sb_flyer', 'id_ventures'],
    published_terms: true,
  },
  {
    id: 'technical_assistance',
    program: 'real_estate',
    keywords: ['technical assistance', 'technical support', 'help with permits', 'permitting', 'community engagement', 'city requirements', 'coaching', 'mentor', 'mentorship', 'asistencia técnica', 'permisos', 'المساعدة الفنية', 'التصاريح', 'কারিগরি সহায়তা', 'অনুমতিপত্র', '技术援助', '许可证'],
    explain: 'Besides lending, Invest Detroit\'s 2021 developer sheet says it offers technical assistance with community engagement, permitting, city requirements and other steps that matter for a project\'s success. The Real Estate flyer also mentions "opportunities for technical support" for newer developers. Ask the team what help is available for your project. ' + CONTACT,
    source_ids: ['developer_sheet', 're_flyer'],
  },
  {
    id: 'snf',
    program: 'real_estate',
    keywords: ['strategic neighborhood fund', 'snf', 'target neighborhoods', 'targeted neighborhoods', 'which neighborhoods', 'my neighborhood', 'fondo estratégico', 'الأحياء المستهدفة', 'লক্ষ্য এলাকা', '目标社区'],
    explain: 'The Strategic Neighborhood Fund (SNF) is led by the Mayor\'s office, the City of Detroit and Invest Detroit, with philanthropic funders. It was established on March 29, 2016 and expanded to 10 neighborhoods on April 26, 2018. Its five pillars are neighborhood framework plans, commercial and mixed-use development, streetscapes, parks and open space, and housing stabilization. Invest Detroit\'s page names areas such as Livernois-McNichols, East Warren, Gratiot/7-Mile and Grand River, but doesn\'t publish an official list of the ten. Invest Detroit\'s flyers say some loan programs are limited to these areas. Developers seeking financing use this form; the team can tell you whether your address is in an SNF area.',
    source_ids: ['re_flyer', 'snf_page', 'snf_overview'],
  },

  // ---- About Invest Detroit -----------------------------------------------------------------
  {
    id: 'about_id',
    program: 'all',
    keywords: ['who is invest detroit', 'what is invest detroit', 'about invest detroit', 'cdfi', 'nonprofit', 'non-profit', '501(c)(3)', 'quién es invest detroit', 'qué es invest detroit', 'من هي', 'কারা', '是什么机构'],
    explain: 'Invest Detroit is a nonprofit (501(c)(3)) Community Development Financial Institution (CDFI) that has supported economic growth in Detroit and Michigan for over 25 years. It lends to and invests in real estate and business projects that struggle to find traditional financing. It has four programs: Real Estate, Small Business, Commercial and Industrial, and Venture Investment. Its goals are density (attracting people to Detroit), jobs for Detroit residents, thriving neighborhoods, and inclusivity (affordable housing, and making sure minorities, women and immigrants share in economic growth). Its "Who is Invest Detroit?" sheet reports, since inception: $593 million deployed, $3.9 billion leveraged, 5,622 housing units, 984 projects and 16,610 jobs created or retained. A CDFI is a lender certified by the U.S. Treasury\'s CDFI Fund: its main mission is community development, it serves low-income or underserved communities, and it offers help such as technical assistance along with financing. It is not a bank. Venture investment is run by ID Ventures (idventures.com).',
    source_ids: ['about_id', 'cdfi_fund', 'id_ventures'],
  },

  // ---- Filled from research (documents are silent on these) ---------------------------------
  {
    id: 'other_funds',
    program: 'all',
    keywords: ['property owner fund', 'rental relief', 'motor city contractor fund', 'contractor fund', 'grants', 'grant', 'spark grant', 'developer engagement grant', 'other funds', 'subvención', 'منحة', 'অনুদান', '补助'],
    explain: 'Invest Detroit\'s lending programs are loans. Other funds you may see mentioned:\n• The Property Owner Rental Relief Fund was a 2020 COVID-19 grant and is closed.\n• The Motor City Contractor Fund is named on Invest Detroit\'s website, but no terms or application are published, and this form is not its application.\n• The Strategic Neighborhood Fund page mentions Spark Grants and Developer Engagement Grants without an application process.\nAsk the team about any of these. ' + CONTACT,
    source_ids: ['id_website', 'snf_page'],
    needs_staff: true,
  },
  {
    id: 'later_documents',
    program: 'all',
    keywords: ['document checklist', 'other documents', 'what else will you need', 'what else do you need', 'more documents', 'additional documents', 'formal application', 'full application', 'after the intake', 'what will you ask for'],
    explain: 'This form only needs the three required documents. Later, Invest Detroit asks for more, depending on the loan. The lending guide\'s closing checklist is the main list for real estate. Invest Detroit\'s 2020 small business checklist gives a sense of the rest: business plan (with organization chart and marketing plan), project or construction budget, all funding sources, proof of your equity, 1–3 years of historical financial statements and tax returns, 1–3 months of bank statements, 1–3 years of projections with assumptions, personal financial statements for guarantors, operating agreement or bylaws, articles, general contractor agreement, lease or letter of intent, and (if applicable) environmental report, appraisal and architect drawings.',
    source_ids: ['lending_guide', 'sb_process_2020'],
  },
  {
    id: 'good_standing',
    program: 'general_education',
    keywords: ['certificate of good standing', 'good standing', 'restore good standing', 'annual statement', 'annual report', 'mibusiness registry', 'milogin'],
    explain: 'A Certificate of Good Standing from Michigan LARA shows your company is active and up to date on state filings. It is on the lending guide\'s closing checklist. To get one: go to michigan.gov/fileonline, sign in with a MiLogin for Business account, search for your entity, choose "Request Certificate", then the Certificate of Good Standing, and pay by card; it is emailed to you. LLCs must file an annual statement and corporations an annual report each year after formation. A company that missed filings can restore its good standing by filing the missing reports and a restoration certificate (fees apply). Check current fees on LARA\'s site.',
    source_ids: ['lara_filing', 'lending_guide'],
  },
  {
    id: 'detroit_permits',
    program: 'general_education',
    keywords: ['building permit', 'building permits', 'permit', 'permits', 'bseed', 'certificate of occupancy', 'certificate of acceptance', 'elaps', 'projectdox', 'inspections', 'permiso de construcción', 'تصريح البناء', 'বিল্ডিং পারমিট', '建筑许可'],
    explain: 'In Detroit, building permits come from the city\'s Buildings, Safety Engineering and Environmental Department (BSEED). The steps: check whether you need a permit (the city has an online tool), find the permit type, apply and pay online through the city\'s eLAPS portal (commercial plans go through ProjectDox and must be sealed by a Michigan-registered architect or engineer), answer reviewers\' comments, post the permit on the property, schedule inspections, and get a Certificate of Acceptance or Occupancy at the end. Help lines: (313) 224-3179 for applications, (313) 224-2372 for BSEED\'s Development Resource Center. The lending guide says not to start construction before the loan closes unless Invest Detroit approves it.',
    source_ids: ['detroit_bseed', 'lending_guide'],
  },
  {
    id: 'discrimination',
    program: 'all',
    keywords: ['discrimination', 'discriminate', 'discriminated', 'civil rights', 'file a complaint', 'discrimination complaint', 'treated unfairly', 'discriminación', 'queja', 'تمييز', 'شكوى', 'বৈষম্য', 'অভিযোগ', '歧视', '投诉'],
    explain: 'Invest Detroit\'s flyers say that, under federal law and U.S. Department of the Treasury policy, it may not discriminate on the basis of race, color, national origin, sex, age or disability. To file a complaint, write to the U.S. Department of the Treasury, Director, Office of Civil Rights and Equal Employment Opportunity, 1500 Pennsylvania Avenue N.W., Washington, DC 20220; call (202) 622-1160; or email crcomplaints@treasury.gov.',
    source_ids: ['re_flyer', 'sb_flyer'],
  },
]
