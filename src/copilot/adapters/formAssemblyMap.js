// Maps our field ids to the element ids on Invest Detroit's live FormAssembly form
// (form 4907942, version 59, embedded on investdetroit.com/need-support, page source of 3 Nov 2026).
//
// Kinds tell the adapter how to read each control:
//   text     <input type=text> or <textarea>   -> string
//   radio    radio group; id is the group's name -> chosen option's label text ("Yes")
//   select   single <select>                   -> chosen option's text ('' for "Please select...")
//   multi    <select multiple>                 -> array of chosen option texts
//   file     <input type=file>                 -> file name (the file itself is never read)
//   checkbox single checkbox                   -> true / false
//
// tests/formAssemblyMap.test.js fails if a field in formDefinition.js has no entry here.

const t = (id) => ({ kind: 'text', id })
const radio = (id) => ({ kind: 'radio', id })
const select = (id) => ({ kind: 'select', id })
const multi = (id) => ({ kind: 'multi', id })
const file = (id) => ({ kind: 'file', id })
const checkbox = (id) => ({ kind: 'checkbox', id })

export const FORM_ASSEMBLY_FORM_ID = '4907942'
export const FORM_ASSEMBLY_SUBMIT_ID = 'submit_button'

export const FORM_ASSEMBLY_MAP = {
  // Contact Information
  first_name: t('tfa_7'), last_name: t('tfa_3'), job_title: t('tfa_18'),
  home_address: t('tfa_136'), home_city: t('tfa_137'), home_state: t('tfa_138'), home_zip: t('tfa_139'),
  email: t('tfa_9'), phone: t('tfa_20'),
  // Development Company Information
  business_name: t('tfa_1'), business_address: t('tfa_40'), business_city: t('tfa_42'), business_state: t('tfa_43'), business_zip: t('tfa_44'),
  // Project Address
  project_name: t('tfa_646'), project_address: t('tfa_642'), project_city: t('tfa_643'), project_state: t('tfa_644'), project_zip: t('tfa_645'),
  // Questions
  age_18: radio('tfa_372'), in_detroit: radio('tfa_414'), citizen: radio('tfa_378'), bankruptcy_24mo: radio('tfa_384'),
  restricted_business: radio('tfa_390'), cannabis: radio('tfa_402'), elected_official: radio('tfa_396'), previous_client: radio('tfa_408'),
  re_team_contact: select('tfa_591'),
  // Business Information Continued
  executive_summary: t('tfa_239'), total_budget: t('tfa_244'), loan_amount: t('tfa_934'), equity_10pct: radio('tfa_936'),
  other_lenders: multi('tfa_243'), other_lender_text: t('tfa_495'),
  community_partners: multi('tfa_466'), other_partner_text: t('tfa_497'),
  criminal: radio('tfa_363'), criminal_details: t('tfa_362'),
  judgments: radio('tfa_339'), judgments_details: t('tfa_344'),
  bankruptcy_7yr: radio('tfa_144'), bankruptcy_details: t('tfa_155'),
  // tfa_541 is the live form's SSN field. It is deliberately NOT mapped: the copilot never reads it.
  mi_entity_id: t('tfa_175'),
  // Construction Questions
  construction_jobs: t('tfa_606'), use_of_funds: radio('tfa_607'), real_estate_type: select('tfa_612'),
  // Retail / Office-Commercial / Residential
  retail_gross_sqft: t('tfa_618'), retail_net_sqft: t('tfa_926'), retail_rent: t('tfa_619'),
  office_gross_sqft: t('tfa_622'), office_net_sqft: t('tfa_928'), commercial_gross_sqft: t('tfa_810'), commercial_net_sqft: t('tfa_930'),
  residential_gross_sqft: t('tfa_631'), residential_net_sqft: t('tfa_932'), housing_units: t('tfa_811'),
  ami_10: t('tfa_813'), ami_20: t('tfa_815'), ami_30: t('tfa_819'), ami_40: t('tfa_817'), ami_50: t('tfa_822'),
  ami_60: t('tfa_824'), ami_70: t('tfa_826'), ami_80: t('tfa_828'), ami_90: t('tfa_830'), ami_100: t('tfa_832'),
  ami_110: t('tfa_834'), ami_120: t('tfa_836'), ami_greater_than_120: t('tfa_838'),
  // Impact
  current_pt: t('tfa_841'), current_ft: t('tfa_842'), new_pt: t('tfa_843'), new_ft: t('tfa_844'),
  indirect_pt: t('tfa_854'), indirect_ft: t('tfa_855'),
  owners_detroit: select('tfa_861'), owners_veterans: select('tfa_865'), owners_immigrants: select('tfa_869'),
  owners_lgbtq: select('tfa_873'), owners_returning: select('tfa_877'), owners_cdo: select('tfa_881'),
  cdo_pct: t('tfa_885'), owner_count: t('tfa_886'),
  ethnicities: multi('tfa_888'), ethnicity_other_text: t('tfa_899'),
  eth_count_black_or_african_american: t('tfa_901'), eth_count_american_indian_or_alaska_native: t('tfa_902'),
  eth_count_asian: t('tfa_903'), eth_count_white: t('tfa_904'), eth_count_hispanic_or_latino: t('tfa_905'),
  eth_count_middle_eastern_or_north_african: t('tfa_906'), eth_count_native_hawaiian_or_pacific_islander: t('tfa_907'),
  eth_count_multiracial_or_multiethnic: t('tfa_908'), eth_count_something_else: t('tfa_909'),
  genders: multi('tfa_912'), gender_other_text: t('tfa_918'),
  gender_count_men: t('tfa_920'), gender_count_women: t('tfa_921'), gender_count_nonbinary: t('tfa_922'), gender_count_something_else: t('tfa_923'),
  // Required and Supporting Documents
  doc_project_plan: file('tfa_278'), doc_dev_budget: file('tfa_283'), doc_team_list: file('tfa_603'),
  doc_pfs: file('tfa_285'), doc_tax_returns: file('tfa_367'), doc_bank_statements: file('tfa_369'),
  // Acknowledgements
  ack_truthful: checkbox('tfa_427'), ack_not_guaranteed: checkbox('tfa_581'), ack_credit: checkbox('tfa_585'),
}
