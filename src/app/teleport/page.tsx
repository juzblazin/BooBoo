import { Cable, Download, Webhook, Zap } from "lucide-react";
import { ToneBadge } from "@/components/ui";
import { currentWorkspace, store } from "@/lib/store";

export const metadata = { title: "Export to Stack" };
export const dynamic = "force-dynamic";

const PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    env: "HUBSPOT_ACCESS_TOKEN",
    note: "Batch contact sync with boo_competitor_hex_hook, boo_oracle_timeline_hook, boo_mom_test_question and boo_recommended_send_date properties.",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    env: "SALESFORCE_ACCESS_TOKEN",
    note: "Lead objects via REST API sobjects/Lead.",
  },
  {
    id: "smartlead",
    name: "Smartlead",
    env: "SMARTLEAD_API_KEY",
    note: "1-click push into an existing campaign's lead list.",
  },
  {
    id: "instantly",
    name: "Instantly",
    env: "INSTANTLY_API_KEY",
    note: "API v2 lead lists with custom variables per buyer.",
  },
];

export default async function ExportPage() {
  const ws = await currentWorkspace();
  const integrations = await store.listIntegrations(ws.id);
  const webhook = integrations.find((i) => i.provider === "webhook");

  return (
    <div className="container-page py-10">
      <div className="max-w-xl">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Zap className="size-5 text-brand" />
          Export to Stack
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Boo never sends a single message — it hands verified buyers, hex hooks
          and send windows to the tools that already do.
        </p>
      </div>

      <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const connected = Boolean(process.env[p.env]) || integrations.some((i) => i.provider === p.id && i.status === "connected");
          return (
            <div key={p.id} className="glass p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cable className="size-4 text-muted-foreground" />
                  <span className="text-[15px] font-semibold tracking-tight">{p.name}</span>
                </div>
                <ToneBadge tone={connected ? "emerald" : "neutral"}>
                  {connected ? "connected" : "not connected"}
                </ToneBadge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
                set {p.env} in .env.local
              </p>
            </div>
          );
        })}

        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="size-4 text-muted-foreground" />
              <span className="text-[15px] font-semibold tracking-tight">Universal Webhook</span>
            </div>
            <ToneBadge tone={webhook?.status === "connected" ? "emerald" : "neutral"}>
              {webhook?.status === "connected" ? "connected" : "always on"}
            </ToneBadge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Signed HTTP POST for Clay, Make, Zapier and n8n — set the URL inside
            the Export dialog on any report.
          </p>
          {webhook?.webhookUrl && (
            <p className="num mt-3 truncate font-mono text-[11px] text-muted-foreground/70">
              {webhook.webhookUrl}
            </p>
          )}
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="size-4 text-muted-foreground" />
              <span className="text-[15px] font-semibold tracking-tight">CSV / Excel</span>
            </div>
            <ToneBadge tone="emerald">always on</ToneBadge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            UTF-8 export with all Boo hook columns — works offline, everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
