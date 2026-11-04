// Field guide: plain-language help for the questions applicants most often get wrong.
//
// STATUS: DRAFT written by the student team from the public form and four Invest Detroit
// documents (Real Estate and Small Business flyers, the lending process guide, "Who is Invest
// Detroit?"). It explains what each question asks and what happens later in the process.
// Published rates, fees and loan sizes may be quoted as ranges with their source and "subject
// to change" (see knowledge.js). It must never decide approval or whether a project qualifies:
// those questions go to staff (TOPICS.staff_only). Invest Detroit should review and own this
// content before real use (brief: "staff-owned set of canonical field definitions").
//
// Used today by the chat's built-in answers (assistant.js guideTransport), and later as the
// approved source material a real AI model answers from.
//
// English only for now. The chat says so when another language is selected.

import { KNOWLEDGE } from './knowledge.js'
import { GLOSSARY } from './glossary.js'

export const GUIDE_STATUS = 'draft'

const CONTACT = 'You can reach the Invest Detroit team at info@investdetroit.com or 313.259.6368.'
const INTAKE = ['intake_form_v59']
const RE = ['intake_form_v59', 're_flyer']
const GUIDE = ['intake_form_v59', 'lending_guide']

const sqft = {
  explain: 'Gross square footage is the whole floor area inside the outside walls, including hallways, stairs, walls and shared spaces. Net square footage is only the usable or rentable space, so it is usually smaller.',
  example: 'A retail floor might be 3,200 sq ft gross but 2,900 sq ft net.',
  mistakes: ['Putting the net number in the gross box, or the other way around.', 'Typing commas or "sq ft". The box only takes numbers.'],
  keywords: ['gross', 'net', 'square', 'sqft', 'footage', 'area', 'bruto', 'neto', 'superficie', 'الإجمالية', 'الصافية', 'المساحة', 'গ্রস', 'নেট', 'বর্গফুট', '毛面积', '净面积', '面积'],
  source_ids: INTAKE,
}

const jobs = {
  explain: 'The form defines part-time as under 35 hours a week and full-time as 35 hours or more. "Currently employ" means your staff today. "New" counts only jobs you will add because of this funding.',
  example: 'If you have 3 full-time staff now and will hire 1 more full-time manager after the loan, enter 3 for current full-time and 1 for new full-time.',
  mistakes: ['Counting the same person as both part-time and full-time.', 'Including construction jobs here. Those have their own question.'],
  keywords: ['part-time', 'full-time', 'employees', 'employ', 'staff', 'hours', 'jobs', 'empleados', 'empleos', 'موظفين', 'وظائف', 'কর্মী', 'চাকরি', '员工', '岗位', '兼职', '全职'],
  source_ids: INTAKE,
}

const ami = {
  explain: 'AMI means Area Median Income: the middle household income for the region, published each year by the U.S. Department of Housing and Urban Development (HUD). A unit "at 60% AMI" is priced to be affordable for a household earning 60% of that income. Enter how many units you expect at each level. Keeping housing affordable is one of Invest Detroit\'s stated goals, so these numbers matter.\nFor Detroit (the Detroit-Warren-Livonia area), HUD\'s FY2026 median family income is $104,800 for a family of 4. HUD\'s tax-credit (MTSP) limits for a household of 4 are $52,400 at 50% AMI, $62,880 at 60% and $83,840 at 80%. Limits change every May. HUD doesn\'t publish 10%, 100%, 110% or 120% tables, and the form doesn\'t say which table Invest Detroit uses, so ask the team if you\'re unsure where a unit belongs.',
  example: 'A 6-unit building with 2 units at 60% AMI, 2 at 80% and 2 at 100% would enter 2, 2 and 2 in those boxes. Count each unit once, at the level it is restricted to.',
  mistakes: ['Entering percentages instead of numbers of units.', 'Counts that don\'t add up to the total housing units.'],
  keywords: ['ami', 'area median income', 'affordable', 'affordability', 'asequibilidad', 'دخل', 'القدرة', 'সাশ্রয়ী', '收入中位数', '可负担'],
  source_ids: ['intake_form_v59', 'about_id', 'hud_income_limits'],
}

const owners = {
  explain: 'These questions describe the business owners together. Answer for the owners who hold 50% or more of the business. "Prefer not to say" is always an option. The form explains that some of Invest Detroit\'s funders require this reporting. Invest Detroit\'s stated goals include making sure minorities, women and immigrants share in Detroit\'s growth. Invest Detroit\'s Small Business page says its impact questions are for reporting only; it doesn\'t say how this form uses them, so ask the team if that matters to you.',
  mistakes: ['Answering only for yourself when there are several owners.'],
  keywords: ['owners', 'ownership', '50%', 'veteran', 'immigrant', 'lgbtq', 'returning citizen', 'propietarios', 'مالكي', 'মালিক', '所有人'],
  source_ids: INTAKE,
}

const counts = {
  explain: 'First select every background (or gender) that applies across the owners. A box then appears for each one: enter how many owners identify that way. Each person counts once, so the boxes should add up to the total number of owners.',
  example: 'Two Asian owners and one White owner: enter 2 in the Asian box and 1 in the White box.',
  mistakes: ['Counts that don\'t add up to "How many business owners are there in total?"'],
  keywords: ['ethnic', 'ethnicity', 'background', 'race', 'gender', 'men', 'women', 'nonbinary', 'étnico', 'género', 'العرقية', 'الجنس', 'জাতিগত', 'লিঙ্গ', '族裔', '性别'],
  source_ids: INTAKE,
}

const legal = {
  explain: 'Answer honestly. If you answer Yes, a box appears for details: briefly say what happened and when. How a Yes affects an application is something only the Invest Detroit team can answer.',
  keywords: ['criminal', 'convicted', 'charged', 'judgment', 'lien', 'garnishment', 'child support', 'bankruptcy', 'legal'],
  source_ids: INTAKE,
  needs_staff: true,
}

/** Help for specific questions, keyed by field id (see formDefinition.js). */
export const FIELD_GUIDE = {
  total_budget: {
    explain: 'The full cost of the whole project, from every source combined: buying the property, construction or renovation, soft costs (design, permits, legal and financing fees) and a contingency. It is not just the amount you are asking Invest Detroit for. It should match the total of the Development Budget (sources and uses) you upload, which is reviewed again before closing. Remember to include financing costs: the Real Estate flyer lists fees of 1%–3%, and closing can add legal, appraisal, environmental, title and recording costs (published ranges, subject to change). Bank examiners (OCC) note contingencies usually run 5–10% of the budget.',
    example: 'Buying a building for $400,000, renovating it for $1,000,000, $50,000 in soft costs and a $100,000 contingency is a total budget of $1,550,000.',
    mistakes: ['Entering only the loan amount you want.', 'Leaving out soft costs, loan fees and closing costs, or a contingency.', 'A total that doesn\'t match the development budget you upload.', 'Typing a dollar sign or commas. The box only takes numbers.'],
    keywords: ['budget', 'total budget', 'total cost', 'project cost', 'presupuesto', 'ميزانية', 'الميزانية', 'বাজেট', '预算'],
    source_ids: ['intake_form_v59', 're_flyer', 'lending_guide', 'occ_cre'],
  },
  loan_amount: {
    explain: 'How much you are asking Invest Detroit to lend. It is usually one part of the total budget: Invest Detroit often lends alongside banks and other funders, and your own money and grants cover the rest. The Real Estate Support flyer gives a typical loan size of $150,000 to $2,500,000 (subject to change). If your request is outside that range, it is worth talking to the team first.',
    example: 'Total budget $1,550,000, asking Invest Detroit for $600,000, with $160,000 of your own equity and $790,000 from a bank.',
    mistakes: ['Entering the total budget here.', 'Including money you are asking other lenders for.', 'A loan plus your equity and other funding that doesn\'t add up to the total budget.'],
    keywords: ['loan', 'loan amount', 'borrow', 'requesting', 'préstamo', 'قرض', 'القرض', 'ঋণ', '贷款'],
    source_ids: RE,
  },
  equity_10pct: {
    explain: 'Asks whether you can put in at least 10% of the total expected project cost yourself, as cash or equity. Check the number against your total budget before answering. Before closing you will be asked for proof of your equity contribution (it is on the lending guide\'s closing checklist), so answer based on money you can show. Invest Detroit doesn\'t publish what counts as equity for real estate projects (for example land you already own, a deferred developer fee or grants). The team decides, so if you are unsure, answer as best you can, explain in your summary and ask them.',
    example: 'For a $1,550,000 project, 10% is $155,000.',
    mistakes: ['Answering Yes without working out 10% of your total budget.', 'Counting money you expect to borrow from someone else as your own equity.'],
    keywords: ['10%', 'equity', 'contribution', 'cash', 'down payment', 'aporte', 'capital propio', 'مساهمة', 'ইকুইটি', '出资', '股权'],
    source_ids: GUIDE,
  },
  executive_summary: {
    explain: 'A short description of your business or project (up to 500 characters): what you will build or do, where, your team\'s experience, and why it matters for the neighborhood. Invest Detroit\'s Real Estate flyer says financing typically goes to borrowers with relevant prior experience and a viable plan, and its goals are more people living in Detroit, jobs, thriving neighborhoods and affordable housing, so mention the ones your project supports.',
    example: 'Renovating a vacant two-story building on Grand River into 6 apartments (2 affordable at 60% AMI) above 2 shops. Our team has completed 3 similar rehabs in Detroit. Construction would start spring 2027, after closing.',
    mistakes: ['Writing only a business name or one vague sentence.', 'Leaving out your team\'s experience.', 'Going past 500 characters. The box stops accepting text.'],
    keywords: ['summary', 'executive summary', 'describe', 'description', 'resumen', 'الملخص', 'সারসংক্ষেপ', '概要'],
    source_ids: ['intake_form_v59', 're_flyer', 'about_id'],
  },
  other_lenders: {
    explain: 'Select every lender or funder you are working with, or have applied to, for this project. Choose "None" if there are none. Choose "Other (Please specify)" to type a name that isn\'t listed. Invest Detroit often lends alongside other lenders (its loans can sit behind a bank\'s first mortgage), so listing them helps the team see how the project is financed. Tell the team right away if this changes later.',
    keywords: ['other lenders', 'funders', 'lender', 'prestamistas', 'جهات إقراض', 'ঋণদাতা', '贷款方'],
    source_ids: ['intake_form_v59', 're_flyer', 'lending_guide'],
  },
  community_partners: {
    explain: 'Select any community organizations you are working with on this project, such as a neighborhood development group or business association. Choose "None" if there are none, or "Other (Please specify)" to type a name. Invest Detroit works with neighborhood partners and the City of Detroit on its "thriving neighborhoods" goal, so real partnerships are worth listing.',
    keywords: ['community partners', 'partner', 'partners', 'socio comunitario', 'شركاء', 'অংশীদার', '合作伙伴'],
    source_ids: ['intake_form_v59', 'about_id'],
  },
  real_estate_type: {
    explain: 'The main use of the property after the project. Choose Mixed Use if it combines more than one, like apartments above shops. You will then be asked about each part. The Real Estate program focuses on multi-family residential, mixed-use and commercial projects, especially in targeted Detroit neighborhoods.',
    keywords: ['type of real estate', 'real estate type', 'mixed use', 'retail', 'residential', 'office', 'commercial', 'uso mixto', 'نوع العقار', 'মিশ্র', '房地产类型', '混合用途'],
    source_ids: RE,
  },
  use_of_funds: {
    explain: 'How the loan money would be spent. Select every use that applies.\n• Bridge: short-term money until longer-term funding arrives (typically 1–3 years).\n• Predev/Real Estate Acquisition: costs before construction such as design and permits, or buying the property (typically 1–3 years).\n• Constructed Improvements: building or renovation work (construction loans run 6 months to 7 years; money is usually paid out in draws as work is completed).\n• Tenant Improvement: building out space for a tenant.\n• Working Capital: day-to-day operating costs.\n• Refinance: replacing an existing loan.\nTerms are from the Real Estate Support flyer and are subject to change. If the money is mainly for equipment, inventory or your own business\'s space, ask the team whether the Small Business program fits better.',
    mistakes: ['Starting construction before the loan closes. The lending guide says not to unless Invest Detroit approves it.'],
    keywords: ['use of funds', 'funds be used', 'bridge', 'refinance', 'working capital', 'tenant improvement', 'acquisition', 'predev', 'fondos', 'أموال', 'অর্থ', '资金'],
    source_ids: ['intake_form_v59', 're_flyer', 'lending_guide'],
  },
  construction_jobs: {
    explain: 'Your best estimate of how many construction jobs the build will create. These are counted here only, so leave them out of the direct and indirect job questions. A contractor\'s estimate is a good source. Creating jobs for Detroit residents is one of Invest Detroit\'s goals.',
    keywords: ['construction jobs', 'construction', 'construcción', 'البناء', 'নির্মাণ', '建筑'],
    source_ids: INTAKE,
  },
  retail_rent: {
    explain: 'Your expected rent for the retail space. The box only takes a number and the form doesn\'t name a unit. A common way to quote retail rent is dollars per square foot per year (for example 18). If you use a different unit, ask the Invest Detroit team which one they expect.',
    keywords: ['rent', 'rental rate', 'renta', 'إيجار', 'ভাড়া', '租金'],
    source_ids: INTAKE,
  },
  housing_units: { ...ami, explain: 'How many homes (apartments or houses) the project will create. Below it, split that total by affordability level; the counts should add up to this number. ' + ami.explain },
  retail_gross_sqft: sqft, retail_net_sqft: sqft, office_gross_sqft: sqft, office_net_sqft: sqft,
  commercial_gross_sqft: sqft, commercial_net_sqft: sqft, residential_gross_sqft: sqft, residential_net_sqft: sqft,
  current_pt: jobs, current_ft: jobs, new_pt: jobs, new_ft: jobs,
  indirect_pt: { ...jobs, explain: 'Jobs created by others because of your project, like staff hired by the shops that rent your new retail space. It is an estimate. Leave out construction jobs.' },
  indirect_ft: { ...jobs, explain: 'Jobs created by others because of your project, like staff hired by the shops that rent your new retail space. It is an estimate. Leave out construction jobs.' },
  owners_detroit: owners, owners_veterans: owners, owners_immigrants: owners, owners_lgbtq: owners, owners_returning: owners,
  owners_cdo: {
    explain: 'A Community Development Organization (CDO) is a nonprofit focused on improving a neighborhood, often called a community development corporation (CDC). If one owns part of the business, answer Yes and then enter the percentage it owns, from 0 to 100.',
    keywords: ['cdo', 'community development organization', 'cdc', 'organización de desarrollo', 'منظمة تنمية', 'কমিউনিটি ডেভেলপমেন্ট', '社区发展组织'],
    source_ids: INTAKE,
  },
  owner_count: owners,
  ethnicities: counts, genders: counts,
  mi_entity_id: {
    explain: 'The ID number the State of Michigan (LARA) gave your business when it registered. Search your company\'s exact legal name on LARA\'s Business Entity Search at michigan.gov/corpentitysearch (Michigan moved to the new MiBusiness Registry in June 2025, so older search links may not open). Use the entity that will borrow and own the project. Before closing you will also need a Certificate of Good Standing and organization documents (articles and operating agreement) for this entity. If the company isn\'t formed yet, say so or ask the team.',
    keywords: ['entity', 'entity id', 'michigan business', 'lara', 'identification number', 'entidad', 'الكيان', 'প্রতিষ্ঠানের শনাক্তকরণ', '实体识别'],
    source_ids: ['mi_entity_search', 'lending_guide', 'lara_filing'],
  },
  criminal: legal, judgments: legal, bankruptcy_7yr: legal, bankruptcy_24mo: legal,
  in_detroit: {
    explain: 'Only addresses inside Detroit\'s city limits count. Highland Park and Hamtramck are separate cities, even though Detroit surrounds them. A "Detroit" mailing address or ZIP code is not proof: ZIP codes follow mail routes, not city borders. Search the address in the City of Detroit\'s Parcel Viewer (data.detroitmi.gov), or check which city sends the property tax bill. The Real Estate program also has target neighborhoods (including the Strategic Neighborhood Fund areas); the team can tell you whether your address is in one.',
    keywords: ['city limits', 'highland park', 'hamtramck', 'located', 'detroit city', 'detroit zip', 'parcel viewer', 'inside detroit'],
    source_ids: ['intake_form_v59', 're_flyer', 'detroit_parcel_viewer'],
  },
  home_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: ['state abbreviation'], source_ids: INTAKE },
  business_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: [], source_ids: INTAKE },
  project_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: [], source_ids: INTAKE },
  doc_project_plan: {
    explain: 'A written description of the project: what you will build, where, the timeline, your team and its experience, how it will be paid for, and what it does for the neighborhood (homes, affordable units, jobs). A business plan or project narrative you already have usually works. In screening, Invest Detroit looks at mission fit and feasibility, so this is the place to explain both.',
    mistakes: ['A timeline that starts construction before the loan could close. Screening to closing typically takes several months.'],
    keywords: ['project plan', 'narrative', 'business plan'],
    source_ids: GUIDE,
  },
  doc_dev_budget: {
    explain: 'A table of every project cost ("uses") and where the money comes from ("sources"), such as your equity, this loan, other loans and grants. The two totals should match, and should match the total budget you entered. Include hard costs (the construction itself), soft costs (design, permits, legal, insurance, interest during construction), loan fees, closing costs and a contingency. The same budget and sources/uses is checked again before closing.',
    example: 'Uses: purchase $400,000, construction $1,000,000, soft costs and fees $50,000, contingency $100,000 = $1,550,000. Sources: your equity $160,000, Invest Detroit $600,000, bank $790,000 = $1,550,000.',
    mistakes: ['Sources and uses that don\'t add up to the same total.', 'Listing a loan from another lender without naming it in "other lenders".'],
    keywords: ['development budget', 'sources and uses', 'sources & uses', 'sources', 'uses', 'fuentes y usos', 'مصادر', 'উৎস ও ব্যবহার', '来源与用途'],
    source_ids: GUIDE,
  },
  doc_team_list: {
    explain: 'Names and roles of the key people on the project, such as the developer, architect, general contractor, property manager, lawyer and accountant, with a line on each one\'s relevant experience. Underwriting looks at management capacity, and the lending guide says naming your legal and accounting contacts early helps the loan move faster.',
    keywords: ['team members', 'team list', 'team'],
    source_ids: GUIDE,
  },
  doc_pfs: {
    explain: 'A Personal Financial Statement lists what you own (assets) and what you owe (debts). Invest Detroit offers a template, linked under the question. It asks for: assets (cash, investments, retirement accounts, life insurance cash value, real estate, business interests, personal property), liabilities (bank notes, credit cards, taxes owed, mortgages), net worth, annual income and expenses, and schedules for your home (A), business ventures (B) and real estate investments (C). It also asks about taxes, bankruptcy, judgments and lawsuits. Attach account statements for cash or securities balances over $10,000. Real Estate loans usually include guarantees from the principals (main owners), which is why each one\'s personal finances matter.',
    keywords: ['personal financial statement', 'pfs', 'financial statement'],
    source_ids: ['pfs_template', 're_flyer'],
  },
  doc_tax_returns: {
    explain: 'Your personal tax returns and the business\'s tax returns for the past 3 years, if you have them. Full returns with all schedules are most useful. If the business is new, upload what you have and say so in your project plan.',
    keywords: ['tax return', 'tax returns', 'declaración de impuestos', 'الإقرار الضريبي', 'ট্যাক্স রিটার্ন', '纳税申报'],
    source_ids: GUIDE,
  },
  doc_bank_statements: {
    explain: 'Personal and business bank statements for the past 3 months, if you have them. They can help show the cash for your equity contribution. Black out full account numbers before uploading; the team can ask for anything else they need.',
    keywords: ['bank statement', 'bank statements', 'estados de cuenta', 'كشف حساب', 'ব্যাংক স্টেটমেন্ট', '银行对账单'],
    source_ids: GUIDE,
  },
  previous_client: {
    explain: 'Answer Yes if you, or anyone who owns most of the project, has borrowed from Invest Detroit before or has ever applied for an Invest Detroit loan, even if it wasn\'t approved.',
    keywords: ['previous client', 'applied before', 'past client', 'cliente anterior', 'عميل سابق', 'আগের গ্রাহক', '老客户'],
    source_ids: INTAKE,
  },
  re_team_contact: {
    explain: 'If someone on Invest Detroit\'s Real Estate team (for example a Business Development Officer or loan officer) has already been talking with you about this project, choose them so your application reaches the right person. Leave it blank if not.',
    keywords: ['business development officer', 'loan officer', 'team member', 'who i have been working with'],
    source_ids: ['intake_form_v59', 'lending_guide'],
  },
}

/** Help for general questions that aren't about one field. Checked in order. */
export const TOPICS = [
  {
    id: 'staff_only',
    // Brief: never predict approval or whether this project qualifies; route to staff.
    // Published rates, fees and loan sizes are answered from knowledge.js instead.
    keywords: ['will i be approved', 'will we be approved', 'will i get approved', 'will we get approved', 'will my loan be approved', 'will my project be approved', 'be approved', 'get approved', 'chance of approval', 'chances', 'odds', 'am i eligible', 'are we eligible', 'is my project eligible', 'do i qualify', 'do we qualify', 'will i qualify', 'would i qualify', 'does my project qualify', 'qualify', 'guaranteed', 'my rate', 'my interest rate', 'rate will i get', 'rate would i get', 'what rate will', 'my fees', 'credit score', 'aprob', 'califico', 'calificar', 'elegible', 'سأحصل على الموافقة', 'موافقة', 'هل أنا مؤهل', 'অনুমোদন', 'আমি কি যোগ্য', '批准', '我有资格', '能通过'],
    explain: 'I can\'t tell you whether you will be approved, whether your project qualifies, or what your own rate and fees would be. Only the Invest Detroit team decides that, after reviewing your application (screening, then underwriting and a committee). Submitting the form means you are being considered, not guaranteed financing. I can share the published rate and fee ranges, the typical loan sizes and the steps of the process if that helps. ' + CONTACT,
    source_ids: ['lending_guide', 'intake_form_v59'],
    needs_staff: true,
  },
  {
    id: 'getting_started',
    keywords: ['where do i start', 'where should i start', 'how do i start', 'get started', 'getting started', 'first step', 'first steps', 'next step', 'what do i do first', 'how does this work', 'how do i fill', 'how do i apply', 'por dónde empiezo', 'cómo empiezo', 'من أين أبدأ', 'كيف أبدأ', 'কোথা থেকে শুরু', 'কীভাবে শুরু', '从哪里开始', '怎么开始'],
    explain: 'Here is the order that works best:\n1. Check the "Before you start" list above the form and gather the 3 required documents and the numbers you will need. The form can\'t be saved partway through.\n2. Fill in the form from top to bottom: contact details, your development company, the project address, the yes/no questions, business and budget information, construction details, impact, documents and the 3 acknowledgements.\n3. Press "Review My Application" to catch anything missing or mistyped, fix what it lists, then press Submit.\nTap the ? next to any question if you\'d like it explained.',
    source_ids: ['intake_form_v59'],
  },
  // General business and finance terms (plain-language education, not Invest Detroit policy).
  {
    id: 'net_income',
    keywords: ['net income', 'bottom line', 'net profit', 'ingreso neto', 'utilidad neta', 'صافي الدخل', 'صافي الربح', 'নিট আয়', 'নিট মুনাফা', '净收入', '净利润'],
    explain: 'Net income is your profit after every expense: revenue minus operating expenses, interest, taxes and other costs, for a set period such as a year. It is the "bottom line" on a profit and loss (P&L) statement or tax return.',
    example: '$300,000 revenue - $250,000 operating expenses - $10,000 interest - $10,000 taxes = $30,000 net income.',
    mistakes: ['Using revenue where a question asks for net income.', 'Using a number from a different year than the question asks for.'],
    source_ids: [],
  },
  {
    id: 'revenue_profit',
    keywords: ['revenue', 'profit', 'gross profit', 'sales', 'gross receipts', 'difference between revenue', 'ingresos', 'ganancia', 'ventas', 'الإيرادات', 'الربح', 'المبيعات', 'রাজস্ব', 'মুনাফা', 'বিক্রি', '营业收入', '利润', '销售额'],
    explain: 'Revenue (also called sales or gross receipts) is all the money your business brings in from customers before any costs are taken out. Profit is what is left after you subtract costs. Gross profit is revenue minus the direct cost of what you sold. Net profit (net income) is revenue minus all expenses, including rent, payroll, interest and taxes.',
    example: 'A café with $300,000 in sales and $270,000 in total expenses has $30,000 in net profit.',
    mistakes: ['Reporting revenue where a question asks for profit, or the other way around.', 'Mixing monthly and yearly numbers.'],
    source_ids: [],
  },
  {
    id: 'operating_expenses',
    keywords: ['operating expenses', 'operating costs', 'expenses', 'overhead', 'opex', 'gastos operativos', 'gastos', 'المصاريف التشغيلية', 'المصاريف', 'পরিচালন ব্যয়', 'খরচের হিসাব', '运营费用', '经营费用'],
    explain: 'Operating expenses are the regular costs of running the business day to day: rent, utilities, payroll, insurance, supplies, marketing and repairs. They usually leave out buying property or major equipment (capital costs) and paying back loan principal. To calculate them, add up these costs for the period, usually from your bookkeeping or profit and loss statement.',
    example: 'Rent $3,000 + payroll $9,000 + utilities $800 + insurance $400 = $13,200 a month, or $158,400 a year.',
    mistakes: ['Including a one-time purchase like a building or major equipment.', 'Mixing monthly and yearly figures.'],
    source_ids: [],
  },
  {
    id: 'no_financial_statements',
    keywords: ["don't have financial statements", 'no financial statements', 'without financial statements', 'financial statements', 'estados financieros', 'البيانات المالية', 'আর্থিক বিবরণী', '财务报表'],
    explain: 'On this form, personal financial statements, tax returns and bank statements are under Supporting Documents, which asks for them "if you have" them. The required documents are the project plan or narrative, the development budget with sources and uses, and the team list. If you don\'t have financial statements yet, Invest Detroit offers a Personal Financial Statement template, and the team can tell you what they will need later in the process. The lending guide says that, depending on the loan, Invest Detroit may later ask for historical financial statements, business and personal tax returns, personal financial statements, cash flow projections, a project budget with sources and uses, and evidence of your equity.',
    source_ids: ['intake_form_v59', 'pfs_template', 'lending_guide'],
  },
  {
    id: 'estimate_cost',
    keywords: ['estimate', 'total cost', 'project cost', "project's total cost", 'how much will', 'estimar', 'costo total', 'تقدير', 'التكلفة', 'আনুমানিক', 'মোট খরচ', '估算', '总成本'],
    explain: 'To estimate the total project cost, add up: the purchase price of the land or building; construction or renovation (contractor bids are the most reliable source); soft costs such as architect and design, permits, legal, insurance and financing fees; and a contingency for surprises. The result is the number for "What is your total budget?"',
    example: '$400,000 purchase + $1,000,000 renovation + $50,000 soft costs = $1,450,000, before any contingency you add.',
    mistakes: ['Leaving out soft costs or a contingency.', 'Using only the amount you plan to borrow.'],
    source_ids: ['intake_form_v59'],
  },
  {
    id: 'talk_to_person',
    keywords: ['person', 'human', 'staff', 'someone', 'call', 'phone', 'email', 'contact', 'who should i contact', 'who do i contact', 'contact information', 'loan officer', 'office address', 'persona', 'شخص', 'موظف', 'মানুষ', 'যোগাযোগ', '人工', '联系'],
    explain: 'You can talk to the Invest Detroit team directly. ' + CONTACT + ' The office is at 950 Selden Street, Suite 360, Detroit, MI 48201. Once your application moves forward, your assigned Business Development Officer or loan officer becomes your main contact. Mention that you are applying through the Real Estate/C&I In-Take Form, and don\'t send Social Security or bank account numbers by email.',
    source_ids: ['re_flyer', 'lending_guide'],
    needs_staff: true,
  },
  {
    id: 'documents',
    keywords: ['documents', 'document', 'upload', 'attach', 'paperwork', 'documentos', 'مستندات', 'المستندات', 'কাগজপত্র', 'কাগজ', '文件'],
    explain: 'Required: a project plan or project narrative, a development budget with sources and uses, and a list of the team members working on the project. If you have them, also add personal financial statements (past 3 years), personal and business tax returns (past 3 years), and personal and business bank statements (past 3 months).\nLater, before closing, Invest Detroit asks for more, such as organization documents, a good standing certificate, title, survey, appraisal and (for construction) plans, contracts and permits. Ask me about the closing checklist to see the full list.',
    source_ids: ['intake_form_v59', 'pfs_template', 'lending_guide'],
  },
  {
    id: 'saving',
    keywords: ['save', 'saved', 'come back', 'later', 'lose', 'guardar', 'حفظ', 'সংরক্ষণ', '保存'],
    explain: 'The form can\'t be saved partway through. If you close or leave the page before submitting, your answers are lost. Gather your documents and numbers first. The "Before you start" list above the form shows what you\'ll need.',
    source_ids: INTAKE,
  },
  { id: 'ami', ...ami },
  { id: 'gross_net', ...sqft },
  {
    id: 'language',
    keywords: ['language', 'spanish', 'arabic', 'bengali', 'chinese', 'translate', 'idioma', 'لغة', 'ভাষা', '语言'],
    explain: 'Use the language menu at the top of the page to switch between English, Spanish, Arabic, Bengali and Chinese. Invest Detroit also publishes a Language Assistance Plan describing the help it offers.',
    source_ids: ['language_assistance'],
  },
  // Lending process, programs, published rates and fees, and about Invest Detroit.
  ...KNOWLEDGE,
  // Plain-language definitions of lending and real estate terms (general education).
  ...GLOSSARY,
]
