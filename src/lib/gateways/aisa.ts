/** AIsa.one Similarweb direct API gateway (29 endpoints).
 *  Returns null when AISA_API_KEY is unset. */

const BASE = "https://api.aisa.one/apis/v1/similarweb";

export interface AisaResult<T = unknown> {
  data: T;
  costMicro: number;
}

async function aisaGet<T = unknown>(
  path: string,
  params: Record<string, string>,
): Promise<AisaResult<T> | null> {
  const key = process.env.AISA_API_KEY;
  if (!key) return null;
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const costMicro = Number(res.headers.get("X-AIsa-Cost-Micro") ?? 0);
    return { data: (await res.json()) as T, costMicro };
  } catch {
    return null;
  }
}

export const aisa = {
  similarSites: (domain: string) => aisaGet("/website/similar-sites", { domain }),
  keywordCompetitors: (domain: string) =>
    aisaGet("/search/keyword-competitors", { domain }),
  trafficEngagement: (domain: string) =>
    aisaGet("/website/traffic-engagement", { domain }),
  trafficSources: (domain: string) =>
    aisaGet("/segments/traffic-sources", { domain }),
  ppcSpend: (domain: string) => aisaGet("/website/ppc-spend", { domain }),
  referrals: (domain: string) => aisaGet("/website/referrals", { domain }),
  demographics: (domain: string) =>
    aisaGet("/website/traffic-by-demographics/aggregated", { domain }),
  trafficTrend: (domain: string) => aisaGet("/website/traffic-trend", { domain }),
};
