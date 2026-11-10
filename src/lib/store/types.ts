import type {
  Buyer,
  CovenTrialResult,
  GrimoireSpell,
  OracleEvent,
  Rival,
  Watchlist,
  Workspace,
} from "@/lib/types";
import type { PlanTier } from "@/lib/plans";

export interface DomainCacheEntry {
  rivals?: Rival[];
  hex?: unknown;
  fetchedAt: string;
}

export interface LedgerEntry {
  id: string;
  workspaceId: string;
  delta: number;
  reason: string;
  refId?: string | null;
  tregCostMicro?: number | null;
  createdAt: string;
}

export interface TeleportIntegration {
  id: string;
  workspaceId: string;
  provider: string;
  status: "connected" | "disconnected";
  webhookUrl: string | null;
  createdAt: string;
}

export interface StoreDriver {
  getWorkspace(id: string): Promise<Workspace | null>;
  /** Upserts profile/credit fields. Entitlement fields (plan tier, competitor
   *  limit, trial flag, runs remaining) are only written on insert — change
   *  them through applyPlan / reserveTaskRun / commitTaskRun / refundTaskRun. */
  putWorkspace(w: Workspace): Promise<void>;
  applyPlan(workspaceId: string, tier: PlanTier): Promise<Workspace | null>;

  /** Atomically decrements runs remaining iff the workspace may run a task with
   *  `competitorCount` competitors. Returns the updated workspace, or null. */
  reserveTaskRun(workspaceId: string, competitorCount: number): Promise<Workspace | null>;
  /** Returns a reserved run that never got a spell row. */
  releaseTaskRun(workspaceId: string): Promise<void>;
  /** reserved → committed; flips free_trial_consumed when tier was FREE_TRIAL. */
  commitTaskRun(spellId: string): Promise<boolean>;
  /** reserved → refunded (status failed) and gives the run back. Idempotent. */
  refundTaskRun(spellId: string, reason: string): Promise<boolean>;

  getSpell(id: string): Promise<GrimoireSpell | null>;
  getSpellBySlug(slug: string): Promise<GrimoireSpell | null>;
  putSpell(s: GrimoireSpell): Promise<void>;
  listSpells(workspaceId: string): Promise<GrimoireSpell[]>;

  putBuyers(spellId: string, buyers: Buyer[]): Promise<void>;
  listBuyers(spellId: string): Promise<Buyer[]>;
  putBuyer(spellId: string, b: Buyer): Promise<void>;

  putCoven(spellId: string, c: CovenTrialResult): Promise<void>;
  getSparring(spellId: string): Promise<{ role: string; text: string; at: string }[]>;
  pushSparring(spellId: string, msg: { role: string; text: string; at: string }): Promise<void>;

  getDomainCache(domain: string): Promise<DomainCacheEntry | null>;
  putDomainCache(domain: string, data: DomainCacheEntry): Promise<void>;

  getOracleEvents(): Promise<OracleEvent[] | null>;
  putOracleEvents(events: OracleEvent[]): Promise<void>;

  listWatchlists(workspaceId: string): Promise<Watchlist[]>;
  putWatchlist(w: Watchlist): Promise<void>;

  listIntegrations(workspaceId: string): Promise<TeleportIntegration[]>;
  putIntegration(i: TeleportIntegration): Promise<void>;

  addLedger(e: LedgerEntry): Promise<void>;
  ledgerFor(workspaceId: string): Promise<LedgerEntry[]>;
}
