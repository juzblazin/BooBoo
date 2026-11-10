import { NextRequest, NextResponse } from "next/server";
import { createGtmTask } from "@/lib/services/gtm_tasks";

/** PRD-02/03 — POST /api/spells/cast
 *  Gates on the workspace tier, reserves one task run, kicks off the Cauldron job. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await createGtmTask({
    userDomain: body.domain,
    competitorDomains: body.selectedDomains,
    rivals: body.rivals,
    companyName: body.companyName,
    category: body.category,
  });
  if (!result.ok) return NextResponse.json(result.body, { status: result.status });
  return NextResponse.json({ spellId: result.spell.id });
}
