import { randomUUID } from "node:crypto";
import { checkEntitlement, type GateRejection } from "@/lib/entitlements";
import { isJobActive, startCastJob } from "@/lib/jobs";
import { titleFromDomain } from "@/lib/rng";
import { currentWorkspace, store } from "@/lib/store";
import type { GrimoireSpell, Rival } from "@/lib/types";

/** Runs stuck in "brewing" past this are treated as crashed and refunded (SLA is 120s). */
const STALE_RUN_MS = 10 * 60 * 1000;

const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/;

export function normalizeDomain(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

export interface GtmTaskInput {
  userDomain: unknown;
  competitorDomains: unknown;
  rivals?: Rival[];
  companyName?: string;
  category?: string;
}

export type GtmTaskResult = { ok: true; spell: GrimoireSpell } | ({ ok: false } & GateRejection);

/** AC-02 — refunds runs whose worker died, or failed without its refund landing. */
export async function reapStaleRuns(workspaceId: string) {
  const cutoff = Date.now() - STALE_RUN_MS;
  const spells = await store.listSpells(workspaceId);
  await Promise.all(
    spells
      .filter(
        (sp) =>
          sp.quotaState === "reserved" &&
          !isJobActive(sp.id) &&
          (sp.status === "failed" || (sp.status === "brewing" && Date.parse(sp.createdAt) < cutoff)),
      )
      .map((sp) => store.refundTaskRun(sp.id, "The analysis worker stopped responding — your run was refunded.")),
  );
}

/** Entitlement gate → quota lock → dispatch. Nothing paid is called before the gate passes. */
export async function createGtmTask(input: GtmTaskInput): Promise<GtmTaskResult> {
  // Idea mode passes free text as the subject, so only domain-like input is normalized.
  const asDomain = normalizeDomain(input.userDomain);
  const userDomain = DOMAIN_RE.test(asDomain) ? asDomain : String(input.userDomain ?? "").trim().toLowerCase();
  const raw = Array.isArray(input.competitorDomains) ? input.competitorDomains : [];
  const competitors = [...new Set(raw.map(normalizeDomain))].filter((d) => d && d !== userDomain);

  let ws = await currentWorkspace();
  const invalid = (error: string): GtmTaskResult => ({
    ok: false,
    status: 400,
    body: {
      error,
      code: "INVALID_REQUEST",
      currentTier: ws.planTier,
      maxCompetitors: ws.maxCompetitorsPerTask,
      requested: competitors.length,
      requiredTier: null,
      upgradeUrl: null,
    },
  });

  if (userDomain.length < 3) return invalid("Enter your product domain.");
  const bad = competitors.find((d) => !DOMAIN_RE.test(d));
  if (bad) return invalid(`"${bad}" isn't a valid competitor domain.`);

  await reapStaleRuns(ws.id);
  ws = (await store.getWorkspace(ws.id)) ?? ws;

  const rejection = checkEntitlement(ws, competitors.length);
  if (rejection) return { ok: false, ...rejection };

  const reserved = await store.reserveTaskRun(ws.id, competitors.length);
  if (!reserved) {
    // Lost a race with a concurrent request — re-evaluate against fresh state.
    const fresh = (await store.getWorkspace(ws.id)) ?? ws;
    const again =
      checkEntitlement(fresh, competitors.length) ??
      checkEntitlement({ ...fresh, monthlyTaskRunsRemaining: 0 }, competitors.length)!;
    return { ok: false, ...again };
  }

  const spell: GrimoireSpell = {
    id: `sp_${randomUUID().slice(0, 12)}`,
    workspaceId: ws.id,
    userDomain,
    companyName: input.companyName ?? titleFromDomain(userDomain),
    category: input.category ?? "B2B SaaS",
    rivals: input.rivals ?? [],
    selectedDomains: competitors,
    tierAtExecution: reserved.planTier,
    quotaState: "reserved",
    status: "brewing",
    progress: [],
    hexes: null,
    ads: null,
    oracle: null,
    coven: null,
    personas: null,
    readiness: null,
    totalApiCostMicro: 0,
    publicShareSlug: null,
    createdAt: new Date().toISOString(),
  };

  try {
    await store.putSpell(spell);
  } catch (err) {
    await store.releaseTaskRun(ws.id);
    throw err;
  }

  startCastJob(spell);
  return { ok: true, spell };
}
