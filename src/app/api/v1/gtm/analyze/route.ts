import { NextRequest, NextResponse } from "next/server";
import { createGtmTask } from "@/lib/services/gtm_tasks";

/** POST /api/v1/gtm/analyze
 *  { user_domain, competitor_domains[], company_name?, category? }
 *  402 when the plan's competitor limit / free trial / monthly runs block the
 *  task, 403 above the 5-competitor ceiling — both before any ingestion runs. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = await createGtmTask({
    userDomain: body.user_domain,
    competitorDomains: body.competitor_domains,
    companyName: body.company_name,
    category: body.category,
  });
  if (!result.ok) return NextResponse.json(result.body, { status: result.status });

  const { spell } = result;
  return NextResponse.json(
    {
      task_id: spell.id,
      status: spell.status,
      user_domain: spell.userDomain,
      competitor_domains: spell.selectedDomains,
      competitor_count: spell.selectedDomains.length,
      tier_at_execution: spell.tierAtExecution,
      events_url: `/api/spells/${spell.id}/events`,
      report_url: `/spells/${spell.id}`,
    },
    { status: 202 },
  );
}
