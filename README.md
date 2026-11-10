# Boo — Autonomous B2B Strategic Intelligence & GTM Brain

Enter a URL → Boo summons your rivals → casts a spell that brews a 6-tab
Grimoire: competitor weaknesses, winning ads, a 90-day cultural calendar, an
adversarial VC teardown, ICP personas + readiness gates, and verified buyers
ready to teleport into your stack.

Wickedly smart B2B strategy. Zero cold-email spam — Boo never sends a message.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The app works end-to-end out of the box: with `DATABASE_URL` set it persists
to Neon Postgres; without it, a `.boo-data/` JSON store kicks in. External
intelligence gateways (`TREG_API_KEY`, `AISA_API_KEY`, `RAPIDAPI_KEY`) are
called when keys exist and fall back to deterministic per-domain demo
intelligence otherwise — see `src/lib/gateways/` and `src/lib/services/`.

## The flow

| Step | Route | What happens |
|---|---|---|
| Summon Rivals | `POST /api/spells/discover-rivals` | <4s rival discovery (KV/DB cache → AIsa similar-sites + Treg lookalikes → dedupe & classify) |
| Cast a Spell | `POST /api/spells/cast` → `/cast/[id]` | tier gate (see below) reserves 1 run, starts the pipeline, SSE "Cauldron" stream on `/api/spells/[id]/events` |
| Analyze (API) | `POST /api/v1/gtm/analyze` | `{ user_domain, competitor_domains[] }` → `202 { task_id, tier_at_execution, … }` — same gate as Cast |
| The Grimoire | `/spells/[id]` | 6 tabs: Hexes & Blind Spots · Dark Arts Gallery · Oracle's Hourglass · Coven Trial · ICP & Readiness · Summoned Buyers |
| Brew a Potion | `POST /api/buyers/brew-potion` | cost-capped waterfall ($0.05 email / $0.30 dial) → verification gate → 1 Elixir only on `valid` + GDPR LIA cert |
| Teleport | `POST /api/teleport/push` · `GET /api/teleport/csv` | HubSpot, Salesforce, Smartlead, Instantly, signed webhook, or CSV |
| Share | `POST /api/spells/[id]/share` → `/g/[slug]` | public read-only white-label Grimoire |
| Watchlists | `POST/GET/PATCH /api/watchlists` | daily rival diff-detection (pricing, new ads, 1-star reviews) — `workers/hex_watchlist_cron.ts` on Cloudflare |

## Stack

Next.js 15 (App Router, React 19) · Tailwind v4 "Arcane Dark Mode" · Base UI
primitives · Recharts · Neon Serverless Postgres 18 + pgvector (Drizzle ORM,
10 tables in `src/db/schema.ts`) · pay-as-you-go gateways via `src/lib/gateways/`.

Workspace identity is an anonymous `boo_ws` cookie → `workspaces` row
(swap-in point for Neon Auth / Managed Better Auth).

## Plans & competitor gating

Plans live in `src/lib/plans.ts`: **Free Trial** (1 competitor, 1 run),
**Premium** (≤3 competitors), **Scale** (≤5 competitors). Every analysis goes
through `createGtmTask` (`src/lib/services/gtm_tasks.ts`) before any gateway
is called:

- `competitor_domains.length > workspaces.max_competitors_per_task` → **402**
  with `{ code: "COMPETITOR_LIMIT_EXCEEDED", requiredTier, upgradeUrl }`;
  more than 5 → **403** (`ABOVE_MAX_PLAN`). Used free trial → 402
  `FREE_TRIAL_CONSUMED`; no runs left → 402 `TASK_RUNS_EXHAUSTED`.
- A run is reserved atomically (`reserveTaskRun`), committed on completion
  (`commitTaskRun` flips `free_trial_consumed` for Free Trial runs) and
  refunded if the worker fails (`refundTaskRun`). Runs stuck in `brewing` for
  10+ minutes are reaped and refunded on the next request.
- Entitlement columns are never written by `putWorkspace`; only `applyPlan`
  (checkout) and the reserve/commit/refund methods change them.

## Schema → Neon

`drizzle.config.ts` + `npm run db:push` (needs `ws` for drizzle-kit's
serverless driver) or apply `drizzle/0000_*.sql` via the Neon MCP/console.
Databases created before plan tiers: run
`src/db/migrations/0001_plan_tiers.sql` once (maps free → FREE_TRIAL,
apprentice/sorcerer → PREMIUM, coven → SCALE).
pgvector is enabled; `competitor_ad_vault.hook_embedding` is `vector(1536)`.
