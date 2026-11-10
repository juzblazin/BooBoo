import { MAX_COMPETITORS_ANY_PLAN, PLANS, tierForCompetitorCount, type PlanTier } from "@/lib/plans";
import type { Workspace } from "@/lib/types";

export type GateCode =
  | "INVALID_REQUEST"
  | "COMPETITOR_LIMIT_EXCEEDED"
  | "ABOVE_MAX_PLAN"
  | "FREE_TRIAL_CONSUMED"
  | "TASK_RUNS_EXHAUSTED";

export interface GateRejection {
  status: 400 | 402 | 403;
  body: {
    error: string;
    code: GateCode;
    currentTier: PlanTier;
    maxCompetitors: number;
    requested: number;
    requiredTier: PlanTier | null;
    upgradeUrl: string | null;
  };
}

const upgradeUrl = (tier: PlanTier | null) => (tier ? `/pricing?plan=${PLANS[tier].slug}` : null);

/** AC-01 — pure entitlement check, run before any ingestion worker is dispatched.
 *  402 = an upgrade unlocks it; 403 = no plan allows it. */
export function checkEntitlement(ws: Workspace, competitorCount: number): GateRejection | null {
  const plan = PLANS[ws.planTier];
  const base = {
    currentTier: ws.planTier,
    maxCompetitors: ws.maxCompetitorsPerTask,
    requested: competitorCount,
  };

  if (competitorCount < 1) {
    return {
      status: 400,
      body: { ...base, error: "Pick at least one competitor to analyze.", code: "INVALID_REQUEST", requiredTier: null, upgradeUrl: null },
    };
  }

  if (competitorCount > MAX_COMPETITORS_ANY_PLAN) {
    return {
      status: 403,
      body: {
        ...base,
        error: `A single analysis covers at most ${MAX_COMPETITORS_ANY_PLAN} competitors.`,
        code: "ABOVE_MAX_PLAN",
        requiredTier: null,
        upgradeUrl: null,
      },
    };
  }

  if (competitorCount > ws.maxCompetitorsPerTask) {
    const requiredTier = tierForCompetitorCount(competitorCount);
    return {
      status: 402,
      body: {
        ...base,
        error: `${plan.label} covers ${ws.maxCompetitorsPerTask} competitor${ws.maxCompetitorsPerTask === 1 ? "" : "s"} per analysis. Upgrade to ${requiredTier ? PLANS[requiredTier].label : "a higher plan"} to analyze ${competitorCount}.`,
        code: "COMPETITOR_LIMIT_EXCEEDED",
        requiredTier,
        upgradeUrl: upgradeUrl(requiredTier),
      },
    };
  }

  if (ws.planTier === "FREE_TRIAL" && ws.freeTrialConsumed) {
    return {
      status: 402,
      body: {
        ...base,
        error: "Your free analysis has been used. Upgrade to Premium to keep analyzing.",
        code: "FREE_TRIAL_CONSUMED",
        requiredTier: "PREMIUM",
        upgradeUrl: upgradeUrl("PREMIUM"),
      },
    };
  }

  if (ws.monthlyTaskRunsRemaining <= 0) {
    const next: PlanTier | null =
      ws.planTier === "FREE_TRIAL" ? "PREMIUM" : ws.planTier === "PREMIUM" ? "SCALE" : null;
    return {
      status: 402,
      body: {
        ...base,
        error:
          ws.planTier === "FREE_TRIAL"
            ? "Your free analysis is already running. Upgrade to Premium to run more."
            : "No analyses left this month.",
        code: "TASK_RUNS_EXHAUSTED",
        requiredTier: next,
        upgradeUrl: upgradeUrl(next),
      },
    };
  }

  return null;
}
