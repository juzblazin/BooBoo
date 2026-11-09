/**
 * Treg.to unified agent-tool catalog gateway.
 * One key unlocks the 4,000+ endpoint catalog (enrichment, ads, SEO,
 * reviews, social, culture). Returns null when TREG_API_KEY is unset so
 * services can fall back to deterministic demo intelligence.
 *
 * Cost discipline: every routed call sends X-Treg-Route-Max-Cost and the
 * X-Treg-Cost-Micro response header is logged into the spell ledger.
 */

const BASE = "https://api.treg.to/v1";

export interface TregResult<T = unknown> {
  data: T;
  costMicro: number;
  provider?: string;
}

export async function tregCall<T = unknown>(
  tool: string,
  params: Record<string, unknown>,
  opts: { maxCostUsd?: number; timeoutMs?: number } = {},
): Promise<TregResult<T> | null> {
  const key = process.env.TREG_API_KEY;
  if (!key) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (opts.maxCostUsd != null) {
    headers["X-Treg-Route-Max-Cost"] = String(opts.maxCostUsd);
  }

  try {
    const res = await fetch(`${BASE}/tools/${encodeURIComponent(tool)}/call`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 12_000),
    });
    if (!res.ok) return null;
    const costMicro = Number(res.headers.get("X-Treg-Cost-Micro") ?? 0);
    const data = (await res.json()) as T;
    return { data, costMicro };
  } catch {
    return null;
  }
}

/** Convenience wrappers for the catalog families used by Boo. */
export const treg = {
  firecrawl: (url: string) => tregCall("firecrawl.scrape", { url }),
  oceanLookalikes: (domain: string) => tregCall("ocean.lookalikes", { domain }),
  semrushCompetitors: (domain: string) => tregCall("semrush.organic-competitors", { domain }),
  keywordGap: (domain: string, rival: string) =>
    tregCall("semrush.keyword-gap", { domain, rival }),
  aeoVisibility: (domain: string) => tregCall("dataforseo.ai-visibility", { domain }),
  theirStack: (domain: string) => tregCall("theirstack.technologies", { domain }),
  trustpilot: (domain: string) => tregCall("trustpilot.reviews", { domain, stars: "1-3" }),
  metaAds: (domain: string) => tregCall("adyntel.meta-ads", { domain }),
  linkedinAds: (domain: string) => tregCall("adyntel.linkedin-ads", { domain }),
  googleAds: (domain: string) => tregCall("adyntel.google-ads", { domain }),
  tiktokAds: (domain: string) => tregCall("tikhub.tiktok-ads", { domain }),
  imdbUpcoming: () => tregCall("imdb.upcoming", {}),
  productHunt: () => tregCall("producthunt.launches", {}),
  redditThreads: (query: string) => tregCall("reddit.search", { query, sort: "comments" }),
  peopleSearch: (params: Record<string, unknown>) => tregCall("apollo.people-search", params),
  emailWaterfall: (name: string, domain: string) =>
    tregCall("router.email-waterfall", { name, domain }, { maxCostUsd: 0.05 }),
  phoneWaterfall: (name: string, domain: string) =>
    tregCall("router.phone-waterfall", { name, domain }, { maxCostUsd: 0.3 }),
  verifyEmail: (email: string) => tregCall("millionverifier.verify", { email }),
  hlrLookup: (phone: string) => tregCall("trestleiq.hlr", { phone }),
};
