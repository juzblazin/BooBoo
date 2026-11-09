export type RivalKind = "direct" | "search" | "paid";

export interface Rival {
  domain: string;
  name: string;
  kind: RivalKind;
  overlapScore: number; // 0-100
  reason: string;
  preselected?: boolean;
}

export interface TrafficPoint {
  month: string; // "2024-12"
  visits: number;
}

export interface ChannelShare {
  channel: string;
  share: number; // 0-1
}

export interface KeywordGap {
  keyword: string;
  rivalRank: number;
  volume: number;
  difficulty: number; // 0-100
  intent: "commercial" | "informational" | "transactional";
}

export interface AeoEngine {
  engine: "ChatGPT" | "Perplexity" | "Gemini" | "Claude";
  citationShare: number; // 0-100
  trend: "up" | "flat" | "down";
}

export interface ComplaintCluster {
  theme: string;
  count: number;
  source: string; // Trustpilot | G2 | App Store | Reddit
  sample: string;
}

export interface Vulnerability {
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
  metric?: string;
}

export interface HexReport {
  domain: string;
  monthlyVisits: number;
  visitsChangePct: number;
  bounceRate: number;
  avgVisitSecs: number;
  pagesPerVisit: number;
  ppcSpendUsd: number;
  trend: TrafficPoint[];
  channels: ChannelShare[];
  topReferrals: { domain: string; share: number }[];
  keywordGaps: KeywordGap[];
  aeo: AeoEngine[];
  techStack: { name: string; category: string }[];
  complaints: ComplaintCluster[];
  vulnerabilities: Vulnerability[];
}

export type AdPlatform = "meta" | "linkedin" | "google" | "tiktok";

export interface AdCreative {
  id: string;
  competitor: string;
  platform: AdPlatform;
  headline: string;
  body: string;
  cta: string;
  startDate: string;
  lastSeenDate: string;
  survivalDays: number;
  modeledSpendUsd: number;
  hookCategory:
    | "fear-of-missing-out"
    | "social-proof"
    | "cost-savings"
    | "time-savings"
    | "contrarian"
    | "offer";
  evergreen: boolean;
  stealAndCounter: {
    angle: string;
    counterHook: string;
    script: string;
  };
}

export type OracleCategory =
  | "movie"
  | "sports"
  | "conference"
  | "trend"
  | "holiday"
  | "macro";

export interface OracleEvent {
  id: string;
  title: string;
  category: OracleCategory;
  date: string; // ISO date
  crs: number; // Contextual Resonance Score 0-100
  hook: string;
}

export interface CampaignWave {
  phase: "Days 1–30" | "Days 31–60" | "Days 61–90";
  theme: string;
  objective: string;
  plays: { title: string; detail: string; sendDate: string }[];
}

export interface OracleTimeline {
  seasonality: { month: string; multiplier: number }[];
  events: OracleEvent[];
  waves: CampaignWave[];
}

export interface MarketTruth {
  truth: string;
  evidence: string;
  implication: string;
}

export interface Orthodoxy {
  belief: string;
  whyFalse: string;
  unservedPain: string;
}

export interface DebateTurn {
  agent: "alchemist" | "inquisitor" | "synthesizer";
  round: number;
  text: string;
}

export interface CovenTrialResult {
  corpus: {
    sitesScraped: number;
    transcripts: number;
    reviews: number;
    threads: number;
  };
  truths: MarketTruth[];
  orthodoxies: Orthodoxy[];
  debate: DebateTurn[];
  hypothesis: {
    wedge: string;
    positioning: string;
    icpNarrowing: string;
    offer: string;
    momTestQuestions: string[];
  };
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  firmographic: string;
  triggers: string[];
  hexHook: string;
  momQuestion: string;
}

export interface ReadinessGateResult {
  gate: number;
  name: string;
  score: number; // 0-100
  status: "pass" | "warn" | "fail";
  finding: string;
  fix: string;
}

export interface ReadinessScorecard {
  total: number; // 0-100
  motionLock: string;
  gates: ReadinessGateResult[];
}

export type CommitteeRole = "Economic Buyer" | "Champion" | "Technical Evaluator";

export interface Buyer {
  id: string;
  fullName: string;
  title: string;
  company: string;
  domain: string;
  seniority: "C-Suite" | "VP" | "Director" | "Head";
  committeeRole: CommitteeRole;
  trigger: string;
  competitorHexHook: string;
  oracleTimelineHook: string;
  momTestQuestion: string;
  recommendedSendDate: string;
  workEmail: string | null;
  emailVerificationStatus: "pending" | "valid" | "invalid" | "unverified";
  directPhone: string | null;
  phoneCarrierStatus: string | null;
  winningProvider: string | null;
  gdprLia: { rationale: string; balancingTest: string; generatedAt: string } | null;
  brewed: boolean;
}

export type SpellStatus = "brewing" | "ready" | "failed";
export type SalemState = "idle" | "stalking" | "brewing" | "summoned";

export interface CastEvent {
  step: string;
  label: string;
  detail?: string;
  state: SalemState;
  at: number; // ms timestamp
}

export interface GrimoireSpell {
  id: string;
  workspaceId: string;
  userDomain: string;
  companyName: string;
  category: string;
  rivals: Rival[];
  selectedDomains: string[];
  status: SpellStatus;
  progress: CastEvent[];
  hexes: HexReport[] | null;
  ads: AdCreative[] | null;
  oracle: OracleTimeline | null;
  coven: CovenTrialResult | null;
  personas: Persona[] | null;
  readiness: ReadinessScorecard | null;
  totalApiCostMicro: number;
  publicShareSlug: string | null;
  error?: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  planTier: "free" | "apprentice" | "sorcerer" | "coven";
  spellsBalance: number;
  elixirCreditsBalance: number;
  spellsUsed: number;
  parentAgencyWorkspaceId: string | null;
  whitelabel: { logoText?: string; accent?: string } | null;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  workspaceId: string;
  domain: string;
  alertChannel: "slack" | "email";
  alertTarget: string;
  lastCheckedAt: string | null;
  lastSignals: { kind: string; summary: string; at: string }[];
  createdAt: string;
}
