import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { startCastJob } from "@/lib/jobs";
import { currentWorkspace, store } from "@/lib/store";
import { titleFromDomain } from "@/lib/rng";
import type { GrimoireSpell, Rival } from "@/lib/types";

/** PRD-02/03 — POST /api/spells/cast
 *  Creates the spell, spends one Spell credit, kicks off the Cauldron job. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const rivals = (body.rivals ?? []) as Rival[];
  const selected = ((body.selectedDomains ?? []) as string[]).slice(0, 8);

  if (!domain || !selected.length) {
    return NextResponse.json({ error: "Pick at least one rival to hex." }, { status: 400 });
  }

  const ws = await currentWorkspace();

  const spell: GrimoireSpell = {
    id: `sp_${randomUUID().slice(0, 12)}`,
    workspaceId: ws.id,
    userDomain: domain,
    companyName: body.companyName ?? titleFromDomain(domain),
    category: body.category ?? "B2B SaaS",
    rivals,
    selectedDomains: selected,
    status: "brewing",
    progress: [],
    hexes: null,
    ads: null,
    oracle: null,
    coven: null,
    personas: null,
    readiness: null,
    totalApiCostMicro: 0,
    publicShareSlug: null,
    createdAt: new Date().toISOString(),
  };

  ws.spellsUsed += 1;
  await Promise.all([store.putSpell(spell), store.putWorkspace(ws)]);
  startCastJob(spell);

  return NextResponse.json({ spellId: spell.id });
}
