import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  jsonb,
  timestamp,
  customType,
  pgEnum,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { PLAN_TIERS } from "../lib/plans";

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
});

/** PRD-01 — 9 production tables (+ elixir_ledger for the credit ledger). */

export const planTierEnum = pgEnum("plan_tier_enum", PLAN_TIERS);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().default("My Workspace"),
    planTier: planTierEnum("plan_tier").notNull().default("FREE_TRIAL"),
    maxCompetitorsPerTask: integer("max_competitors_per_task").notNull().default(1),
    freeTrialConsumed: boolean("free_trial_consumed").notNull().default(false),
    monthlyTaskRunsRemaining: integer("monthly_task_runs_remaining").notNull().default(1),
    spellsUsed: integer("spells_used").notNull().default(0),
    elixirCreditsBalance: integer("elixir_credits_balance").notNull().default(5),
    parentAgencyWorkspaceId: text("parent_agency_workspace_id"),
    whitelabelJson: jsonb("whitelabel_json"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("ws_max_competitors_chk", sql`${t.maxCompetitorsPerTask} BETWEEN 1 AND 5`),
    check("ws_runs_nonneg_chk", sql`${t.monthlyTaskRunsRemaining} >= 0`),
  ],
);

export const domainIntelligenceCache = pgTable(
  "domain_intelligence_cache",
  {
    id: text("id").primaryKey(),
    domain: text("domain").notNull(),
    country: text("country").notNull().default("US"),
    autoDiscoveredRivals: jsonb("auto_discovered_rivals"),
    similarwebMetricsJson: jsonb("similarweb_metrics_json"),
    seoAndAeoJson: jsonb("seo_and_aeo_json"),
    technographicsJson: jsonb("technographics_json"),
    reviewComplaintsJson: jsonb("review_complaints_json"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("dic_domain_country_idx").on(t.domain, t.country)],
);

export const competitorAdVault = pgTable(
  "competitor_ad_vault",
  {
    id: text("id").primaryKey(),
    competitorDomain: text("competitor_domain").notNull(),
    platform: text("platform").notNull(),
    headline: text("headline"),
    body: text("body"),
    cta: text("cta"),
    startDate: text("start_date"),
    lastSeenDate: text("last_seen_date"),
    survivalDays: integer("survival_days"),
    modeledSpendUsd: integer("modeled_spend_usd"),
    hookCategory: text("hook_category"),
    creativeJson: jsonb("creative_json"),
    hookEmbedding: vector1536("hook_embedding"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cav_competitor_idx").on(t.competitorDomain)],
);

export const oracleTemporalEvents = pgTable(
  "oracle_temporal_events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    eventDate: text("event_date").notNull(),
    payloadJson: jsonb("payload_json"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("ote_date_idx").on(t.eventDate)],
);

export const grimoireSpells = pgTable(
  "grimoire_spells",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userDomain: text("user_domain").notNull(),
    companyName: text("company_name"),
    category: text("category"),
    rivalsJson: jsonb("rivals_json"),
    selectedDomains: jsonb("selected_domains"),
    competitorCount: integer("competitor_count").generatedAlwaysAs(
      sql`jsonb_array_length(selected_domains)`,
    ),
    tierAtExecution: planTierEnum("tier_at_execution").notNull(),
    quotaState: text("quota_state").notNull().default("reserved"),
    status: text("status").notNull().default("brewing"),
    progressJson: jsonb("progress_json"),
    hexesAndGapsJson: jsonb("hexes_and_gaps_json"),
    darkArtsJson: jsonb("dark_arts_json"),
    oracleTimelineJson: jsonb("oracle_timeline_json"),
    icpPersonasJson: jsonb("icp_personas_json"),
    readinessScorecardJson: jsonb("readiness_scorecard_json"),
    covenTrialJson: jsonb("coven_trial_json"),
    publicShareSlug: text("public_share_slug"),
    totalApiCostMicro: bigint("total_api_cost_micro", { mode: "number" }).notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gs_workspace_idx").on(t.workspaceId),
    uniqueIndex("gs_share_slug_idx").on(t.publicShareSlug),
  ],
);

export const covenTrials = pgTable(
  "coven_trials",
  {
    id: text("id").primaryKey(),
    spellId: text("spell_id")
      .notNull()
      .references(() => grimoireSpells.id),
    corpusCountsJson: jsonb("corpus_counts_json"),
    unspokenMarketTruthsJson: jsonb("unspoken_market_truths_json"),
    industryOrthodoxiesJson: jsonb("industry_orthodoxies_json"),
    vcSteelmanAndTeardownJson: jsonb("vc_steelman_and_teardown_json"),
    survivingGtmHypothesisJson: jsonb("surviving_gtm_hypothesis_json"),
    sparringChatHistory: jsonb("sparring_chat_history").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("ct_spell_idx").on(t.spellId)],
);

export const summonedBuyers = pgTable(
  "summoned_buyers",
  {
    id: text("id").primaryKey(),
    spellId: text("spell_id")
      .notNull()
      .references(() => grimoireSpells.id),
    workspaceId: text("workspace_id").notNull(),
    dedupeHash: text("dedupe_hash").notNull(),
    fullName: text("full_name").notNull(),
    title: text("title"),
    company: text("company"),
    domain: text("domain"),
    seniority: text("seniority"),
    committeeRole: text("committee_role"),
    trigger: text("trigger"),
    competitorHexHook: text("competitor_hex_hook"),
    oracleTimelineHook: text("oracle_timeline_hook"),
    momTestValidationQuestion: text("mom_test_validation_question"),
    recommendedSendDate: text("recommended_send_date"),
    workEmail: text("work_email"),
    emailVerificationStatus: text("email_verification_status").notNull().default("pending"),
    directPhone: text("direct_phone"),
    phoneCarrierStatus: text("phone_carrier_status"),
    winningProvider: text("winning_provider"),
    gdprLiaRationale: jsonb("gdpr_lia_rationale"),
    brewed: boolean("brewed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sb_spell_idx").on(t.spellId),
    uniqueIndex("sb_dedupe_idx").on(t.spellId, t.dedupeHash),
  ],
);

export const rivalWatchlists = pgTable(
  "rival_watchlists",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    domain: text("domain").notNull(),
    alertChannel: text("alert_channel").notNull().default("email"),
    alertTarget: text("alert_target"),
    pricingHash: text("pricing_hash"),
    seenAdIds: jsonb("seen_ad_ids"),
    lastSignals: jsonb("last_signals"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rw_workspace_idx").on(t.workspaceId)],
);

export const teleportIntegrations = pgTable(
  "teleport_integrations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    provider: text("provider").notNull(), // hubspot | salesforce | smartlead | instantly | webhook
    oauthTokensEncrypted: text("oauth_tokens_encrypted"),
    fieldMappingsJson: jsonb("field_mappings_json"),
    webhookUrl: text("webhook_url"),
    status: text("status").notNull().default("disconnected"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("ti_ws_provider_idx").on(t.workspaceId, t.provider)],
);

export const elixirLedger = pgTable(
  "elixir_ledger",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    refId: text("ref_id"),
    tregCostMicro: bigint("treg_cost_micro", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("el_workspace_idx").on(t.workspaceId)],
);
