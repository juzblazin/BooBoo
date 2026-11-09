"use client";

import { useState } from "react";
import { Loader2, Play, Plus } from "lucide-react";
import { DomainMark, ToneBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Watchlist } from "@/lib/types";

const KIND_TONE = { pricing: "amber", ads: "brand", reviews: "crimson" } as const;

export function WatchlistClient({ initial }: { initial: Watchlist[] }) {
  const [lists, setLists] = useState(initial);
  const [domain, setDomain] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setBusy(true);
    const res = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, alertChannel: "email", alertTarget: target }),
    });
    const d = await res.json();
    if (d.watchlist) setLists((l) => [d.watchlist, ...l]);
    setDomain("");
    setTarget("");
    setBusy(false);
  };

  const runCheck = async () => {
    setChecking(true);
    const res = await fetch("/api/watchlists", { method: "PATCH" });
    const d = await res.json();
    setReport(
      d.fired?.length
        ? `${d.checked} domains checked — ${d.fired.length} fired signals`
        : `${d.checked ?? 0} domains checked — quiet night`,
    );
    const again = await fetch("/api/watchlists").then((r) => r.json());
    setLists(again.watchlists ?? []);
    setChecking(false);
  };

  return (
    <div className="mt-8 max-w-2xl">
      <form onSubmit={add} className="glass flex items-center gap-2 p-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="rival-domain.com"
          className="border-0 bg-transparent font-mono text-[13px] shadow-none focus-visible:ring-0"
        />
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="alerts@you.com or Slack webhook"
          className="hidden border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0 sm:block"
        />
        <Button variant="brand" size="sm" disabled={busy || !domain.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Watch
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2.5">
        {lists.length === 0 && (
          <div className="glass p-8 text-center text-[13px] text-muted-foreground">
            No rivals under watch yet — add a domain above.
          </div>
        )}
        {lists.map((w) => (
          <div key={w.id} className="glass p-4">
            <div className="flex items-center gap-3">
              <DomainMark domain={w.domain} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{w.domain}</div>
                <div className="text-[11px] text-muted-foreground">
                  {w.alertChannel} → {w.alertTarget || "workspace email"} ·{" "}
                  {w.lastCheckedAt ? `checked ${new Date(w.lastCheckedAt).toLocaleDateString()}` : "queued for tonight"}
                </div>
              </div>
              <ToneBadge tone="neutral">{w.lastSignals.length} signals</ToneBadge>
            </div>
            {w.lastSignals.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3">
                {w.lastSignals.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ToneBadge tone={KIND_TONE[s.kind as keyof typeof KIND_TONE] ?? "neutral"}>{s.kind}</ToneBadge>
                    <span className="truncate">{s.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={runCheck} disabled={checking || !lists.length}>
          {checking ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          Run the cron pass now
        </Button>
        {report && <span className="text-xs text-muted-foreground">{report}</span>}
      </div>
    </div>
  );
}
