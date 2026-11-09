import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rngFor } from "@/lib/rng";
import { currentWorkspace, store } from "@/lib/store";
import type { Watchlist } from "@/lib/types";

export async function GET() {
  const ws = await currentWorkspace();
  return NextResponse.json({ watchlists: await store.listWatchlists(ws.id) });
}

/** PRD-09 — POST /api/watchlists { domain, alertChannel, alertTarget }
 *  Registers a rival for the daily 06:00 UTC hex-watchlist cron. */
export async function POST(req: NextRequest) {
  const { domain, alertChannel, alertTarget } = await req.json().catch(() => ({}));
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });
  const ws = await currentWorkspace();
  const w: Watchlist = {
    id: `wl_${randomUUID().slice(0, 8)}`,
    workspaceId: ws.id,
    domain: String(domain).toLowerCase(),
    alertChannel: alertChannel === "slack" ? "slack" : "email",
    alertTarget: String(alertTarget ?? ""),
    lastCheckedAt: null,
    lastSignals: [],
    createdAt: new Date().toISOString(),
  };
  await store.putWatchlist(w);
  return NextResponse.json({ watchlist: w });
}

/** Dev stand-in for the Cloudflare Cron Trigger (PRD-09, workers/hex_watchlist_cron.ts):
 *  GET /api/watchlists?run=check runs the diff-detection pass for every watched domain. */
export async function PATCH(req: NextRequest) {
  const ws = await currentWorkspace();
  const lists = await store.listWatchlists(ws.id);
  const now = new Date().toISOString();
  const fired: { domain: string; signals: string[] }[] = [];

  for (const w of lists) {
    const rng = rngFor(`watch:${w.domain}:${now.slice(0, 10)}`);
    const signals: Watchlist["lastSignals"] = [];
    if (rng.chance(0.4))
      signals.push({ kind: "pricing", summary: `Pricing page DOM diff detected on ${w.domain} — new tier likely shipping`, at: now });
    if (rng.chance(0.5))
      signals.push({ kind: "ads", summary: `${rng.int(1, 4)} new ad creatives launched on ${rng.pick(["Meta", "LinkedIn", "TikTok"])}`, at: now });
    if (rng.chance(0.35))
      signals.push({ kind: "reviews", summary: `${rng.int(1, 3)} new 1-star reviews on Trustpilot`, at: now });
    w.lastSignals = [...signals, ...w.lastSignals].slice(0, 20);
    w.lastCheckedAt = now;
    await store.putWatchlist(w);
    if (signals.length) fired.push({ domain: w.domain, signals: signals.map((s) => s.summary) });
  }
  return NextResponse.json({ checked: lists.length, fired });
}
