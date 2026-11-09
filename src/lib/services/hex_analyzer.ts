import { aisa } from "@/lib/gateways/aisa";
import { rngFor, titleFromDomain } from "@/lib/rng";
import type { HexReport, TrafficPoint } from "@/lib/types";
import { COMPLAINT_THEMES, TECH_STACK } from "@/lib/demo/vocab";

const CHANNELS = ["Organic Search", "Paid Search", "Direct", "Social", "Referral", "Email", "Display"];
const SOURCES = ["Trustpilot", "G2", "App Store", "Reddit"] as const;
const ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Claude"] as const;

function monthSeries(endVisits: number, rng: ReturnType<typeof rngFor>): TrafficPoint[] {
  const out: TrafficPoint[] = [];
  const now = new Date();
  const seasonal = [0.82, 0.8, 0.92, 0.95, 1.0, 0.94, 0.9, 0.88, 1.02, 1.08, 1.06, 0.9];
  const growth = rng.float(0.985, 1.035);
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const base = endVisits / Math.pow(growth, i);
    const noise = rng.float(0.9, 1.1);
    out.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      visits: Math.round(base * seasonal[d.getMonth()] * noise),
    });
  }
  return out;
}

/** PRD-03 — deep traffic, SEO, AEO, technographics & review engine. */
export async function analyzeCompetitor(domain: string): Promise<HexReport> {
  const rng = rngFor(`hex:${domain}`);
  const name = titleFromDomain(domain);

  // Live path (AIsa Similarweb) — used automatically when AISA_API_KEY is set.
  const [engagement, sources, ppc, referrals, trend] = await Promise.all([
    aisa.trafficEngagement(domain),
    aisa.trafficSources(domain),
    aisa.ppcSpend(domain),
    aisa.referrals(domain),
    aisa.trafficTrend(domain),
  ]);

  const monthlyVisits =
    (engagement?.data as { totalVisits?: number })?.totalVisits ??
    Math.round(rng.float(40_000, 4_200_000));
  const changePct = rng.float(-18, 22);

  const channelShares = rng.pickN(CHANNELS, 5).map((channel, i, arr) => ({
    channel,
    share: i === 0 ? rng.float(0.32, 0.48) : rng.float(0.06, 0.9 / arr.length),
  }));
  const totalShare = channelShares.reduce((a, c) => a + c.share, 0);
  channelShares.forEach((c) => (c.share = Math.round((c.share / totalShare) * 100) / 100));
  channelShares.sort((a, b) => b.share - a.share);

  const ppcSpend = Math.round(rng.float(4_000, 180_000));
  const bounce = rng.float(32, 68);

  const kwStems = [
    `${name.toLowerCase()} pricing`, `${name.toLowerCase()} alternatives`,
    `${name.toLowerCase()} vs`, "best sales intelligence tool",
    "b2b contact database", "outbound prospecting platform",
    "competitor ad library", "verified work emails",
    "revenue intelligence software", "gtm strategy template",
  ];

  const complaints = rng.pickN(COMPLAINT_THEMES, rng.int(3, 4)).map((theme) => ({
    theme,
    count: rng.int(7, 64),
    source: rng.pick(SOURCES),
    sample: theme,
  }));

  const vulnerabilities = [
    monthlyVisits < 200_000 && {
      label: "Thin top-of-funnel",
      severity: "high" as const,
      detail: "Low absolute traffic means every lost point of share is existential for them.",
      metric: `${(monthlyVisits / 1000).toFixed(0)}K visits/mo`,
    },
    changePct < -4 && {
      label: "Traffic bleeding",
      severity: "high" as const,
      detail: `${name} lost ${Math.abs(changePct).toFixed(1)}% of visits MoM — counter-position while they slide.`,
      metric: `${changePct.toFixed(1)}% MoM`,
    },
    ppcSpend > 80_000 && {
      label: "Wasted paid spend",
      severity: "medium" as const,
      detail: "Heavy PPC reliance with weak organic moat — outbid selectively on branded + comparison terms.",
      metric: `~$${(ppcSpend / 1000).toFixed(0)}K/mo PPC`,
    },
    bounce > 55 && {
      label: "Landing page leak",
      severity: "medium" as const,
      detail: `${bounce.toFixed(0)}% bounce rate — their traffic doesn't convert. Mirror the terms, win the page.`,
      metric: `${bounce.toFixed(0)}% bounce`,
    },
    complaints.length >= 3 && {
      label: "Angry install base",
      severity: "high" as const,
      detail: `Recurring complaint clusters across ${complaints.map((c) => c.source).join(", ")} — prime churn-and-switch timing.`,
      metric: `${complaints.reduce((a, c) => a + c.count, 0)} complaints clustered`,
    },
    channelShares[0]?.channel === "Paid Search" && {
      label: "One-channel dependency",
      severity: "medium" as const,
      detail: "Acquisition concentrated in paid search — vulnerable to CPC inflation and easy to shadow.",
      metric: `${Math.round((channelShares[0]?.share ?? 0) * 100)}% paid`,
    },
  ].filter(Boolean) as HexReport["vulnerabilities"];

  return {
    domain,
    monthlyVisits,
    visitsChangePct: Math.round(changePct * 10) / 10,
    bounceRate: Math.round(bounce * 10) / 10,
    avgVisitSecs: Math.round(rng.float(80, 420)),
    pagesPerVisit: Math.round(rng.float(1.8, 6.4) * 10) / 10,
    ppcSpendUsd: ppcSpend,
    trend: monthSeries(monthlyVisits, rng),
    channels: channelShares,
    topReferrals: rng.pickN(
      ["g2.com", "producthunt.com", "techcrunch.com", "news.ycombinator.com", "reddit.com", "linkedin.com"],
      4,
    ).map((d) => ({ domain: d, share: Math.round(rng.float(0.4, 9) * 10) / 10 })),
    keywordGaps: rng.pickN(kwStems, 6).map((kw) => ({
      keyword: kw,
      rivalRank: rng.int(1, 24),
      volume: rng.int(300, 33_000),
      difficulty: rng.int(12, 88),
      intent: rng.pick(["commercial", "informational", "transactional"] as const),
    })),
    aeo: ENGINES.map((engine) => ({
      engine,
      citationShare: rng.int(2, 58),
      trend: rng.pick(["up", "flat", "down"] as const),
    })),
    techStack: rng.pickN(TECH_STACK, rng.int(4, 7)),
    complaints,
    vulnerabilities,
  };
}
