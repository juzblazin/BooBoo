import { NextRequest, NextResponse } from "next/server";
import { rngFor } from "@/lib/rng";
import { store } from "@/lib/store";

/** PRD-06 — spar with The Inquisitor against the indexed corpus. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { message } = await req.json().catch(() => ({}));
  const spell = await store.getSpell(id);
  if (!spell?.coven) return NextResponse.json({ error: "no trial" }, { status: 404 });

  const rng = rngFor(`spar:${id}:${String(message).length}:${Date.now() % 97}`);
  const coven = spell.coven;
  const truth = rng.pick(coven.truths);
  const orthodoxy = rng.pick(coven.orthodoxies);
  const complaint = spell.hexes?.[0]?.complaints[0];

  const replies = [
    `Pushback, founder: you're assuming ${orthodoxy.belief.toLowerCase()} still holds — the corpus says otherwise. ${orthodoxy.whyFalse} If your thesis needs that belief to be true, it's already dead.`,
    `Steel-manning the other side for a moment: ${truth.truth} — and the corpus backs it: ${truth.evidence.slice(0, 140)}… Your move: is your wedge structural or just a story?`,
    complaint
      ? `The reviews disagree with your optimism. '${complaint.theme}' — ${complaint.count} clustered complaints on ${complaint.source}. What in your model survives if that's the market's real opinion?`
      : `Weak claim. In the corpus, ${orthodoxy.unservedPain.toLowerCase()} — convince me your motion answers that without adding headcount.`,
    `Trial question: if the incumbent copied your surface feature tomorrow, what remains? In this corpus, ${truth.truth.toLowerCase()} — that's the bar for a moat.`,
  ];

  const at = new Date().toISOString();
  await store.pushSparring(id, { role: "founder", text: String(message ?? ""), at });
  const reply = rng.pick(replies);
  await store.pushSparring(id, { role: "inquisitor", text: reply, at: new Date().toISOString() });

  return NextResponse.json({ reply });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ history: await store.getSparring(id) });
}
