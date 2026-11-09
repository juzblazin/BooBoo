import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { brewPotion } from "@/lib/services/buyer_summoner";
import { rngFor } from "@/lib/rng";
import { currentWorkspace, store } from "@/lib/store";

/** PRD-08 — POST /api/buyers/brew-potion { spellId, buyerId }
 *  Runs the waterfall + verification gate; spends 1 Elixir only on `valid`. */
export async function POST(req: NextRequest) {
  const { spellId, buyerId } = await req.json().catch(() => ({}));
  if (!spellId || !buyerId) {
    return NextResponse.json({ error: "spellId and buyerId required" }, { status: 400 });
  }

  const [ws, buyers] = await Promise.all([currentWorkspace(), store.listBuyers(spellId)]);
  const buyer = buyers.find((b) => b.id === buyerId);
  if (!buyer) return NextResponse.json({ error: "buyer not found" }, { status: 404 });
  if (buyer.brewed) return NextResponse.json({ ok: true, buyer, elixirsSpent: 0, already: true });
  if (ws.elixirCreditsBalance <= 0) {
    return NextResponse.json(
      { error: "No Elixir Credits left — top up or upgrade.", code: "NO_ELIXIRS" },
      { status: 402 },
    );
  }

  const result = await brewPotion(buyer, rngFor(`brew:${buyerId}`));
  const updated = result.buyer!;

  if (result.elixirsSpent > 0) {
    ws.elixirCreditsBalance -= result.elixirsSpent;
    await Promise.all([
      store.putWorkspace(ws),
      store.addLedger({
        id: `el_${randomUUID().slice(0, 10)}`,
        workspaceId: ws.id,
        delta: -1,
        reason: `Brewed ${buyer.fullName} (${buyer.company})`,
        refId: buyerId,
        tregCostMicro: result.costMicro,
        createdAt: new Date().toISOString(),
      }),
    ]);
  }

  await store.putBuyer(spellId, updated);
  return NextResponse.json({ ...result, buyer: updated, balance: ws.elixirCreditsBalance });
}
