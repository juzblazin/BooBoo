import { NextRequest } from "next/server";
import { buyersToCsv } from "@/lib/services/teleport_hub";
import { store } from "@/lib/store";

/** PRD-10 — GET /api/teleport/csv?spellId=…&buyerIds=a,b,c — UTF-8 CSV export. */
export async function GET(req: NextRequest) {
  const spellId = req.nextUrl.searchParams.get("spellId") ?? "";
  const ids = (req.nextUrl.searchParams.get("buyerIds") ?? "").split(",").filter(Boolean);
  const all = await store.listBuyers(spellId);
  const buyers = (ids.length ? all.filter((b) => ids.includes(b.id)) : all).filter(
    (b) => b.emailVerificationStatus === "valid",
  );
  const csv = buyersToCsv(buyers);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="boo-teleport-${spellId}.csv"`,
    },
  });
}
