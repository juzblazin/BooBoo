import { NextRequest, NextResponse } from "next/server";
import { currentWorkspace, PLAN_LIMITS, store } from "@/lib/store";
import type { Workspace } from "@/lib/types";

/** PRD-11 — POST /api/checkout { plan } — Stripe Checkout when configured;
 *  without a key it applies the plan in demo mode so the flow still works. */
export async function POST(req: NextRequest) {
  const { plan } = await req.json().catch(() => ({}));
  const tier = String(plan) as Workspace["planTier"];
  if (!PLAN_LIMITS[tier]) {
    return NextResponse.json({ error: "unknown plan" }, { status: 400 });
  }

  const priceEnv =
    tier === "apprentice"
      ? process.env.STRIPE_PRICE_APPRENTICE
      : tier === "sorcerer"
        ? process.env.STRIPE_PRICE_SORCERER
        : process.env.STRIPE_PRICE_COVEN;

  if (process.env.STRIPE_SECRET_KEY && priceEnv) {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": priceEnv,
        "line_items[0][quantity]": "1",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/grimoire?upgraded=${tier}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`,
      }),
    });
    const session = (await res.json()) as { url?: string };
    if (session.url) return NextResponse.json({ url: session.url });
  }

  // Demo checkout — apply the plan immediately.
  const ws = await currentWorkspace();
  ws.planTier = tier;
  ws.spellsBalance = PLAN_LIMITS[tier].spellsPerMonth;
  ws.spellsUsed = 0;
  ws.elixirCreditsBalance = PLAN_LIMITS[tier].elixirs;
  await store.putWorkspace(ws);
  return NextResponse.json({ url: "/grimoire?upgraded=" + tier, demo: true });
}
