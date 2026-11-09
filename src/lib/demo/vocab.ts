/** Vocabulary pools for deterministic demo intelligence. */

export const RIVAL_SUFFIXES = [
  "ly", "ify", "hub", "base", "flow", "stack", "wise", "labs", "hq", "loop",
  "pulse", "forge", "beam", "deck", "mint", "wave", "yard", "path", "dock", "nest",
];

export const RIVAL_PREFIXES = [
  "data", "growth", "signal", "prime", "clear", "metric", "rapid", "true", "open",
  "north", "swift", "bold", "apex", "keen", "vivid", "bright", "smart", "hyper",
  "omni", "next", "ever", "deep", "peak", "core", "edge", "nova", "zen",
];

export const FIRST_NAMES = [
  "Maya", "Daniel", "Priya", "Jonas", "Sofia", "Marcus", "Elena", "Tomas",
  "Aisha", "Ryan", "Ingrid", "Carlos", "Nina", "Victor", "Lena", "Omar",
  "Grace", "Felix", "Amara", "Henry", "Yuki", "Sara", "Pavel", "Chloe",
  "Anders", "Mei", "Ruben", "Alba", "Devon", "Katya", "Sam", "Isabel",
];

export const LAST_NAMES = [
  "Hartmann", "Okafor", "Lindqvist", "Marchetti", "Nguyen", "Feld", "Serrano",
  "Kowalski", "Tanaka", "Reyes", "Bergström", "Aldridge", "Novak", "Castellanos",
  "Iyer", "Moreau", "Kim", "Sørensen", "Vance", "Haugen", "Petit", "Almeida",
  "Brooks", "Zhang", "Meyer", "Costa", "Nakamura", "Ellis", "Romano", "Weber",
];

export const BUYER_COMPANIES = [
  "Northbeam Analytics", "Cinderworks", "Vantage Loop", "Helios Freight",
  "Copperline Systems", "Fjord Robotics", "Bramble & Co", "Lattice Fields",
  "Quartz Medical", "Bluepine Capital", "Ardent Robotics", "Sable Logistics",
  "Mistral Energy", "Copper Finch", "Aster Compliance", "Beacon Foundry",
  "Solstice Retail", "Ironwood Cloud", "Parallax Bio", "Cedar Pay",
  "Halcyon Legal", "Ozone Mobility", "Timberline AI", "Ferrous Health",
];

export const TITLES_BY_ROLE: Record<string, string[]> = {
  "Economic Buyer": ["VP Revenue Operations", "Chief Revenue Officer", "VP Sales", "Head of Growth", "CFO"],
  Champion: ["Director of Demand Generation", "Head of Marketing", "Director of Growth", "Growth Marketing Lead", "Director of Revenue Operations"],
  "Technical Evaluator": ["Director of Engineering", "VP Engineering", "Head of Data", "Director of Platform", "Lead Data Engineer"],
};

export const TRIGGERS = [
  "Installed a rival's tracking pixel 41 days ago",
  "Hiring 3 SDRs + a RevOps lead this quarter",
  "Left a 2-star review on a competitor last month",
  "Raised a Series A — new pipeline targets",
  "Just migrated off a legacy CRM",
  "Job post mentions 'outbound pipeline' twice",
  "Attended a competitor's webinar last week",
  "Traffic up 34% MoM — scaling acquisition",
  "Champion changed jobs into this account",
  "Complain publicly about manual prospecting on Reddit",
];

export const COMPLAINT_THEMES = [
  "Data accuracy decays fast — bounced emails killed our domain rep",
  "Support went silent after we signed the annual contract",
  "Pricing doubled at renewal with zero warning",
  "The UI feels like it was designed in 2014",
  "Export limits force you into the next tier",
  "Onboarding promised white-glove, delivered a PDF",
  "Integrations break every other sprint",
  "They count 'credits' for contacts they never verify",
  "Churned lists — half the 'verified' emails are dead",
  "Reporting dashboards time out on anything real",
];

export const AD_HEADLINES = [
  "Stop guessing who to call next",
  "Your pipeline is leaking — here's where",
  "Cut prospecting time by 73%",
  "The data layer your SDRs deserve",
  "Why top revenue teams ditched static lists",
  "Book 3x more meetings without more headcount",
  "Competitor intel your rivals wish you didn't have",
  "The last list you'll ever buy",
  "Revenue teams: this one's for you",
  "From URL to closed-won, faster",
];

export const AD_BODIES = [
  "Static databases decay 2.1% every month. We keep every record live, verified, and trigger-aware — so your team talks to buyers who actually care.",
  "Most teams waste 40% of ad spend retargeting the wrong accounts. See which accounts are actually in-market — before your competitors do.",
  "We analyzed 2.4M outbound sequences. The winners all did one thing differently: they led with evidence, not features.",
  "Trusted by 1,200+ revenue teams. Real-time signals, verified contacts, zero deliverability damage.",
  "Your competitors are already running this playbook. See the exact campaigns they run — and where they bleed budget.",
  "Built for teams who are done with 'spray and pray'. Narrow ICP, timed sends, verified contacts only.",
];

export const HOOK_CATEGORIES = [
  "fear-of-missing-out",
  "social-proof",
  "cost-savings",
  "time-savings",
  "contrarian",
  "offer",
] as const;

export const TECH_STACK = [
  { name: "Salesforce", category: "CRM" },
  { name: "HubSpot", category: "CRM" },
  { name: "Outreach", category: "Engagement" },
  { name: "Salesloft", category: "Engagement" },
  { name: "Segment", category: "CDP" },
  { name: "Snowflake", category: "Warehouse" },
  { name: "Marketo", category: "Automation" },
  { name: "6sense", category: "Intent" },
  { name: "Clearbit", category: "Enrichment" },
  { name: "Gong", category: "Revenue Intel" },
  { name: "Zendesk", category: "Support" },
  { name: "Intercom", category: "Support" },
  { name: "Stripe", category: "Billing" },
  { name: "WordPress", category: "CMS" },
  { name: "Webflow", category: "CMS" },
];

export const ORACLE_TITLES: Record<string, string[]> = {
  movie: [
    "Blockbuster sci-fi sequel premiere", "Award-season thriller release",
    "Major franchise film opening weekend", "Streaming hit season finale",
  ],
  sports: [
    "Championship playoff window", "International tournament group stage",
    "Marquee derby weekend", "Title fight main card",
  ],
  conference: [
    "SaaStr Annual", "INBOUND", "Dreamforce", "Web Summit",
    "Industry vertical summit", "RevOps leadership forum",
  ],
  trend: [
    "Viral LinkedIn debate on outbound deliverability",
    "Reddit r/sales thread spikes on data decay",
    "AI SDR discourse peaks on X",
    "Product Hunt launch wave for GTM tools",
  ],
  holiday: [
    "End-of-quarter budget flush", "Fiscal year planning window",
    "Black Friday / Q4 squeeze", "Post-summer pipeline restart",
  ],
  macro: [
    "Central bank rate decision", "Quarterly earnings season opens",
    "PMI print — sector sentiment shift", "VC funding report drops",
  ],
};

export const CATEGORIES = [
  "B2B SaaS", "Revenue Operations", "Sales Intelligence", "Marketing Automation",
  "Developer Tools", "Fintech Infrastructure",
];
