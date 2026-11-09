/**
 * PRD-09 — Hex Watchlist cron worker.
 *
 * Deployed as a Cloudflare Cron Trigger (daily 06:00 UTC). For local dev the
 * same logic runs via PATCH /api/watchlists — this file is the standalone
 * worker entry for `wrangler deploy`.
 *
 * wrangler.toml:
 *   [triggers]
 *   crons = ["0 6 * * *"]
 */

interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

// Minimal Cloudflare types (install @cloudflare/workers-types for the full set).
type ScheduledEvent = { cron: string };
type ExecutionContext = { waitUntil(p: Promise<unknown>): void };

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      fetch(`${env.APP_URL}/api/watchlists`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then((r) => r.json()),
    );
  },
};
