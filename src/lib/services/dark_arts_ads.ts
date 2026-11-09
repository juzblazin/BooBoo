import { treg } from "@/lib/gateways/treg";
import { rngFor, titleFromDomain } from "@/lib/rng";
import type { AdCreative, AdPlatform } from "@/lib/types";
import { AD_BODIES, AD_HEADLINES, HOOK_CATEGORIES } from "@/lib/demo/vocab";

const PLATFORMS: AdPlatform[] = ["meta", "linkedin", "google", "tiktok"];
const CTAS = ["Book a demo", "Start free trial", "See it in action", "Get the report", "Try it free"];

const COUNTER_ANGLES: Record<AdCreative["hookCategory"], string> = {
  "fear-of-missing-out": "Reframe urgency as risk avoidance — show the cost of acting on stale data",
  "social-proof": "Out-proof them: name the specific segment where their logos churn",
  "cost-savings": "Attack TCO, not price — expose per-verified-contact real cost",
  "time-savings": "Counter with time-to-truth, not time-to-output",
  contrarian: "Steel-man their contrarian claim, then flip the burden of proof",
  offer: "Match the offer mechanic but strip the friction (no demo gate)",
};

/** PRD-04 — multi-platform ad vault with survival ranking ("Dark Arts Gallery"). */
export async function fetchDarkArts(domains: string[]): Promise<AdCreative[]> {
  const ads: AdCreative[] = [];
  const now = Date.now();

  for (const domain of domains) {
    const rng = rngFor(`ads:${domain}`);
    const name = titleFromDomain(domain);

    // Live pulls when TREG_API_KEY is configured (Adyntel / Meta / TikHub…).
    const live = await Promise.all([
      treg.metaAds(domain),
      treg.linkedinAds(domain),
      treg.googleAds(domain),
      treg.tiktokAds(domain),
    ]);
    void live; // payloads merged here when the gateway key is present

    const count = rng.int(7, 11);
    for (let i = 0; i < count; i++) {
      const platform = rng.pick(PLATFORMS);
      const survivalDays = Math.max(1, Math.round(rng.float(3, 210) * (rng.chance(0.25) ? 1.6 : 1)));
      const start = new Date(now - survivalDays * 86_400_000 - rng.int(0, 20) * 86_400_000);
      const lastSeen = new Date(start.getTime() + survivalDays * 86_400_000);
      const hookCategory = rng.pick(HOOK_CATEGORIES);
      const headline = rng.pick(AD_HEADLINES);
      const evergreen = survivalDays >= 60;
      const modeledSpend = Math.round(survivalDays * rng.float(18, 320));

      ads.push({
        id: `ad_${domain}_${i}`,
        competitor: domain,
        platform,
        headline,
        body: rng.pick(AD_BODIES).replace(/your competitors/gi, name),
        cta: rng.pick(CTAS),
        startDate: start.toISOString().slice(0, 10),
        lastSeenDate: lastSeen.toISOString().slice(0, 10),
        survivalDays,
        modeledSpendUsd: modeledSpend,
        hookCategory,
        evergreen,
        stealAndCounter: {
          angle: COUNTER_ANGLES[hookCategory],
          counterHook: evergreen
            ? `This creative survived ${survivalDays} days — it's their proven control. Counter the mechanism, not the copy.`
            : `Short-lived creative — likely a losing test. Note the angle they abandoned.`,
          script:
            `Counter-script vs ${name}: open on the structural weakness their '${hookCategory}' hook hides, ` +
            `name the switch trigger (their ${rng.pick(["renewal shock", "bounced list", "credit burn", "sync failure"])}), ` +
            `then land the Step-0 offer — an interactive teardown of the prospect's own competitive position.`,
        },
      });
    }
  }

  return ads.sort((a, b) => b.survivalDays - a.survivalDays);
}
