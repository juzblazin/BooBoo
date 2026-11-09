import { aisa } from "@/lib/gateways/aisa";
import { treg } from "@/lib/gateways/treg";
import { rngFor, titleFromDomain } from "@/lib/rng";
import { store } from "@/lib/store";
import type { Rival } from "@/lib/types";
import { RIVAL_PREFIXES, RIVAL_SUFFIXES } from "@/lib/demo/vocab";

const DIRECTORY_BLACKLIST = new Set([
  "g2.com", "capterra.com", "linkedin.com", "facebook.com", "twitter.com",
  "x.com", "youtube.com", "wikipedia.org", "crunchbase.com", "glassdoor.com",
  "trustpilot.com", "google.com", "bing.com", "apple.com", "amazon.com",
]);

function isDirectory(domain: string) {
  return DIRECTORY_BLACKLIST.has(domain) || DIRECTORY_BLACKLIST.has(domain.split(".").slice(-2).join("."));
}

function demoRivals(userDomain: string): Rival[] {
  const rng = rngFor(`rivals:${userDomain}`);
  const stem = userDomain.split(".")[0].replace(/[^a-z]/g, "");
  const domains = new Set<string>();

  // A couple of lookalikes, then distinct category-flavored brand names —
  // the mix Similarweb's similar-sites graph actually returns.
  const candidates = [
    `${stem}hq`, `get${stem}`,
    ...Array.from({ length: 18 }, () => {
      const p = rng.pick(RIVAL_PREFIXES);
      const sfx = rng.pick(RIVAL_SUFFIXES);
      return rng.chance(0.75) ? `${p}${sfx}` : `${p}${stem.slice(0, 4)}${sfx}`;
    }),
  ];

  for (const c of candidates) {
    if (domains.size >= 8) break;
    const d = `${c.replace(/[^a-z0-9]/g, "")}.com`;
    if (d !== userDomain && !isDirectory(d)) domains.add(d);
  }

  const kinds: Rival["kind"][] = ["direct", "direct", "direct", "search", "search", "paid", "search", "paid"];
  return [...domains].slice(0, 8).map((domain, i) => ({
    domain,
    name: titleFromDomain(domain),
    kind: kinds[i] ?? "search",
    overlapScore: Math.round(rng.float(52, 96) - i * rng.float(1, 3)),
    reason:
      kinds[i] === "direct"
        ? "Closest head-to-head rival in the category"
        : kinds[i] === "search"
          ? "Competes on the same commercial keywords"
          : "Bidding on your category in paid channels",
    preselected: i < 3,
  }));
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "your", "their", "from",
  "business", "idea", "tool", "tools", "platform", "software", "like",
  "want", "need", "best", "make", "made", "help", "helps", "helping",
  "sell", "selling", "build", "building", "people", "companies", "company",
]);

/** Free-text idea → plausible rival set, seeded by the idea's keywords. */
function ideaRivals(idea: string): Rival[] {
  const rng = rngFor(`idea:${idea.toLowerCase()}`);
  const keywords = idea
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const stems = keywords.length ? keywords : ["signal", "nova"];

  const domains = new Set<string>();
  const cands = Array.from({ length: 30 }, () => {
    const k = rng.pick(stems);
    const p = rng.pick(RIVAL_PREFIXES);
    const sfx = rng.pick(RIVAL_SUFFIXES);
    const r = rng.next();
    return r < 0.4 ? `${p}${k}` : r < 0.72 ? `${k}${sfx}` : `${p}${sfx}`;
  });

  for (const c of cands) {
    if (domains.size >= 8) break;
    const d = `${c.replace(/[^a-z0-9]/g, "")}.com`;
    if (!isDirectory(d)) domains.add(d);
  }

  const kinds: Rival["kind"][] = ["direct", "direct", "direct", "search", "paid", "search", "paid", "search"];
  return [...domains].slice(0, 8).map((domain, i) => ({
    domain,
    name: titleFromDomain(domain),
    kind: kinds[i] ?? "search",
    overlapScore: Math.round(rng.float(50, 94) - i * rng.float(1, 3)),
    reason:
      kinds[i] === "direct"
        ? "Closest match to the idea you described"
        : kinds[i] === "search"
          ? "Ranks for the keywords this market buys on"
          : "Spends on paid acquisition in this space",
    preselected: i < 3,
  }));
}

export interface DiscoverResult {
  mode: "domain" | "idea";
  /** Domain in domain-mode; the raw idea text in idea-mode. */
  domain: string;
  rivals: Rival[];
}

/** Summon entry point — a domain, an existing domain, or a free-text idea. */
export async function discoverForQuery(query: string): Promise<DiscoverResult> {
  const raw = query.trim();
  const asDomain = raw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(asDomain)) {
    return { mode: "domain", domain: asDomain, rivals: await discoverRivals(asDomain) };
  }
  return { mode: "idea", domain: raw, rivals: ideaRivals(raw) };
}

/** PRD-02 — <4s single-URL competitor discovery ("Summon Rivals"). */
export async function discoverRivals(userDomain: string): Promise<Rival[]> {
  const domain = userDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const cached = await store.getDomainCache(domain);
  if (cached?.rivals?.length) return cached.rivals;

  const [similar, keywords, lookalikes] = await Promise.all([
    aisa.similarSites(domain),
    aisa.keywordCompetitors(domain),
    treg.oceanLookalikes(domain),
  ]);

  let rivals: Rival[] | null = null;
  if (similar || keywords || lookalikes) {
    // Map live payloads onto the Rival shape as gateways become available.
    const raw: { domain: string; score: number; kind: Rival["kind"] }[] = [];
    const push = (list: unknown, kind: Rival["kind"]) => {
      if (!Array.isArray(list)) return;
      for (const item of list as { domain?: string; score?: number }[]) {
        if (item?.domain && !isDirectory(item.domain))
          raw.push({ domain: item.domain, score: item.score ?? 50, kind });
      }
    };
    push((similar as { data?: unknown })?.data, "direct");
    push((keywords as { data?: unknown })?.data, "search");
    push((lookalikes as { data?: unknown })?.data, "direct");
    if (raw.length) {
      const seen = new Set<string>();
      rivals = raw
        .filter((r) => !seen.has(r.domain) && seen.add(r.domain))
        .slice(0, 8)
        .map((r, i) => ({
          domain: r.domain,
          name: titleFromDomain(r.domain),
          kind: r.kind,
          overlapScore: Math.round(r.score),
          reason:
            r.kind === "direct"
              ? "Closest head-to-head rival in the category"
              : "Competes on the same commercial keywords",
          preselected: i < 3,
        }));
    }
  }

  rivals ??= demoRivals(domain);
  await store.putDomainCache(domain, { rivals, fetchedAt: new Date().toISOString() });
  return rivals;
}
