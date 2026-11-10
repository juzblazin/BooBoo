import type {
  Buyer,
  CovenTrialResult,
  GrimoireSpell,
  OracleEvent,
  Watchlist,
  Workspace,
} from "@/lib/types";
import type {
  DomainCacheEntry,
  LedgerEntry,
  StoreDriver,
  TeleportIntegration,
} from "./types";
import { PLANS, normalizeTier } from "@/lib/plans";

/** JSON-file store used when DATABASE_URL is not configured. Dev/demo only. */

interface FileData {
  workspaces: Record<string, Workspace>;
  spells: Record<string, GrimoireSpell>;
  buyers: Record<string, Record<string, Buyer>>;
  covens: Record<string, CovenTrialResult & { sparring?: { role: string; text: string; at: string }[] }>;
  domainCache: Record<string, DomainCacheEntry & { expiresAt: string }>;
  oracleEvents: { events: OracleEvent[]; expiresAt: string } | null;
  watchlists: Record<string, Watchlist>;
  integrations: Record<string, TeleportIntegration>;
  ledger: LedgerEntry[];
}

const FILE = ".boo-data/store.json";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Upgrades rows written before tiered gating (free/apprentice/sorcerer/coven, spellsBalance). */
function normalizeWorkspace(raw: any): Workspace {
  const planTier = normalizeTier(raw.planTier);
  const legacyRemaining =
    typeof raw.spellsBalance === "number"
      ? Math.max(0, PLANS[planTier].monthlyTaskRuns - (raw.spellsUsed ?? 0))
      : undefined;
  const { spellsBalance: _legacy, ...rest } = raw;
  return {
    ...rest,
    planTier,
    maxCompetitorsPerTask: raw.maxCompetitorsPerTask ?? PLANS[planTier].maxCompetitorsPerTask,
    freeTrialConsumed:
      raw.freeTrialConsumed ?? (planTier === "FREE_TRIAL" && (raw.spellsUsed ?? 0) > 0),
    monthlyTaskRunsRemaining:
      raw.monthlyTaskRunsRemaining ?? legacyRemaining ?? PLANS[planTier].monthlyTaskRuns,
  };
}

function normalizeSpell(raw: any, d: FileData): GrimoireSpell {
  return {
    ...raw,
    tierAtExecution: normalizeTier(raw.tierAtExecution ?? d.workspaces[raw.workspaceId]?.planTier),
    quotaState: raw.quotaState ?? "committed",
  };
}
let cache: FileData | null = null;

async function load(): Promise<FileData> {
  if (cache) return cache;
  const fs = await import("node:fs/promises");
  try {
    cache = JSON.parse(await fs.readFile(FILE, "utf8")) as FileData;
  } catch {
    cache = {
      workspaces: {},
      spells: {},
      buyers: {},
      covens: {},
      domainCache: {},
      oracleEvents: null,
      watchlists: {},
      integrations: {},
      ledger: [],
    };
  }
  for (const [id, w] of Object.entries(cache!.workspaces)) cache!.workspaces[id] = normalizeWorkspace(w);
  for (const [id, sp] of Object.entries(cache!.spells)) cache!.spells[id] = normalizeSpell(sp, cache!);
  return cache!;
}

async function persist() {
  const fs = await import("node:fs/promises");
  await fs.mkdir(".boo-data", { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache, null, 2));
}

export const fileDriver: StoreDriver = {
  async getWorkspace(id) {
    const w = (await load()).workspaces[id];
    return w ? { ...w } : null;
  },
  async putWorkspace(w) {
    const d = await load();
    const prev = d.workspaces[w.id];
    d.workspaces[w.id] = prev
      ? {
          ...w,
          planTier: prev.planTier,
          maxCompetitorsPerTask: prev.maxCompetitorsPerTask,
          freeTrialConsumed: prev.freeTrialConsumed,
          monthlyTaskRunsRemaining: prev.monthlyTaskRunsRemaining,
          spellsUsed: prev.spellsUsed,
        }
      : { ...w };
    await persist();
  },
  async applyPlan(workspaceId, tier) {
    const d = await load();
    const w = d.workspaces[workspaceId];
    if (!w) return null;
    const plan = PLANS[tier];
    Object.assign(w, {
      planTier: tier,
      maxCompetitorsPerTask: plan.maxCompetitorsPerTask,
      monthlyTaskRunsRemaining: plan.monthlyTaskRuns,
      elixirCreditsBalance: plan.elixirs,
    });
    await persist();
    return { ...w };
  },

  // Check-and-mutate happens synchronously after load(), so it is atomic within the process.
  async reserveTaskRun(workspaceId, competitorCount) {
    const d = await load();
    const w = d.workspaces[workspaceId];
    if (
      !w ||
      w.monthlyTaskRunsRemaining <= 0 ||
      w.maxCompetitorsPerTask < competitorCount ||
      (w.planTier === "FREE_TRIAL" && w.freeTrialConsumed)
    ) {
      return null;
    }
    w.monthlyTaskRunsRemaining -= 1;
    w.spellsUsed += 1;
    await persist();
    return { ...w };
  },
  async releaseTaskRun(workspaceId) {
    const d = await load();
    const w = d.workspaces[workspaceId];
    if (!w) return;
    w.monthlyTaskRunsRemaining += 1;
    w.spellsUsed = Math.max(0, w.spellsUsed - 1);
    await persist();
  },
  async commitTaskRun(spellId) {
    const d = await load();
    const sp = d.spells[spellId];
    if (!sp || sp.quotaState !== "reserved") return false;
    sp.quotaState = "committed";
    const w = d.workspaces[sp.workspaceId];
    if (w && sp.tierAtExecution === "FREE_TRIAL") w.freeTrialConsumed = true;
    await persist();
    return true;
  },
  async refundTaskRun(spellId, reason) {
    const d = await load();
    const sp = d.spells[spellId];
    if (!sp || sp.quotaState !== "reserved") return false;
    sp.quotaState = "refunded";
    sp.status = "failed";
    sp.error ??= reason;
    const w = d.workspaces[sp.workspaceId];
    if (w) {
      w.monthlyTaskRunsRemaining += 1;
      w.spellsUsed = Math.max(0, w.spellsUsed - 1);
    }
    await persist();
    return true;
  },

  async getSpell(id) {
    return (await load()).spells[id] ?? null;
  },
  async getSpellBySlug(slug) {
    const d = await load();
    return Object.values(d.spells).find((s) => s.publicShareSlug === slug) ?? null;
  },
  async putSpell(s) {
    const d = await load();
    const prev = d.spells[s.id];
    // quota_state is owned by commit/refund; a refunded spell stays failed.
    d.spells[s.id] = prev
      ? {
          ...s,
          quotaState: prev.quotaState,
          status: prev.quotaState === "refunded" ? "failed" : s.status,
        }
      : { ...s };
    await persist();
  },
  async listSpells(workspaceId) {
    const d = await load();
    return Object.values(d.spells)
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async putBuyers(spellId, buyers) {
    const d = await load();
    d.buyers[spellId] ??= {};
    for (const b of buyers) d.buyers[spellId][b.id] = b;
    await persist();
  },
  async listBuyers(spellId) {
    const d = await load();
    return Object.values(d.buyers[spellId] ?? {}).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  },
  async putBuyer(spellId, b) {
    const d = await load();
    d.buyers[spellId] ??= {};
    d.buyers[spellId][b.id] = b;
    await persist();
  },

  async putCoven(spellId, c) {
    const d = await load();
    d.covens[spellId] = { ...c, sparring: d.covens[spellId]?.sparring ?? [] };
    await persist();
  },
  async getSparring(spellId) {
    return (await load()).covens[spellId]?.sparring ?? [];
  },
  async pushSparring(spellId, msg) {
    const d = await load();
    d.covens[spellId] ??= { corpus: { sitesScraped: 0, transcripts: 0, reviews: 0, threads: 0 }, truths: [], orthodoxies: [], debate: [], hypothesis: { wedge: "", positioning: "", icpNarrowing: "", offer: "", momTestQuestions: [] }, sparring: [] };
    d.covens[spellId].sparring!.push(msg);
    await persist();
  },

  async getDomainCache(domain) {
    const d = await load();
    const e = d.domainCache[domain];
    if (!e || e.expiresAt < new Date().toISOString()) return null;
    return e;
  },
  async putDomainCache(domain, data) {
    const d = await load();
    d.domainCache[domain] = {
      ...data,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
    await persist();
  },

  async getOracleEvents() {
    const d = await load();
    if (!d.oracleEvents || d.oracleEvents.expiresAt < new Date().toISOString()) return null;
    return d.oracleEvents.events;
  },
  async putOracleEvents(events) {
    const d = await load();
    d.oracleEvents = {
      events,
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    };
    await persist();
  },

  async listWatchlists(workspaceId) {
    const d = await load();
    return Object.values(d.watchlists)
      .filter((w) => w.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async putWatchlist(w) {
    (await load()).watchlists[w.id] = w;
    await persist();
  },

  async listIntegrations(workspaceId) {
    const d = await load();
    return Object.values(d.integrations).filter((i) => i.workspaceId === workspaceId);
  },
  async putIntegration(i) {
    (await load()).integrations[i.id] = i;
    await persist();
  },

  async addLedger(e) {
    (await load()).ledger.push(e);
    await persist();
  },
  async ledgerFor(workspaceId) {
    const d = await load();
    return d.ledger.filter((l) => l.workspaceId === workspaceId).reverse();
  },
};
