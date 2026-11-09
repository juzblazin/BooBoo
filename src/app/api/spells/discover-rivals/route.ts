import { NextRequest, NextResponse } from "next/server";
import { discoverForQuery } from "@/lib/services/rivals";
import { currentWorkspace } from "@/lib/store";

/** PRD-02 — POST /api/spells/discover-rivals
 *  { query } — accepts a domain, an existing domain, or a free-text idea. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? body.user_domain ?? "").trim();
  if (query.length < 3) {
    return NextResponse.json(
      { error: "Give Boo a domain or a short description of the business." },
      { status: 400 },
    );
  }
  await currentWorkspace(); // ensure workspace row exists
  const result = await discoverForQuery(query);
  return NextResponse.json({ input: query, ...result });
}
