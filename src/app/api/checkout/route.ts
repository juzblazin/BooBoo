import { NextRequest, NextResponse } from "next/server";
import { normalizeTier } from "@/lib/plans";
import { currentWorkspace, store } from "@/lib/store";

/** PRD-11 — POST /api/checkout { plan } — Stripe Checkout when configured;
 *  without a key it applies the plan in demo mode so the flow still works. */
export async function POST(req: NextRequest) {
  const { plan } = await req.json().catch(() => ({}));
  const tier = normalizeTier(plan);
  if (tier === "FREE_TRIAL") {
    return NextResponse.json({ error: "unknown plan" }, { status: 400 });
  }

  const priceEnv = tier === "PREMIUM" ? process.env.STRIPE_PRICE_PREMIUM : process.env.STRIPE_PRICE_SCALE;

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
  await store.applyPlan(ws.id, tier);
  return NextResponse.json({ url: "/grimoire?upgraded=" + tier, demo: true });
}
