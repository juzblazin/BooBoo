import { NextRequest, NextResponse } from "next/server";
import { teleportBuyers } from "@/lib/services/teleport_hub";
import { store } from "@/lib/store";

/** PRD-10 — POST /api/teleport/push { spellId, destination, buyerIds?, webhookUrl? } */
export async function POST(req: NextRequest) {
  const { spellId, destination, buyerIds, webhookUrl } = await req.json().catch(() => ({}));
  if (!spellId || !destination) {
    return NextResponse.json({ error: "spellId and destination required" }, { status: 400 });
  }
  const all = await store.listBuyers(spellId);
  const buyers = Array.isArray(buyerIds) && buyerIds.length
    ? all.filter((b) => buyerIds.includes(b.id))
    : all;

  if (destination === "webhook" && webhookUrl) {
    const spell = await store.getSpell(spellId);
    if (spell) {
      await store.putIntegration({
        id: `ti_${spell.workspaceId}_webhook`,
        workspaceId: spell.workspaceId,
        provider: "webhook",
        status: "connected",
        webhookUrl,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const result = await teleportBuyers(destination, buyers, webhookUrl);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
