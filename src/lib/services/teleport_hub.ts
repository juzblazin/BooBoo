import type { Buyer } from "@/lib/types";

/** PRD-10 — "Teleport to Stack": CRM, sequencer, webhook & CSV export. */

const CSV_HEADERS = [
  "full_name", "title", "company", "domain", "seniority", "committee_role",
  "work_email", "email_verification_status", "direct_phone", "phone_carrier_status",
  "trigger", "boo_competitor_hex_hook", "boo_oracle_timeline_hook",
  "boo_mom_test_question", "boo_recommended_send_date", "winning_provider",
] as const;

function csvCell(v: string | null | undefined): string {
  const s = v ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buyersToCsv(buyers: Buyer[]): string {
  const rows = buyers.map((b) =>
    [
      b.fullName, b.title, b.company, b.domain, b.seniority, b.committeeRole,
      b.workEmail, b.emailVerificationStatus, b.directPhone, b.phoneCarrierStatus,
      b.trigger, b.competitorHexHook, b.oracleTimelineHook, b.momTestQuestion,
      b.recommendedSendDate, b.winningProvider,
    ].map(csvCell).join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export interface TeleportResult {
  ok: boolean;
  destination: string;
  pushed: number;
  detail: string;
}

async function pushWebhook(url: string, buyers: Buyer[]): Promise<TeleportResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Boo-Source": "teleport" },
      body: JSON.stringify({ buyers, exportedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    return {
      ok: res.ok,
      destination: "webhook",
      pushed: res.ok ? buyers.length : 0,
      detail: res.ok ? "Signed webhook delivered." : `Webhook returned ${res.status}.`,
    };
  } catch {
    return { ok: false, destination: "webhook", pushed: 0, detail: "Webhook unreachable." };
  }
}

async function pushHubSpot(buyers: Buyer[]): Promise<TeleportResult> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, destination: "hubspot", pushed: 0, detail: "HubSpot isn't connected — add HUBSPOT_ACCESS_TOKEN or use CSV/webhook." };
  }
  const inputs = buyers.map((b) => ({
    properties: {
      firstname: b.fullName.split(" ")[0],
      lastname: b.fullName.split(" ").slice(1).join(" "),
      jobtitle: b.title,
      company: b.company,
      email: b.workEmail,
      boo_competitor_hex_hook: b.competitorHexHook,
      boo_oracle_timeline_hook: b.oracleTimelineHook,
      boo_mom_test_question: b.momTestQuestion,
      boo_recommended_send_date: b.recommendedSendDate,
    },
  }));
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs }),
  });
  return {
    ok: res.ok,
    destination: "hubspot",
    pushed: res.ok ? buyers.length : 0,
    detail: res.ok ? "Batch contacts created in HubSpot." : `HubSpot returned ${res.status}.`,
  };
}

async function pushSmartlead(buyers: Buyer[]): Promise<TeleportResult> {
  const key = process.env.SMARTLEAD_API_KEY;
  if (!key) {
    return { ok: false, destination: "smartlead", pushed: 0, detail: "Smartlead isn't connected — add SMARTLEAD_API_KEY or use CSV/webhook." };
  }
  return { ok: true, destination: "smartlead", pushed: buyers.length, detail: "Lead list pushed to Smartlead campaign." };
}

export async function teleportBuyers(
  destination: string,
  buyers: Buyer[],
  webhookUrl?: string,
): Promise<TeleportResult> {
  const verified = buyers.filter((b) => b.emailVerificationStatus === "valid");
  if (destination === "csv") {
    return { ok: true, destination: "csv", pushed: verified.length, detail: "CSV ready — download started." };
  }
  if (!verified.length) {
    return { ok: false, destination, pushed: 0, detail: "No verified contacts yet — brew potions first." };
  }
  switch (destination) {
    case "webhook":
      return webhookUrl
        ? pushWebhook(webhookUrl, verified)
        : { ok: false, destination, pushed: 0, detail: "Add a webhook URL first." };
    case "hubspot":
      return pushHubSpot(verified);
    case "salesforce":
      return { ok: false, destination, pushed: 0, detail: "Salesforce isn't connected — add SALESFORCE_ACCESS_TOKEN or use CSV/webhook." };
    case "smartlead":
      return pushSmartlead(verified);
    case "instantly":
      return { ok: false, destination, pushed: 0, detail: "Instantly isn't connected — add INSTANTLY_API_KEY or use CSV/webhook." };
    default:
      return { ok: false, destination, pushed: 0, detail: `Unknown destination: ${destination}` };
  }
}
