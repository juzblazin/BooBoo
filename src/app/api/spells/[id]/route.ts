import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const spell = await store.getSpell(id);
  if (!spell) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(spell);
}
