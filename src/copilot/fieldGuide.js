// Field guide: plain-language help for the questions applicants most often get wrong.
//
// STATUS: DRAFT written by the student team from the public form. It explains what each
// question asks. It must not state Invest Detroit policy (eligibility, rates, fees, what counts
// as equity): those questions go to staff. Invest Detroit should review and own this content
// before real use (brief: "staff-owned set of canonical field definitions").
//
// Used today by the chat's built-in answers (assistant.js guideTransport), and later as the
// approved source material a real AI model answers from.
//
// English only for now. The chat says so when another language is selected.

export const GUIDE_STATUS = 'draft'

const CONTACT = 'You can reach the Invest Detroit team at info@investdetroit.com or 313.259.6368.'
const INTAKE = ['intake_form_v59']

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
  explain: 'AMI means Area Median Income: the middle household income for the region, published each year by the U.S. Department of Housing and Urban Development (HUD). A unit "at 60% AMI" is priced to be affordable for a household earning 60% of that income. Enter how many units you expect at each level.',
  example: 'A 6-unit building with 2 units at 60% AMI, 2 at 80% and 2 at 100% would enter 2, 2 and 2 in those boxes.',
  mistakes: ['Entering percentages instead of numbers of units.', 'Counts that don\'t add up to the total housing units.'],
  keywords: ['ami', 'area median income', 'affordable', 'affordability', 'asequibilidad', 'دخل', 'القدرة', 'সাশ্রয়ী', '收入中位数', '可负担'],
  source_ids: INTAKE,
}

const owners = {
  explain: 'These questions describe the business owners together. Answer for the owners who hold 50% or more of the business. "Prefer not to say" is always an option. The form explains that some of Invest Detroit\'s funders require this reporting.',
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
    explain: 'The full cost of the whole project, from every source combined: buying the property, construction or renovation, soft costs (design, permits, legal and financing fees) and a contingency. It is not just the amount you are asking Invest Detroit for.',
    example: 'Buying a building for $400,000, renovating it for $1,000,000 and $50,000 in fees is a total budget of $1,450,000.',
    mistakes: ['Entering only the loan amount you want.', 'Leaving out soft costs like design, permits and fees.', 'Typing a dollar sign or commas. The box only takes numbers.'],
    keywords: ['budget', 'total budget', 'total cost', 'project cost', 'presupuesto', 'ميزانية', 'الميزانية', 'বাজেট', '预算'],
    source_ids: INTAKE,
  },
  loan_amount: {
    explain: 'How much you are asking Invest Detroit to lend. It is usually one part of the total budget. Other lenders, grants and your own money cover the rest.',
    example: 'Total budget $1,450,000, asking Invest Detroit for $600,000.',
    mistakes: ['Entering the total budget here.', 'Including money you are asking other lenders for.'],
    keywords: ['loan', 'loan amount', 'borrow', 'requesting', 'préstamo', 'قرض', 'القرض', 'ঋণ', '贷款'],
    source_ids: INTAKE,
  },
  equity_10pct: {
    explain: 'Asks whether you can put in at least 10% of the total expected project cost yourself, as cash or equity. Check the number against your total budget before answering. Exactly what counts as equity for your project is decided by the Invest Detroit team, so if you are unsure, answer as best you can and ask them.',
    example: 'For a $1,450,000 project, 10% is $145,000.',
    mistakes: ['Answering Yes without working out 10% of your total budget.'],
    keywords: ['10%', 'equity', 'contribution', 'cash', 'down payment', 'aporte', 'capital propio', 'مساهمة', 'ইকুইটি', '出资', '股权'],
    source_ids: INTAKE,
  },
  executive_summary: {
    explain: 'A short description of your business or project (up to 500 characters): what you will build or do, where, and why it matters.',
    example: 'Renovating a vacant two-story building into 6 apartments above 2 shops. Construction starts spring 2027.',
    mistakes: ['Writing only a business name or one vague sentence.', 'Going past 500 characters. The box stops accepting text.'],
    keywords: ['summary', 'executive summary', 'describe', 'description', 'resumen', 'الملخص', 'সারসংক্ষেপ', '概要'],
    source_ids: INTAKE,
  },
  other_lenders: {
    explain: 'Select every lender or funder you are working with, or have applied to, for this project. Choose "None" if there are none. Choose "Other (Please specify)" to type a name that isn\'t listed.',
    keywords: ['other lenders', 'funders', 'lender', 'prestamistas', 'جهات إقراض', 'ঋণদাতা', '贷款方'],
    source_ids: INTAKE,
  },
  community_partners: {
    explain: 'Select any community organizations you are working with on this project, such as a neighborhood development group or business association. Choose "None" if there are none, or "Other (Please specify)" to type a name.',
    keywords: ['community partners', 'partner', 'partners', 'socio comunitario', 'شركاء', 'অংশীদার', '合作伙伴'],
    source_ids: INTAKE,
  },
  real_estate_type: {
    explain: 'The main use of the property after the project. Choose Mixed Use if it combines more than one, like apartments above shops. You will then be asked about each part.',
    keywords: ['type of real estate', 'real estate type', 'mixed use', 'retail', 'residential', 'office', 'commercial', 'uso mixto', 'نوع العقار', 'মিশ্র', '房地产类型', '混合用途'],
    source_ids: INTAKE,
  },
  use_of_funds: {
    explain: 'How the loan money would be spent. Bridge: short-term money until longer-term funding arrives. Predev/Real Estate Acquisition: costs before construction, or buying the property. Constructed Improvements: building or renovation work. Tenant Improvement: building out space for a tenant. Working Capital: day-to-day operating costs. Refinance: replacing an existing loan.',
    keywords: ['use of funds', 'funds be used', 'bridge', 'refinance', 'working capital', 'tenant improvement', 'acquisition', 'predev', 'fondos', 'أموال', 'অর্থ', '资金'],
    source_ids: INTAKE,
  },
  construction_jobs: {
    explain: 'Your best estimate of how many construction jobs the build will create. These are counted here only, so leave them out of the direct and indirect job questions.',
    keywords: ['construction jobs', 'construction', 'construcción', 'البناء', 'নির্মাণ', '建筑'],
    source_ids: INTAKE,
  },
  retail_rent: {
    explain: 'Your expected rent for the retail space. The box only takes a number and the form doesn\'t name a unit. A common way to quote retail rent is dollars per square foot per year (for example 18). If you use a different unit, ask the Invest Detroit team which one they expect.',
    keywords: ['rent', 'rental rate', 'renta', 'إيجار', 'ভাড়া', '租金'],
    source_ids: INTAKE,
  },
  housing_units: { ...ami, explain: 'How many homes (apartments or houses) the project will create. Below it, split that total by affordability level. ' + ami.explain },
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
    explain: 'The ID number the State of Michigan (LARA) gave your business when it registered. You can look it up with the Michigan business entity search linked under the question.',
    keywords: ['entity', 'entity id', 'michigan business', 'lara', 'identification number', 'entidad', 'الكيان', 'প্রতিষ্ঠানের শনাক্তকরণ', '实体识别'],
    source_ids: ['mi_entity_search'],
  },
  criminal: legal, judgments: legal, bankruptcy_7yr: legal, bankruptcy_24mo: legal,
  in_detroit: {
    explain: 'Only addresses inside Detroit\'s city limits count. Highland Park and Hamtramck are separate cities, even though Detroit surrounds them. If you are unsure, check the property tax bill or ask the city.',
    keywords: ['city limits', 'highland park', 'hamtramck', 'located', 'detroit city'],
    source_ids: INTAKE,
  },
  home_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: ['state abbreviation'], source_ids: INTAKE },
  business_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: [], source_ids: INTAKE },
  project_state: { explain: 'Use the two-letter state abbreviation in capital letters, like MI for Michigan.', keywords: [], source_ids: INTAKE },
  doc_project_plan: {
    explain: 'A written description of the project: what you will build, the timeline, the team and how it will be paid for. A business plan or project narrative you already have usually works.',
    keywords: ['project plan', 'narrative', 'business plan'],
    source_ids: INTAKE,
  },
  doc_dev_budget: {
    explain: 'A table of every project cost ("uses") and where the money comes from ("sources"), such as your equity, this loan, other loans and grants. The two totals should match, and should match the total budget you entered.',
    keywords: ['development budget', 'sources and uses', 'sources & uses', 'sources', 'uses', 'fuentes y usos', 'مصادر', 'উৎস ও ব্যবহার', '来源与用途'],
    source_ids: INTAKE,
  },
  doc_team_list: {
    explain: 'Names and roles of the key people on the project, such as the developer, architect, general contractor and property manager.',
    keywords: ['team members', 'team list', 'team'],
    source_ids: INTAKE,
  },
  doc_pfs: {
    explain: 'A Personal Financial Statement lists what you own (assets) and what you owe (debts). Invest Detroit offers a template, linked under the question.',
    keywords: ['personal financial statement', 'pfs', 'financial statement'],
    source_ids: ['pfs_template'],
  },
}

/** Help for general questions that aren't about one field. Checked in order. */
export const TOPICS = [
  {
    id: 'staff_only',
    // Brief: never guess eligibility, terms or fees; abstain and route to staff.
    keywords: ['approve', 'approved', 'approval', 'eligible', 'eligibility', 'qualify', 'interest rate', 'rate', 'fee', 'fees', 'terms', 'how long', 'timeline', 'decision', 'credit score', 'aprob', 'elegib', 'tasa', 'موافقة', 'أهلية', 'فائدة', 'অনুমোদন', 'যোগ্য', 'সুদ', '批准', '资格', '利率', '费用'],
    explain: 'I can\'t decide eligibility or tell you loan terms, interest rates, fees or timelines. Those depend on your project and can change, so only the Invest Detroit team can answer them. ' + CONTACT,
    source_ids: ['program_overviews'],
    needs_staff: true,
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
    explain: 'On this form, personal financial statements, tax returns and bank statements are under Supporting Documents, which asks for them "if you have" them. The required documents are the project plan or narrative, the development budget with sources and uses, and the team list. If you don\'t have financial statements yet, Invest Detroit offers a Personal Financial Statement template, and the team can tell you what they will need later in the process.',
    source_ids: ['intake_form_v59', 'pfs_template'],
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
    keywords: ['person', 'human', 'staff', 'someone', 'call', 'phone', 'email', 'contact', 'persona', 'شخص', 'موظف', 'মানুষ', 'যোগাযোগ', '人工', '联系'],
    explain: 'You can talk to the Invest Detroit team directly. ' + CONTACT + ' Mention that you are applying through the Real Estate/C&I In-Take Form, and don\'t send Social Security or bank account numbers by email.',
    source_ids: [],
    needs_staff: true,
  },
  {
    id: 'documents',
    keywords: ['documents', 'document', 'upload', 'attach', 'paperwork', 'documentos', 'مستندات', 'المستندات', 'কাগজপত্র', 'কাগজ', '文件'],
    explain: 'Required: a project plan or project narrative, a development budget with sources and uses, and a list of the team members working on the project. If you have them, also add personal financial statements (past 3 years), personal and business tax returns (past 3 years), and personal and business bank statements (past 3 months).',
    source_ids: ['intake_form_v59', 'pfs_template'],
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
]
