import { and, desc, eq, gt, gte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
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

/* eslint-disable @typescript-eslint/no-explicit-any */

function spellFromRow(r: any): GrimoireSpell {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    userDomain: r.userDomain,
    companyName: r.companyName ?? "",
    category: r.category ?? "B2B SaaS",
    rivals: (r.rivalsJson as any) ?? [],
    selectedDomains: (r.selectedDomains as any) ?? [],
    tierAtExecution: normalizeTier(r.tierAtExecution),
    quotaState: r.quotaState ?? "committed",
    status: r.status,
    progress: (r.progressJson as any) ?? [],
    hexes: (r.hexesAndGapsJson as any) ?? null,
    ads: (r.darkArtsJson as any) ?? null,
    oracle: (r.oracleTimelineJson as any) ?? null,
    coven: (r.covenTrialJson as any) ?? null,
    personas: (r.icpPersonasJson as any) ?? null,
    readiness: (r.readinessScorecardJson as any) ?? null,
    totalApiCostMicro: r.totalApiCostMicro ?? 0,
    publicShareSlug: r.publicShareSlug ?? null,
    error: r.error ?? null,
    createdAt: new Date(r.createdAt).toISOString(),
  };
}

function buyerFromRow(r: any): Buyer {
  return {
    id: r.id,
    fullName: r.fullName,
    title: r.title,
    company: r.company,
    domain: r.domain,
    seniority: r.seniority,
    committeeRole: r.committeeRole,
    trigger: r.trigger,
    competitorHexHook: r.competitorHexHook,
    oracleTimelineHook: r.oracleTimelineHook,
    momTestQuestion: r.momTestValidationQuestion,
    recommendedSendDate: r.recommendedSendDate,
    workEmail: r.workEmail,
    emailVerificationStatus: r.emailVerificationStatus,
    directPhone: r.directPhone,
    phoneCarrierStatus: r.phoneCarrierStatus,
    winningProvider: r.winningProvider,
    gdprLia: (r.gdprLiaRationale as any) ?? null,
    brewed: r.brewed,
  };
}

function workspaceFromRow(r: any): Workspace {
  return {
    id: r.id,
    name: r.name,
    planTier: normalizeTier(r.planTier),
    maxCompetitorsPerTask: r.maxCompetitorsPerTask,
    freeTrialConsumed: r.freeTrialConsumed,
    monthlyTaskRunsRemaining: r.monthlyTaskRunsRemaining,
    spellsUsed: r.spellsUsed,
    elixirCreditsBalance: r.elixirCreditsBalance,
    parentAgencyWorkspaceId: r.parentAgencyWorkspaceId,
    whitelabel: (r.whitelabelJson as any) ?? null,
    createdAt: new Date(r.createdAt).toISOString(),
  };
}

export const neonDriver: StoreDriver = {
  async getWorkspace(id) {
    const rows = await db!.select().from(s.workspaces).where(eq(s.workspaces.id, id)).limit(1);
    return rows[0] ? workspaceFromRow(rows[0]) : null;
  },

  async putWorkspace(w) {
    await db!
      .insert(s.workspaces)
      .values({
        id: w.id,
        name: w.name,
        planTier: w.planTier,
        maxCompetitorsPerTask: w.maxCompetitorsPerTask,
        freeTrialConsumed: w.freeTrialConsumed,
        monthlyTaskRunsRemaining: w.monthlyTaskRunsRemaining,
        spellsUsed: w.spellsUsed,
        elixirCreditsBalance: w.elixirCreditsBalance,
        parentAgencyWorkspaceId: w.parentAgencyWorkspaceId,
        whitelabelJson: w.whitelabel as any,
      })
      .onConflictDoUpdate({
        target: s.workspaces.id,
        set: {
          name: w.name,
          elixirCreditsBalance: w.elixirCreditsBalance,
          whitelabelJson: w.whitelabel as any,
        },
      });
  },

  async applyPlan(workspaceId, tier) {
    const plan = PLANS[tier];
    const rows = await db!
      .update(s.workspaces)
      .set({
        planTier: tier,
        maxCompetitorsPerTask: plan.maxCompetitorsPerTask,
        monthlyTaskRunsRemaining: plan.monthlyTaskRuns,
        elixirCreditsBalance: plan.elixirs,
      })
      .where(eq(s.workspaces.id, workspaceId))
      .returning();
    return rows[0] ? workspaceFromRow(rows[0]) : null;
  },

  async reserveTaskRun(workspaceId, competitorCount) {
    const w = s.workspaces;
    const rows = await db!
      .update(w)
      .set({
        monthlyTaskRunsRemaining: sql`${w.monthlyTaskRunsRemaining} - 1`,
        spellsUsed: sql`${w.spellsUsed} + 1`,
      })
      .where(
        and(
          eq(w.id, workspaceId),
          gt(w.monthlyTaskRunsRemaining, 0),
          gte(w.maxCompetitorsPerTask, competitorCount),
          or(ne(w.planTier, "FREE_TRIAL"), eq(w.freeTrialConsumed, false)),
        ),
      )
      .returning();
    return rows[0] ? workspaceFromRow(rows[0]) : null;
  },

  async releaseTaskRun(workspaceId) {
    const w = s.workspaces;
    await db!
      .update(w)
      .set({
        monthlyTaskRunsRemaining: sql`${w.monthlyTaskRunsRemaining} + 1`,
        spellsUsed: sql`GREATEST(${w.spellsUsed} - 1, 0)`,
      })
      .where(eq(w.id, workspaceId));
  },

  async commitTaskRun(spellId) {
    const res = await db!.execute(sql`
      WITH sp AS (
        UPDATE grimoire_spells SET quota_state = 'committed', updated_at = now()
        WHERE id = ${spellId} AND quota_state = 'reserved'
        RETURNING workspace_id, tier_at_execution
      ), ws AS (
        UPDATE workspaces SET free_trial_consumed = true
        FROM sp WHERE workspaces.id = sp.workspace_id AND sp.tier_at_execution = 'FREE_TRIAL'
      )
      SELECT count(*)::int AS n FROM sp`);
    return Number((res.rows[0] as any)?.n ?? 0) > 0;
  },

  async refundTaskRun(spellId, reason) {
    const res = await db!.execute(sql`
      WITH sp AS (
        UPDATE grimoire_spells
        SET quota_state = 'refunded', status = 'failed',
            error = COALESCE(error, ${reason}), updated_at = now()
        WHERE id = ${spellId} AND quota_state = 'reserved'
        RETURNING workspace_id
      ), ws AS (
        UPDATE workspaces
        SET monthly_task_runs_remaining = monthly_task_runs_remaining + 1,
            spells_used = GREATEST(spells_used - 1, 0)
        FROM sp WHERE workspaces.id = sp.workspace_id
      )
      SELECT count(*)::int AS n FROM sp`);
    return Number((res.rows[0] as any)?.n ?? 0) > 0;
  },

  async getSpell(id) {
    const rows = await db!.select().from(s.grimoireSpells).where(eq(s.grimoireSpells.id, id)).limit(1);
    return rows[0] ? spellFromRow(rows[0]) : null;
  },

  async getSpellBySlug(slug) {
    const rows = await db!
      .select()
      .from(s.grimoireSpells)
      .where(eq(s.grimoireSpells.publicShareSlug, slug))
      .limit(1);
    return rows[0] ? spellFromRow(rows[0]) : null;
  },

  async putSpell(sp) {
    await db!
      .insert(s.grimoireSpells)
      .values({
        id: sp.id,
        workspaceId: sp.workspaceId,
        userDomain: sp.userDomain,
        companyName: sp.companyName,
        category: sp.category,
        rivalsJson: sp.rivals as any,
        selectedDomains: sp.selectedDomains as any,
        tierAtExecution: sp.tierAtExecution,
        quotaState: sp.quotaState,
        status: sp.status,
        progressJson: sp.progress as any,
        hexesAndGapsJson: sp.hexes as any,
        darkArtsJson: sp.ads as any,
        oracleTimelineJson: sp.oracle as any,
        icpPersonasJson: sp.personas as any,
        readinessScorecardJson: sp.readiness as any,
        covenTrialJson: sp.coven as any,
        publicShareSlug: sp.publicShareSlug,
        totalApiCostMicro: sp.totalApiCostMicro,
        error: sp.error,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: s.grimoireSpells.id,
        set: {
          companyName: sp.companyName,
          category: sp.category,
          rivalsJson: sp.rivals as any,
          selectedDomains: sp.selectedDomains as any,
          // quota_state is owned by commit/refund; a refunded spell stays failed.
          status: sql`CASE WHEN ${s.grimoireSpells.quotaState} = 'refunded' THEN 'failed' ELSE ${sp.status} END`,
          progressJson: sp.progress as any,
          hexesAndGapsJson: sp.hexes as any,
          darkArtsJson: sp.ads as any,
          oracleTimelineJson: sp.oracle as any,
          icpPersonasJson: sp.personas as any,
          readinessScorecardJson: sp.readiness as any,
          covenTrialJson: sp.coven as any,
          publicShareSlug: sp.publicShareSlug,
          totalApiCostMicro: sp.totalApiCostMicro,
          error: sp.error,
          updatedAt: new Date(),
        },
      });
  },

  async listSpells(workspaceId) {
    const rows = await db!
      .select()
      .from(s.grimoireSpells)
      .where(eq(s.grimoireSpells.workspaceId, workspaceId))
      .orderBy(desc(s.grimoireSpells.createdAt));
    return rows.map(spellFromRow);
  },

  async putBuyers(spellId, buyers) {
    if (!buyers.length) return;
    await db!
      .insert(s.summonedBuyers)
      .values(
        buyers.map((b) => ({
          id: b.id,
          spellId,
          workspaceId: "",
          dedupeHash: `${b.fullName}|${b.company}`.toLowerCase(),
          fullName: b.fullName,
          title: b.title,
          company: b.company,
          domain: b.domain,
          seniority: b.seniority,
          committeeRole: b.committeeRole,
          trigger: b.trigger,
          competitorHexHook: b.competitorHexHook,
          oracleTimelineHook: b.oracleTimelineHook,
          momTestValidationQuestion: b.momTestQuestion,
          recommendedSendDate: b.recommendedSendDate,
          workEmail: b.workEmail,
          emailVerificationStatus: b.emailVerificationStatus,
          directPhone: b.directPhone,
          phoneCarrierStatus: b.phoneCarrierStatus,
          winningProvider: b.winningProvider,
          gdprLiaRationale: b.gdprLia as any,
          brewed: b.brewed,
        })),
      )
      .onConflictDoNothing();
    // backfill workspace_id on the rows just inserted
    const sp = await this.getSpell(spellId);
    if (sp) {
      await db!
        .update(s.summonedBuyers)
        .set({ workspaceId: sp.workspaceId })
        .where(eq(s.summonedBuyers.spellId, spellId));
    }
  },

  async listBuyers(spellId) {
    const rows = await db!
      .select()
      .from(s.summonedBuyers)
      .where(eq(s.summonedBuyers.spellId, spellId))
      .orderBy(s.summonedBuyers.fullName);
    return rows.map(buyerFromRow);
  },

  async putBuyer(spellId, b) {
    await db!
      .update(s.summonedBuyers)
      .set({
        workEmail: b.workEmail,
        emailVerificationStatus: b.emailVerificationStatus,
        directPhone: b.directPhone,
        phoneCarrierStatus: b.phoneCarrierStatus,
        winningProvider: b.winningProvider,
        gdprLiaRationale: b.gdprLia as any,
        brewed: b.brewed,
      })
      .where(eq(s.summonedBuyers.id, b.id));
  },

  async putCoven(spellId, c) {
    await db!
      .insert(s.covenTrials)
      .values({
        id: `ct_${spellId}`,
        spellId,
        corpusCountsJson: c.corpus as any,
        unspokenMarketTruthsJson: c.truths as any,
        industryOrthodoxiesJson: c.orthodoxies as any,
        vcSteelmanAndTeardownJson: c.debate as any,
        survivingGtmHypothesisJson: c.hypothesis as any,
        sparringChatHistory: [] as any,
      })
      .onConflictDoUpdate({
        target: s.covenTrials.spellId,
        set: {
          corpusCountsJson: c.corpus as any,
          unspokenMarketTruthsJson: c.truths as any,
          industryOrthodoxiesJson: c.orthodoxies as any,
          vcSteelmanAndTeardownJson: c.debate as any,
          survivingGtmHypothesisJson: c.hypothesis as any,
        },
      });
  },

  async getSparring(spellId) {
    const rows = await db!
      .select({ h: s.covenTrials.sparringChatHistory })
      .from(s.covenTrials)
      .where(eq(s.covenTrials.spellId, spellId))
      .limit(1);
    return (rows[0]?.h as any) ?? [];
  },

  async pushSparring(spellId, msg) {
    const rows = await db!
      .select({ h: s.covenTrials.sparringChatHistory })
      .from(s.covenTrials)
      .where(eq(s.covenTrials.spellId, spellId))
      .limit(1);
    const hist = ((rows[0]?.h as any) ?? []) as any[];
    hist.push(msg);
    await db!
      .insert(s.covenTrials)
      .values({ id: `ct_${spellId}`, spellId, sparringChatHistory: hist as any })
      .onConflictDoUpdate({
        target: s.covenTrials.spellId,
        set: { sparringChatHistory: hist as any },
      });
  },

  async getDomainCache(domain) {
    const rows = await db!
      .select()
      .from(s.domainIntelligenceCache)
      .where(eq(s.domainIntelligenceCache.domain, domain))
      .limit(1);
    const r = rows[0] as any;
    if (!r) return null;
    if (new Date(r.expiresAt) < new Date()) return null;
    return {
      rivals: (r.autoDiscoveredRivals as any) ?? undefined,
      hex: (r.similarwebMetricsJson as any) ?? undefined,
      fetchedAt: new Date(r.fetchedAt).toISOString(),
    };
  },

  async putDomainCache(domain, data) {
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await db!
      .insert(s.domainIntelligenceCache)
      .values({
        id: `dic_${domain}`,
        domain,
        autoDiscoveredRivals: (data.rivals as any) ?? null,
        similarwebMetricsJson: (data.hex as any) ?? null,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [s.domainIntelligenceCache.domain, s.domainIntelligenceCache.country],
        set: {
          autoDiscoveredRivals: (data.rivals as any) ?? null,
          similarwebMetricsJson: (data.hex as any) ?? null,
          fetchedAt: new Date(),
          expiresAt: expires,
        },
      });
  },

  async getOracleEvents() {
    const rows = await db!
      .select()
      .from(s.oracleTemporalEvents)
      .where(eq(s.oracleTemporalEvents.id, "global"));
    const r = rows[0] as any;
    if (!r || new Date(r.expiresAt) < new Date()) return null;
    return (r.payloadJson as any) ?? null;
  },

  async putOracleEvents(events) {
    const expires = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    await db!
      .insert(s.oracleTemporalEvents)
      .values({
        id: "global",
        title: "global-cache",
        category: "trend",
        eventDate: new Date().toISOString().slice(0, 10),
        payloadJson: events as any,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: s.oracleTemporalEvents.id,
        set: { payloadJson: events as any, fetchedAt: new Date(), expiresAt: expires },
      });
  },

  async listWatchlists(workspaceId) {
    const rows = await db!
      .select()
      .from(s.rivalWatchlists)
      .where(eq(s.rivalWatchlists.workspaceId, workspaceId))
      .orderBy(desc(s.rivalWatchlists.createdAt));
    return rows.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      domain: r.domain,
      alertChannel: r.alertChannel,
      alertTarget: r.alertTarget,
      lastCheckedAt: r.lastCheckedAt ? new Date(r.lastCheckedAt).toISOString() : null,
      lastSignals: (r.lastSignals as any) ?? [],
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },

  async putWatchlist(w) {
    await db!
      .insert(s.rivalWatchlists)
      .values({
        id: w.id,
        workspaceId: w.workspaceId,
        domain: w.domain,
        alertChannel: w.alertChannel,
        alertTarget: w.alertTarget,
        lastSignals: w.lastSignals as any,
        lastCheckedAt: w.lastCheckedAt ? new Date(w.lastCheckedAt) : null,
      })
      .onConflictDoUpdate({
        target: s.rivalWatchlists.id,
        set: {
          alertChannel: w.alertChannel,
          alertTarget: w.alertTarget,
          lastSignals: w.lastSignals as any,
          lastCheckedAt: w.lastCheckedAt ? new Date(w.lastCheckedAt) : null,
        },
      });
  },

  async listIntegrations(workspaceId) {
    const rows = await db!
      .select()
      .from(s.teleportIntegrations)
      .where(eq(s.teleportIntegrations.workspaceId, workspaceId));
    return rows.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      provider: r.provider,
      status: r.status,
      webhookUrl: r.webhookUrl,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },

  async putIntegration(i) {
    await db!
      .insert(s.teleportIntegrations)
      .values({
        id: i.id,
        workspaceId: i.workspaceId,
        provider: i.provider,
        webhookUrl: i.webhookUrl,
        status: i.status,
      })
      .onConflictDoUpdate({
        target: [s.teleportIntegrations.workspaceId, s.teleportIntegrations.provider],
        set: { webhookUrl: i.webhookUrl, status: i.status },
      });
  },

  async addLedger(e) {
    await db!.insert(s.elixirLedger).values({
      id: e.id,
      workspaceId: e.workspaceId,
      delta: e.delta,
      reason: e.reason,
      refId: e.refId ?? null,
      tregCostMicro: e.tregCostMicro ?? null,
    });
  },

  async ledgerFor(workspaceId) {
    const rows = await db!
      .select()
      .from(s.elixirLedger)
      .where(eq(s.elixirLedger.workspaceId, workspaceId))
      .orderBy(desc(s.elixirLedger.createdAt));
    return rows.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      delta: r.delta,
      reason: r.reason,
      refId: r.refId,
      tregCostMicro: r.tregCostMicro,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },
};
