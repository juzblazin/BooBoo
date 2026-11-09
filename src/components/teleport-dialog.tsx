"use client";

import { useState } from "react";
import { Check, Download, Loader2, Webhook, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Buyer } from "@/lib/types";

const DESTINATIONS = [
  { id: "hubspot", name: "HubSpot", note: "CRM v3 batch sync + Boo hook fields" },
  { id: "salesforce", name: "Salesforce", note: "Lead objects via REST API" },
  { id: "smartlead", name: "Smartlead", note: "1-click push into a campaign" },
  { id: "instantly", name: "Instantly", note: "API v2 lead list" },
  { id: "webhook", name: "Webhook", note: "Signed POST — Clay, Make, Zapier, n8n" },
  { id: "csv", name: "CSV", note: "UTF-8 export with Boo hook columns" },
] as const;

export function ExportDialog({
  open,
  onClose,
  spellId,
  buyers,
}: {
  open: boolean;
  onClose: () => void;
  spellId: string;
  buyers: Buyer[];
}) {
  const [dest, setDest] = useState<string>("csv");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; detail: string } | null>(null);

  const verified = buyers.filter((b) => b.emailVerificationStatus === "valid");

  const push = async () => {
    setBusy(true);
    setResult(null);
    if (dest === "csv") {
      const ids = verified.map((b) => b.id).join(",");
      window.location.href = `/api/teleport/csv?spellId=${spellId}&buyerIds=${ids}`;
      setResult({ ok: true, detail: "CSV download started." });
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/teleport/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spellId,
          destination: dest,
          buyerIds: verified.map((b) => b.id),
          webhookUrl: dest === "webhook" ? webhookUrl : undefined,
        }),
      });
      const d = await res.json();
      setResult({ ok: d.ok, detail: d.detail });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-brand" />
            Export to Stack
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Push {verified.length} verified buyers + their hex hooks and send
            windows. Boo never sends a single email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setDest(d.id);
                setResult(null);
              }}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border/60 px-3.5 py-2.5 text-left transition-colors",
                dest === d.id ? "border-brand/60 bg-brand/10" : "hover:bg-muted/50",
              )}
            >
              <span>
                <span className="text-[13px] font-medium">{d.name}</span>
                <span className="block text-[11px] text-muted-foreground">{d.note}</span>
              </span>
              {dest === d.id && <Check className="size-4 text-brand" />}
            </button>
          ))}
        </div>

        {dest === "webhook" && (
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/…"
            className="mt-1 font-mono text-xs"
          />
        )}

        {result && (
          <p className={cn("text-[13px]", result.ok ? "text-[var(--contact)]" : "text-[var(--cauldron)]")}>
            {result.detail}
          </p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="brand" size="sm" onClick={push} disabled={busy || !verified.length || (dest === "webhook" && !webhookUrl)}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : dest === "csv" ? <Download className="size-3.5" /> : <Webhook className="size-3.5" />}
            {dest === "csv" ? "Download CSV" : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
