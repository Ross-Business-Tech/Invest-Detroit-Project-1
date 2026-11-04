// Word lists and patterns the guardrail uses. Kept separate from the decision logic so the
// content owner can tune them without touching code paths. All patterns run on normalized,
// lowercased text (see normalize.js).

import { FIELD_GUIDE, TOPICS } from '../fieldGuide.js'

// ---- Attempts to change the assistant's rules or role ---------------------------------------
export const INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget|override|bypass|skip|drop|abandon)\b[^.?!]{0,40}\b(instructions?|rules?|prompts?|guardrails?|guidelines|restrictions?|filters?|previous|prior|earlier|above|system|programming|policies)\b/,
  /\b(new|updated|real|actual|true)\s+(instructions?|rules|system prompt|directive)\b/,
  /\bfrom now on\b[^.?!]{0,40}\b(you|your|act|respond|answer|be)\b/,
  /\byou\s+(are|re)\s+(now|no longer|actually|really)\b/,
  /\b(act|behave|respond|answer)\s+(as|like)\s+(an?\s+|my\s+)?(unrestricted|unfiltered|general|different|new|evil|other)?\s*(ai|assistant|chatbot|bot|gpt|chatgpt|llm|dan|model)\b/,
  /\b(pretend|imagine|suppose)\s+(that\s+)?(you|you're|you are|to be)\b/,
  /\b(role[\s-]?play|play (the|a) role|let'?s play a game|stay in character|in character)\b/,
  /\b(hypothetically|in a (fictional|hypothetical|made[\s-]up) (world|scenario|story)|for a (story|novel|movie) where)\b/,
  /\b(jailbreak|jail break|dan mode|developer mode|god mode|debug mode|admin mode|sudo)\b/,
  /\b(no|without)\s+(rules|restrictions|filters|limits|guardrails|censorship)\b/,
  /\b(i('m| am)|this is|speaking as|as)\s+(the |an |a |your )?(admin|administrator|developer|dev|programmer|engineer|owner|operator|moderator|creator|system|anthropic|openai)\b/,
  /\b(admin|developer|system|root)\s+(override|access|command|mode|privileges?)\b/,
  /^\s*(system|assistant|developer)\s*:/m,
]

// ---- Requests for things the assistant must never reveal ------------------------------------
export const PROTECTED_PATTERNS = [
  /\b(system|hidden|internal|initial|original|secret|developer|base)\s+(prompt|instructions?|message|config(uration)?|rules|settings|directives?)\b/,
  /\b(your|the)\s+(prompt|instructions|configuration|guardrails?|rules)\b[^.?!]{0,30}\b(show|reveal|print|repeat|tell|share|display|output|list|give|copy)\b/,
  /\b(show|reveal|print|repeat|tell|share|display|output|list|give|copy|what (are|were|is))\b[^.?!]{0,30}\b(your|the)\s+(prompt|instructions|configuration|guardrails?|rules|system message)\b/,
  /\b(repeat|print|output)\b[^.?!]{0,20}\b(above|everything|verbatim|word for word)\b/,
  /\b(api[\s_-]?keys?|secret[\s_-]?keys?|access[\s_-]?tokens?|bearer tokens?|credentials|env(ironment)?\s+variables?|\.env\b|passwords?\b)/,
  /\b(other|another|previous|last|someone else'?s?|different)\s+(applicants?|applications?|users?|borrowers?|customers?|people)\b/,
]

// ---- Application-related requests to deceive ------------------------------------------------
export const INTEGRITY_PATTERNS = [
  /\b(lie|lying|lied|liar)\b/,
  /\b(fake|faking|faked|falsif\w*|fabricat\w*|forge|forging|forged|doctor(ed|ing)?|fudg\w*|misrepresent\w*|mislead\w*|deceiv\w*|cheat\w*)\b/,
  /\b(cook the books|pad (the|my) (numbers|figures|revenue|income)|inflat(e|ing|ed) (my |the |our )?(numbers|figures|revenue|income|sales|budget|jobs|employees))\b/,
  /\bexaggerat\w*\b/,
  /\bmak(e|ing) up\s+(the |my |our |a |some )?(numbers?|figures?|revenue|income|sales|data|information|employees?|jobs|owners?|documents?|statements?|tax returns?)\b/,
  /\b(hide|hiding|conceal\w*|cover(ing)? up|leave out|leaving out|omit\w*|not (mention|disclose|report|tell|say|include)|(do not|don'?t) (mention|disclose|report|tell|say|include))\b[^.?!]{0,50}\b(bankrupt\w*|conviction|convicted|criminal|record|arrest\w*|debts?|liens?|judgments?|garnish\w*|child support|lawsuits?|losses|loss)\b/,
  /\b(without (them|anyone|the (team|reviewer|lender|staff)) (finding out|knowing|noticing))\b/,
  /\b(so (they|the (team|reviewer|lender|staff)) (don'?t|won'?t|can'?t) (find out|notice|know|see))\b/,
  /\b(get away with|avoid (getting )?(caught|detection)|trick (the|a)? ?(review|reviewer|system|team|lender|check)|beat the (review|checks?|system)|fool (the|them))\b/,
  /\b(look|seem|appear)\s+(better|bigger|larger|more profitable)\s+than\s+(it|they|we|i)\s+(is|are|really|actually)\b/,
  /\b(say|answer|put|claim|write|enter|check|tick|select)\b[^.?!]{0,40}\b(even though|when (it|i|we|they) (is not|isn'?t|are not|aren'?t|do not|don'?t|does not|doesn'?t|am not|was not|wasn'?t))\b/,
]

// ---- Tasks outside the assistant's purpose --------------------------------------------------
export const OUT_OF_SCOPE_TASKS = [
  { category: 'creative', re: /\b(jokes?|poems?|poetry|haikus?|limericks?|songs?|lyrics|raps?|story|stories|novels?|fan ?fiction|screenplays?|riddles?|pun)\b/ },
  { category: 'homework', re: /\b(essays?|homework|assignments?|term papers?|book reports?|thesis|dissertation|lab reports?|quiz(zes)?|exam answers|test answers)\b/ },
  { category: 'trivia', re: /\b(who (won|wins|invented|discovered|sang|starred|played|directed|painted)|world cup|super ?bowl|nba|nfl|mlb|nhl|olympics?|oscars?|grammys?|celebrit\w*|movies?|tv shows?|netflix|video games?|horoscope|zodiac|weather|recipes?|capital (city )?of|population of|tallest|how far is|how old is|when (was|were|did) [^.?!]{0,40} (born|invented|founded|discovered|die|happen))\b/ },
  { category: 'programming', re: /\b(python|javascript|typescript|java|c\+\+|c#|ruby|golang|rust lang|php|swift code|kotlin|sql|html|css|regex|leetcode|sorting algorithm|algorithms?|source code|stack overflow|(write|fix|debug|refactor|review) (my |a |the |some |this )?(code|program|script|function|class|app|website))\b/ },
  { category: 'general_assistant', re: /\b(chat ?gpt|gpt-?\d|claude|gemini|copilot|bard|general[\s-]purpose|(do|answer|help with) anything|anything (else )?(i|you) want)\b/ },
  { category: 'math_homework', re: /\b(solve (this|the|my) (equation|problem|integral)|integrals?|derivatives? of|calculus|algebra homework|pythagorean)\b/ },
]

// Writing an application document is in scope even though "write" + "story/plan" can look creative.
export const APPLICATION_ARTIFACTS = /\b(executive summary|summary|project (plan|narrative|description)|business (plan|description)|narrative|describe (my|our|the) (business|project)|cover letter for (my|the) (loan|application)|budget|sources (and|&) uses)\b/

// ---- Words that show the message is about the application or business finance --------------
const STRONG_TERMS = [
  'loan', 'loans', 'borrow', 'borrowing', 'lender', 'lenders', 'lending', 'financing', 'finance', 'financial', 'funding', 'funder', 'funders', 'grant', 'grants',
  'budget', 'cost', 'costs', 'revenue', 'revenues', 'sales', 'profit', 'profits', 'profitability', 'income', 'net income', 'gross income', 'expense', 'expenses',
  'operating expenses', 'overhead', 'cash flow', 'equity', 'contribution', 'collateral', 'interest', 'debt', 'debts', 'credit', 'credit score',
  'financial statement', 'financial statements', 'balance sheet', 'profit and loss', 'p&l', 'income statement', 'tax return', 'tax returns', 'taxes', 'bank statement', 'bank statements',
  'business plan', 'project plan', 'narrative', 'executive summary', 'sources and uses', 'pro forma', 'projections', 'forecast',
  'square footage', 'square feet', 'sq ft', 'sqft', 'gross', 'net', 'ami', 'affordable', 'affordability', 'housing', 'units', 'rent', 'rental', 'lease', 'tenant', 'tenants',
  'property', 'real estate', 'construction', 'renovation', 'rehab', 'contractor', 'acquisition', 'refinance', 'refinancing', 'working capital', 'payroll',
  'employees', 'employee', 'jobs', 'hiring', 'owners', 'owner', 'ownership', 'llc', 'entity', 'ein', 'lara', 'cdo', 'invest detroit', 'application', 'apply', 'applicant',
  'intake', 'underwriting', 'appraisal', 'mortgage', 'valuation', 'assets', 'liabilities', 'depreciation', 'margin', 'margins', 'invoice', 'invoices',
  'accounting', 'bookkeeping', 'capital', 'down payment', 'guarantor', 'guarantee', 'personal guarantee', 'bankruptcy', 'lien', 'judgment', 'retail', 'office', 'mixed use', 'warehouse',
  'zip code', 'entity id', 'documents', 'document', 'paperwork', 'eligibility', 'eligible', 'qualify', 'approval', 'approved',
]
const WEAK_TERMS = [
  'business', 'company', 'project', 'form', 'question', 'questions', 'field', 'submit', 'review', 'detroit', 'money', 'dollars', 'number', 'numbers', 'figure', 'figures',
  'estimate', 'calculate', 'plan', 'describe', 'description', 'section', 'upload', 'attach', 'error', 'missing', 'required', 'total', 'amount', 'percent', 'percentage',
]
// Phrases that mean "help me with what's on the screen"
export const HELP_PHRASES = /\b(this (question|field|section|box|part|one)|more simply|simpler|plain (language|english)|explain (this|that|it|again)|what does (this|that|it) mean|i don'?t (understand|get it)|go to field|the review|review (said|says|found|flagged)|flagged|warning|why (is|does|did) (it|this|that)|what should i (put|enter|write|include|choose|select)|which (box|option|one) (should|do) i)\b/

// Field guide keywords (several languages) also count as strong application terms.
const GUIDE_TERMS = [...new Set([...Object.values(FIELD_GUIDE), ...TOPICS].flatMap((e) => e.keywords || []))]
  // Short Latin keywords are too generic on their own; Chinese words are often two characters.
  .map((k) => k.toLowerCase()).filter((k) => (/[a-z]/.test(k) ? k.length > 2 : k.length >= 2) && !['person', 'call', 'email', 'phone', 'contact', 'someone', 'human', 'staff'].includes(k))

export const IN_SCOPE_STRONG = [...new Set([...STRONG_TERMS, ...GUIDE_TERMS])]
export const IN_SCOPE_WEAK = WEAK_TERMS

export const GREETING_OR_GENERIC = /^(hi|hello|hey|good (morning|afternoon|evening)|help|help me|can you help( me)?|i (have|got) a question|i need help|question|are you there|thanks|thank you|ok|okay)\b[\s!.?]*$/
