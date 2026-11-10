/** Tiered packaging & entitlement matrix (PRD addendum §1).
 *  Client-safe: no server imports, so the input UI can read the same limits. */

export const PLAN_TIERS = ["FREE_TRIAL", "PREMIUM", "SCALE"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export interface PlanSpec {
  tier: PlanTier;
  slug: "free" | "premium" | "scale";
  label: string;
  maxCompetitorsPerTask: number;
  monthlyTaskRuns: number;
  elixirs: number;
  directDials: number;
  /** Placeholder list prices (USD / month) until final pricing is set. */
  monthlyPriceUsd: number;
  annualPriceUsd: number;
}

export const PLANS: Record<PlanTier, PlanSpec> = {
  FREE_TRIAL: {
    tier: "FREE_TRIAL",
    slug: "free",
    label: "Free Trial",
    maxCompetitorsPerTask: 1,
    monthlyTaskRuns: 1,
    elixirs: 5,
    directDials: 0,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
  },
  PREMIUM: {
    tier: "PREMIUM",
    slug: "premium",
    label: "Premium",
    maxCompetitorsPerTask: 3,
    monthlyTaskRuns: 10,
    elixirs: 2500,
    directDials: 250,
    monthlyPriceUsd: 149,
    annualPriceUsd: 129,
  },
  SCALE: {
    tier: "SCALE",
    slug: "scale",
    label: "Scale",
    maxCompetitorsPerTask: 5,
    monthlyTaskRuns: 35,
    elixirs: 10000,
    directDials: 1000,
    monthlyPriceUsd: 899,
    annualPriceUsd: 749,
  },
};

/** Hard ceiling across every plan — requests above this can't be upgraded into. */
export const MAX_COMPETITORS_ANY_PLAN = PLANS.SCALE.maxCompetitorsPerTask;

const LEGACY_TIERS: Record<string, PlanTier> = {
  free: "FREE_TRIAL",
  apprentice: "PREMIUM",
  sorcerer: "PREMIUM",
  coven: "SCALE",
  premium: "PREMIUM",
  scale: "SCALE",
  free_trial: "FREE_TRIAL",
};

/** Maps legacy plan ids (free/apprentice/sorcerer/coven) and slugs onto the 3 tiers. */
export function normalizeTier(value: unknown): PlanTier {
  const v = String(value ?? "");
  if ((PLAN_TIERS as readonly string[]).includes(v)) return v as PlanTier;
  return LEGACY_TIERS[v.toLowerCase()] ?? "FREE_TRIAL";
}

/** Cheapest tier whose competitor limit covers `count`, or null if none does. */
export function tierForCompetitorCount(count: number): PlanTier | null {
  return PLAN_TIERS.find((t) => PLANS[t].maxCompetitorsPerTask >= count) ?? null;
}
