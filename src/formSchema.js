// Replica of the Invest Detroit "Real Estate/C&I In-Take Form" (investdetroit.com/need-support).
// Each field has a stable `id` so the AI assistant and the reviewer can refer to it later.
// Changes from the real form, on purpose:
//   - The Social Security Number field is shown but disabled (greyed out).
//   - Staff names in the "who are you working with" list are replaced by placeholders.
//   - Nothing is submitted anywhere.

const YES_NO = ['Yes', 'No']
const YES_NO_PNS = ['Yes', 'No', 'Prefer not to say']
const NUMBERS_ONLY = 'Please do not enter special characters. Only numbers 0–9 are allowed.'
const PART_TIME = 'Part-time employees are anyone who works less than 35 hours per week.'
const FULL_TIME = 'Full-time employees are anyone who work 35 hours or more per week.'

const has = (v, id, option) => Array.isArray(v[id]) && v[id].includes(option)

const ETHNICITIES = [
  'Black or African American',
  'American Indian or Alaska Native',
  'Asian',
  'White',
  'Hispanic or Latino',
  'Middle Eastern or North African',
  'Native Hawaiian or Pacific Islander',
  'Multiracial or Multiethnic',
  'Something else',
]
const GENDERS = ['Men', 'Women', 'Nonbinary', 'Something else']
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const AMI_LEVELS = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%', '110%', '120%', 'Greater Than 120%']

export const FORM_INTRO = [
  'Thank you for your interest in Invest Detroit. We are a mission-based, nonprofit lender, and borrowers must meet a set of criteria so that we can meet our funding requirements, including goals set by our funders.',
  'Please fill out the following contact information and answer the questions below to begin the application process.',
]

export const SECTIONS = [
  {
    id: 'contact',
    title: 'Contact Information',
    fields: [
      { id: 'first_name', label: 'First Name', type: 'text', required: true, width: 'half', autoComplete: 'given-name' },
      { id: 'last_name', label: 'Last Name', type: 'text', required: true, width: 'half', autoComplete: 'family-name' },
      { id: 'job_title', label: 'Job Title', type: 'text', required: true, width: 'half' },
      { id: 'home_address', label: 'Home Address', type: 'text', required: true, width: 'full', autoComplete: 'street-address' },
      { id: 'home_city', label: 'Home City', type: 'text', required: true, width: 'half' },
      { id: 'home_state', label: 'Home State', type: 'state', required: true, width: 'quarter' },
      { id: 'home_zip', label: 'Home Zip Code', type: 'zip', required: true, width: 'quarter' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, width: 'half', autoComplete: 'email' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true, width: 'half', autoComplete: 'tel' },
    ],
  },
  {
    id: 'company',
    title: 'Development Company Information',
    fields: [
      { id: 'business_name', label: 'Business Name', type: 'text', required: true, width: 'full' },
      { id: 'business_address', label: 'Business Address', type: 'text', required: true, width: 'full' },
      { id: 'business_city', label: 'Business City', type: 'text', required: true, width: 'half' },
      { id: 'business_state', label: 'Business State', type: 'state', required: true, width: 'quarter' },
      { id: 'business_zip', label: 'Business Zip Code', type: 'zip', required: true, width: 'quarter' },
    ],
  },
  {
    id: 'project_address',
    title: 'Project Address',
    fields: [
      { id: 'project_name', label: 'Project Name', type: 'text', width: 'full' },
      { id: 'project_address', label: 'Project Address', type: 'text', required: true, width: 'full' },
      { id: 'project_city', label: 'Project City', type: 'text', required: true, width: 'half' },
      { id: 'project_state', label: 'Project State', type: 'state', required: true, width: 'quarter' },
      { id: 'project_zip', label: 'Project Zip Code', type: 'zip', required: true, width: 'quarter' },
    ],
  },
  {
    id: 'questions',
    title: 'Questions',
    fields: [
      { id: 'age_18', label: 'Are you 18 years of age or older?', type: 'radio', options: YES_NO, required: true },
      { id: 'in_detroit', label: 'Is your project currently located (or will be located) within the city limits of the City of Detroit (not including Highland Park or Hamtramck)?', type: 'radio', options: YES_NO, required: true },
      { id: 'citizen', label: 'Are you a citizen of the US or have legal immigration status?', type: 'radio', options: YES_NO, required: true },
      { id: 'bankruptcy_24mo', label: 'Have you filed for bankruptcy or had a bankruptcy discharge in the last 24 months?', type: 'radio', options: YES_NO, required: true },
      { id: 'restricted_business', label: 'Is your business an adult entertainment, firearm, or associated with cash advances and / or payday loans?', type: 'radio', options: YES_NO, required: true },
      { id: 'cannabis', label: 'Do you or any of your businesses or properties engage in the growing, sale, distribution, or handling of cannabis-related items, including CBD products?', type: 'radio', options: YES_NO, required: true },
      { id: 'elected_official', label: 'Are you an elected official or have filed to run for political office (local, state, federal)?', type: 'radio', options: YES_NO, required: true },
      { id: 'previous_client', label: 'Are you or a majority owner of the project, a previous client, or have you ever applied for a loan from Invest Detroit?', type: 'radio', options: YES_NO, required: true },
      {
        id: 're_team_contact',
        label: 'If you have been working with a member of the Invest Detroit Real Estate team, if so, please select who',
        type: 'select',
        options: ['Team member A', 'Team member B', 'Team member C', 'Other'],
        prototypeNote: 'Real staff names are replaced with placeholders in this prototype.',
      },
    ],
  },
  {
    id: 'business_info',
    title: 'Business Information Continued',
    fields: [
      { id: 'executive_summary', label: 'Executive Summary of Business or Project', type: 'textarea', required: true, maxLength: 500 },
      { id: 'total_budget', label: 'What is your total budget?', type: 'money', required: true, width: 'half' },
      { id: 'loan_amount', label: 'What is the loan amount you are requesting from Invest Detroit?', type: 'money', required: true, width: 'half' },
      { id: 'equity_10pct', label: 'Are you able to provide a cash or equity contribution of at least 10% of the total expected project cost?', type: 'radio', options: YES_NO, required: true },
      {
        id: 'other_lenders',
        label: 'Are you working with any other lenders or funders?',
        type: 'checkboxes',
        hint: 'Select all that apply.',
        options: [
          'Capital Impact Partners', 'Cinnaire', 'DEGC: Motor City Match, Motor City Re-Store', 'Detroit Development Fund',
          'Federal Home Loan Bank of Indianapolis (FHLBI)', 'IFF', 'Michigan Economic Development Corporation (MEDC)',
          'Michigan Good Food Fund', 'Michigan State Housing Development Authority (MSHDA)', 'Michigan Women Forward',
          'ProsperUS', 'Small Business Administration (SBA)', 'None', 'Other (Please specify)',
        ],
      },
      { id: 'other_lender_text', label: 'Other lender or funder', type: 'text', required: true, maxLength: 200, showIf: (v) => has(v, 'other_lenders', 'Other (Please specify)') },
      {
        id: 'community_partners',
        label: 'Are you working with any community partners?',
        type: 'checkboxes',
        hint: 'Select all that apply.',
        options: [
          'ACCESS', 'City of Detroit/DEGC District Business Liaisons', 'East Warren Dev. Co.', 'Detroit Build Institute',
          'Grand Innovation', 'Grandmont Rosedale Development Corporation', 'Jefferson East Inc.', 'Live6 Alliance',
          'Osborn Business Association', 'Southwest Detroit Business Association', 'Small Business Development Center (SBDC)',
          'TechTown Detroit', 'Community Development Advocates of Detroit (CDAD)', 'MACC Development', 'Church of the Messiah',
          'Genesis HOPE', 'Congress of Communities', 'Hubbard Richard Residents Association', 'West Village Association',
          'Hubbard Farms Neighborhood Association', 'Bagley Community Council', 'College Core Block Club', 'Global Detroit',
          'Cody Rouge Community Action Alliance', 'Joy Southfield CDC', 'Islamic Center of Detroit', 'Osborn Neighborhood Alliance',
          'None', 'Other (Please specify)',
        ],
      },
      { id: 'other_partner_text', label: 'Other community partner', type: 'text', required: true, maxLength: 200, showIf: (v) => has(v, 'community_partners', 'Other (Please specify)') },
      { id: 'criminal', label: 'Has any owner(s) been charged with or convicted of any criminal offense?', type: 'radio', options: YES_NO, required: true },
      { id: 'criminal_details', label: 'If yes, please provide details below.', type: 'textarea', maxLength: 500, showIf: (v) => v.criminal === 'Yes' },
      { id: 'judgments', label: 'Are there any outstanding judgments, tax liens, garnishments, child support payments, or other legal proceedings against the business, owner(s), officer(s), or partner(s)?', type: 'radio', options: YES_NO, required: true },
      { id: 'judgments_details', label: 'If yes, please provide details below.', type: 'textarea', maxLength: 500, showIf: (v) => v.judgments === 'Yes' },
      { id: 'bankruptcy_7yr', label: 'Have any owners(s) had a bankruptcy in the last 7 years?', type: 'radio', options: YES_NO, required: true },
      { id: 'bankruptcy_details', label: 'If yes, please provide details below.', type: 'textarea', maxLength: 500, showIf: (v) => v.bankruptcy_7yr === 'Yes' },
      {
        id: 'ssn',
        label: 'What is your Social Security Number?',
        type: 'disabled',
        required: true,
        width: 'half',
        showIf: (v) => v.criminal === 'Yes' || v.judgments === 'Yes' || v.bankruptcy_7yr === 'Yes',
        disabledNote: 'Disabled in this prototype. Never enter a real Social Security Number here.',
      },
      {
        id: 'mi_entity_id',
        label: 'What is your Michigan business entity identification number?',
        type: 'text',
        required: true,
        showIf: (v) => v.criminal === 'Yes' || v.judgments === 'Yes' || v.bankruptcy_7yr === 'Yes',
        hintLink: { before: 'Use the ', text: 'Michigan business entity search', href: 'https://cofs.lara.state.mi.us/searchapi/search/search', after: ' to look up the Michigan business entity ID number.' },
      },
    ],
  },
  {
    id: 'construction',
    title: 'Construction Questions',
    intro: 'Since your project includes owned real estate as collateral support or improvement as part of your project, please answer all questions below that are relevant for your project and provide the additional documents requested.',
    fields: [
      { id: 'construction_jobs', label: 'Please estimate how many construction jobs will be created as a result of this project.', type: 'integer', width: 'half' },
      {
        id: 'use_of_funds',
        label: 'How would the funds from this loan be used?',
        type: 'radio',
        layout: 'vertical',
        options: ['Bridge', 'Constructed Improvements', 'Equity', 'Machinery & Equipment', 'Other', 'Predev/Real Estate Acquisition', 'Refinance', 'Tenant Improvement', 'Working Capital'],
      },
      { id: 'real_estate_type', label: 'Type of real estate', type: 'select', required: true, width: 'half', options: ['Retail', 'Residential', 'Office', 'Commercial/Warehouse/Manufacturing', 'Mixed Use', 'Other'] },
    ],
  },
  {
    id: 'retail',
    title: 'Retail Project',
    intro: 'If your project includes retail, please complete the following information.',
    showIf: (v) => ['Retail', 'Mixed Use', 'Other'].includes(v.real_estate_type),
    fields: [
      { id: 'retail_gross_sqft', label: 'What is the total gross retail square footage of the project?', emphasis: 'gross', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'retail_net_sqft', label: 'What is the total net retail square footage of the project?', emphasis: 'net', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'retail_rent', label: 'What is the estimated retail rental rate for the project?', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
    ],
  },
  {
    id: 'office',
    title: 'Office/Commercial Project',
    showIf: (v) => ['Office', 'Commercial/Warehouse/Manufacturing', 'Mixed Use', 'Other'].includes(v.real_estate_type),
    fields: [
      { id: 'office_gross_sqft', label: 'What is the total gross office square footage of the project?', emphasis: 'gross', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'office_net_sqft', label: 'What is the total net office square footage of the project?', emphasis: 'net', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'commercial_gross_sqft', label: 'What is the total gross commercial square footage of the project?', emphasis: 'gross', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'commercial_net_sqft', label: 'What is the total net commercial square footage of the project?', emphasis: 'net', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
    ],
  },
  {
    id: 'residential',
    title: 'Residential Project',
    showIf: (v) => ['Residential', 'Mixed Use', 'Other'].includes(v.real_estate_type),
    fields: [
      { id: 'residential_gross_sqft', label: 'What is the total gross residential square footage of the project?', emphasis: 'gross', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'residential_net_sqft', label: 'What is the total net residential square footage of the project?', emphasis: 'net', type: 'number', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'housing_units', label: 'How many housing units will this project create?', type: 'integer', hint: NUMBERS_ONLY, width: 'half' },
      { id: 'ami_heading', type: 'subheading', text: 'Please estimate the affordability level of the units this project will create.', plain: true },
      ...AMI_LEVELS.map((lvl) => ({ id: `ami_${slug(lvl)}`, label: `${lvl} AMI`, type: 'integer', width: 'tiny' })),
    ],
  },
  {
    id: 'impact',
    title: 'Impact',
    fields: [
      { id: 'direct_heading', type: 'subheading', text: 'Direct Jobs' },
      { id: 'direct_intro', type: 'paragraph', text: 'This section will ask questions related to any jobs created directly by your project.' },
      { id: 'current_pt', label: 'How many part-time employees do you currently employ?', type: 'integer', hint: PART_TIME, width: 'half' },
      { id: 'current_ft', label: 'How many full-time employees do you currently employ?', type: 'integer', hint: FULL_TIME, width: 'half' },
      { id: 'new_pt', label: 'How many new part-time employees will be employed by your development firm as a result of the funding you received from Invest Detroit?', type: 'integer', hint: PART_TIME, width: 'half' },
      { id: 'new_ft', label: 'How many new full-time employees will be employed by your development firm as a result of the funding you received from Invest Detroit?', type: 'integer', hint: FULL_TIME, width: 'half' },
      { id: 'indirect_heading', type: 'subheading', text: 'Indirect Jobs' },
      { id: 'indirect_intro', type: 'paragraph', text: 'This section will ask questions related to any jobs indirectly created as a result of this project. Example: If this project created 2 retail bays, we are asking you to estimate how many jobs were created as a result of those 2 retail bays.' },
      { id: 'indirect_pt', label: 'Please estimate how many part-time jobs will be created as a result of this project? Please exclude construction jobs in this estimate.', type: 'integer', hint: PART_TIME, width: 'half' },
      { id: 'indirect_ft', label: 'Please estimate how many full-time jobs will be created as a result of this project? Please exclude construction jobs in this estimate.', type: 'integer', hint: FULL_TIME, width: 'half' },
      { id: 'population_heading', type: 'subheading', text: 'Impact Population' },
      { id: 'population_intro', type: 'paragraph', text: 'Please answer the following questions to support mission alignment for our organization. Answer these questions from the business owner(s) perspective. If there are multiple owners, please answer these questions so that the responses represent 50% or more of the business ownership.' },
      { id: 'owners_detroit', label: 'Do 50% or more of the business owners live in Detroit?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'owners_veterans', label: 'Are 50% or more of the business owners veterans?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'owners_immigrants', label: 'Have 50% or more of the business owners immigrated to the United States?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'owners_lgbtq', label: 'Do 50% or more of the business owners identify as LGBTQ+?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'owners_returning', label: 'Are 50% or more of the business owners returning citizens?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'owners_cdo', label: 'Is one of the business owners a Community Development Organization (CDO)?', type: 'select', options: YES_NO_PNS, required: true, width: 'half' },
      { id: 'cdo_pct', label: 'What percentage of the business is owned by the Community Development Organization (CDO)?', type: 'integer', hint: NUMBERS_ONLY, width: 'half', showIf: (v) => v.owners_cdo === 'Yes' },
      { id: 'owner_count', label: 'How many business owners are there in total?', type: 'integer', width: 'half' },
      { id: 'ethnic_heading', type: 'subheading', text: 'Ethnic Background' },
      { id: 'ethnicities', label: 'What are the ethnic backgrounds of the business owners?', type: 'checkboxes', required: true, hint: 'Select all that apply.', options: [...ETHNICITIES, 'Prefer not to say'] },
      { id: 'ethnicity_other_text', label: 'If something else, please feel free to describe your ethnic background.', type: 'text', showIf: (v) => has(v, 'ethnicities', 'Something else') },
      {
        id: 'ethnic_count_intro',
        type: 'paragraph',
        showIf: (v) => ETHNICITIES.some((e) => has(v, 'ethnicities', e)),
        text: "Some of the funding Invest Detroit receives requires us to report on the ownership demographics of the businesses that we support. In the section below, please indicate how many business owners identify with each selected ethnicity. For example, if a business has two Asian owners and one white owner, enter '2' in the box for 'Asian' and '1' in the box for 'White.' Please select only one ethnic background per person.",
      },
      ...ETHNICITIES.map((e) => ({
        id: `eth_count_${slug(e)}`,
        label: e,
        type: 'integer',
        width: 'half',
        hint: `Example: If two business owners identify as ${e === 'Something else' ? 'something else' : e}, enter "2" in the box above.`,
        showIf: (v) => has(v, 'ethnicities', e),
      })),
      { id: 'gender_heading', type: 'subheading', text: 'Gender' },
      { id: 'genders', label: 'What are the genders of the business owners?', type: 'checkboxes', required: true, hint: 'Select all that apply.', options: [...GENDERS, 'Prefer not to say'] },
      { id: 'gender_other_text', label: 'If something else, please feel free to describe your gender.', type: 'text', required: true, showIf: (v) => has(v, 'genders', 'Something else') },
      {
        id: 'gender_count_intro',
        type: 'paragraph',
        showIf: (v) => GENDERS.some((g) => has(v, 'genders', g)),
        text: 'Some of the funding Invest Detroit receives requires us to report on the ownership demographics of the businesses we support. In the section below, please indicate how many business owners identify with each selected genders. Example: if two of the business owners are men and one is a woman, please enter "2" in the box labeled "Men" and 1 in the box labeled "Women".',
      },
      ...GENDERS.map((g) => ({
        id: `gender_count_${slug(g)}`,
        label: g,
        type: 'integer',
        width: 'half',
        hint: `Example: If two business owners identify as ${g.toLowerCase()}, enter "2" in the box above.`,
        showIf: (v) => has(v, 'genders', g),
      })),
    ],
  },
  {
    id: 'required_docs',
    title: 'Required Documents',
    intro: 'Please provide the following required documents:',
    introBold: true,
    fields: [
      { id: 'doc_project_plan', label: 'Project Plan or Project Narrative', type: 'file', required: true },
      { id: 'doc_dev_budget', label: 'Development Budget (with Sources & Uses)', type: 'file', required: true },
      { id: 'doc_team_list', label: 'List of team members working on the project', type: 'file', required: true },
    ],
  },
  {
    id: 'supporting_docs',
    title: 'Supporting Documents',
    intro: 'If you have the following documents, please submit them as well:',
    introBold: true,
    fields: [
      {
        id: 'doc_pfs',
        label: 'Personal Financial Statements (past 3 years)',
        type: 'file',
        hintLink: { before: 'A Personal Financial Statement template can be found ', text: 'here', href: 'https://investdetroit.com/wp-content/uploads/2025/08/Invest-Detroit-PFS-Form.pdf', after: '.' },
      },
      { id: 'doc_tax_returns', label: 'Personal and Business Tax Returns (past 3 years)', type: 'file' },
      { id: 'doc_bank_statements', label: 'Personal and Business Bank Statements (past 3 months)', type: 'file' },
    ],
  },
  {
    id: 'acknowledgements',
    title: 'Acknowledgements',
    fields: [
      { id: 'ack_truthful', type: 'ack', required: true, label: 'By submitting this application, I agree that the information included is truthful and accurate to the best of my knowledge.' },
      { id: 'ack_not_guaranteed', type: 'ack', required: true, label: 'I understand that by submitting this information I am only being considered for a loan and am not guaranteed any kind of financing. I understand that I am expected to provide information as requested by Invest Detroit in a timely manner as part of the lending review, underwriting and approval process.' },
      { id: 'ack_credit', type: 'ack', required: true, label: 'I authorize Invest Detroit and any of the funds, affiliates, or agents associated therewith to make any credit or due diligence investigations necessary to evaluate and underwrite an application for a loan.' },
    ],
  },
]

export const INPUT_TYPES = new Set(['text', 'email', 'tel', 'state', 'zip', 'money', 'number', 'integer', 'textarea', 'radio', 'select', 'checkboxes', 'file', 'ack'])

export function visibleSections(values) {
  return SECTIONS.filter((s) => !s.showIf || s.showIf(values)).map((s) => ({
    ...s,
    fields: s.fields.filter((f) => !f.showIf || f.showIf(values)),
  }))
}

const isEmpty = (val) => val === undefined || val === null || val === '' || val === false || (Array.isArray(val) && val.length === 0)

// Same kinds of checks the real form runs when you press Submit.
export function validate(values) {
  const errors = {}
  for (const section of visibleSections(values)) {
    for (const f of section.fields) {
      if (!INPUT_TYPES.has(f.type)) continue
      const val = values[f.id]
      if (isEmpty(val)) {
        if (f.required) errors[f.id] = 'This field is required.'
        continue
      }
      const s = String(val).trim()
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors[f.id] = 'Please enter a valid email address.'
      if (f.type === 'state' && !/^[A-Z]{2}$/.test(s)) errors[f.id] = 'Please enter a valid state abbreviation.'
      if (f.type === 'zip' && !/^\d{5}$/.test(s)) errors[f.id] = 'Please enter a 5 digit zip code.'
      if ((f.type === 'money' || f.type === 'number') && !/^\d+(\.\d+)?$/.test(s.replace(/,/g, ''))) errors[f.id] = 'Please enter a number.'
      if (f.type === 'integer' && !/^\d+$/.test(s)) errors[f.id] = 'Please enter a whole number.'
    }
  }
  return errors
}

// Fictional sample applicant for demos. Every name, address and number is made up.
export const SAMPLE_APPLICANT = {
  first_name: 'Jordan', last_name: 'Ellis', job_title: 'Managing Partner',
  home_address: '1234 Sample Ave', home_city: 'Detroit', home_state: 'MI', home_zip: '48207',
  email: 'jordan.ellis@example.com', phone: '313-555-0142',
  business_name: 'Riverside Example Development LLC', business_address: '500 Example Blvd, Suite 2',
  business_city: 'Detroit', business_state: 'MI', business_zip: '48201',
  project_name: 'Gratiot Corner Lofts (sample)', project_address: '789 Placeholder St', project_city: 'Detroit', project_state: 'MI', project_zip: '48207',
  age_18: 'Yes', in_detroit: 'Yes', citizen: 'Yes', bankruptcy_24mo: 'No', restricted_business: 'No', cannabis: 'No', elected_official: 'No', previous_client: 'No',
  executive_summary: 'Renovation of a vacant two-story mixed-use building into 6 apartments above 2 ground-floor retail bays. (Fictional sample project for the prototype.)',
  total_budget: '1450000', loan_amount: '600000', equity_10pct: 'Yes',
  other_lenders: ['Michigan Economic Development Corporation (MEDC)'], community_partners: ['Jefferson East Inc.'],
  criminal: 'No', judgments: 'No', bankruptcy_7yr: 'No',
  construction_jobs: '25', use_of_funds: 'Constructed Improvements', real_estate_type: 'Mixed Use',
  retail_gross_sqft: '3200', retail_net_sqft: '2900', retail_rent: '18',
  residential_gross_sqft: '6400', residential_net_sqft: '5800', housing_units: '6', ami_60: '2', ami_80: '2', ami_100: '2',
  current_pt: '1', current_ft: '3', new_pt: '0', new_ft: '1', indirect_pt: '4', indirect_ft: '3',
  owners_detroit: 'Yes', owners_veterans: 'No', owners_immigrants: 'No', owners_lgbtq: 'Prefer not to say', owners_returning: 'No', owners_cdo: 'No',
  owner_count: '2', ethnicities: ['Prefer not to say'], genders: ['Prefer not to say'],
}
