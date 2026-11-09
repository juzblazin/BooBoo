import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { currentWorkspace, store } from "@/lib/store";

/** PRD-10 — white-label share link: POST /api/spells/[id]/share → /g/[slug]. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const spell = await store.getSpell(id);
  if (!spell) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ws = await currentWorkspace();
  if (spell.workspaceId !== ws.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!spell.publicShareSlug) {
    spell.publicShareSlug = randomBytes(6).toString("base64url");
    await store.putSpell(spell);
  }
  return NextResponse.json({ slug: spell.publicShareSlug, url: `/g/${spell.publicShareSlug}` });
}
