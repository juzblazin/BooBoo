"use client";

import { useMemo, useState } from "react";
import { Download, FileBadge, FlaskConical, Loader2, Zap } from "lucide-react";
import { ToneBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "@/components/teleport-dialog";
import { cn } from "@/lib/cn";
import type { Buyer, GrimoireSpell } from "@/lib/types";

const ROLE_TONE = {
  "Economic Buyer": "amber",
  Champion: "brand",
  "Technical Evaluator": "info",
} as const;

export function BuyersTab({
  spell,
  initialBuyers,
}: {
  spell: GrimoireSpell;
  initialBuyers: Buyer[];
}) {
  const [buyers, setBuyers] = useState(initialBuyers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [brewing, setBrewing] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const verified = useMemo(
    () => buyers.filter((b) => b.emailVerificationStatus === "valid"),
    [buyers],
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => (s.size === verified.length ? new Set() : new Set(verified.map((b) => b.id))));

  const brew = async (buyer: Buyer) => {
    setBrewing((s) => new Set(s).add(buyer.id));
    setNotice(null);
    try {
      const res = await fetch("/api/buyers/brew-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spellId: spell.id, buyerId: buyer.id }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(d.error ?? "Contact failed.");
        return;
      }
      setBuyers((bs) => bs.map((b) => (b.id === buyer.id ? d.buyer : b)));
      if (typeof d.balance === "number") setBalance(d.balance);
      if (!d.ok) setNotice(d.reason ?? "No verified contact — 0 credits spent.");
      else setSelected((s) => new Set(s).add(buyer.id));
    } finally {
      setBrewing((s) => {
        const n = new Set(s);
        n.delete(buyer.id);
        return n;
      });
    }
  };

  const downloadLia = (b: Buyer) => {
    if (!b.gdprLia) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            certificate: "GDPR Article 6(1)(f) Legitimate Interest Assessment",
            contact: { name: b.fullName, title: b.title, company: b.company, email: b.workEmail },
            ...b.gdprLia,
            provenance: { provider: b.winningProvider, domain: b.domain },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lia-${b.fullName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCsv = () => {
    const ids = selected.size ? [...selected].join(",") : verified.map((b) => b.id).join(",");
    window.location.href = `/api/teleport/csv?spellId=${spell.id}&buyerIds=${ids}`;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ToneBadge tone="neutral">{buyers.length} summoned</ToneBadge>
          <ToneBadge tone="emerald">{verified.length} verified</ToneBadge>
          {balance != null && <ToneBadge tone="amber">{balance} credits left</ToneBadge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!verified.length}>
            <Download className="size-3.5" />
            CSV
          </Button>
          <Button variant="brand" size="sm" onClick={() => setExportOpen(true)} disabled={!verified.length}>
            <Zap className="size-3.5" />
            Export {selected.size ? `${selected.size} ` : ""}to Stack
          </Button>
        </div>
      </div>
      {notice && <p className="mt-2 text-xs text-[var(--cauldron)]">{notice}</p>}

      {/* Table */}
      <div className="glass mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  className="accent-[#8b5cf6]"
                  checked={verified.length > 0 && selected.size === verified.length}
                  onChange={toggleAll}
                  aria-label="Select all verified"
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Buyer</th>
              <th className="px-3 py-2.5 font-medium">Committee</th>
              <th className="px-3 py-2.5 font-medium">Trigger</th>
              <th className="px-3 py-2.5 font-medium">Send window</th>
              <th className="px-3 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 text-right font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => {
              const isBrewing = brewing.has(b.id);
              const ok = b.emailVerificationStatus === "valid";
              return (
                <tr key={b.id} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="accent-[#8b5cf6] disabled:opacity-30"
                      checked={selected.has(b.id)}
                      disabled={!ok}
                      onChange={() => toggle(b.id)}
                      aria-label={`Select ${b.fullName}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{b.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.title} · {b.company}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <ToneBadge tone={ROLE_TONE[b.committeeRole]}>{b.committeeRole}</ToneBadge>
                  </td>
                  <td className="max-w-[190px] px-3 py-3">
                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{b.trigger}</span>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-3 text-xs text-[var(--cauldron)]">
                    {b.recommendedSendDate}
                  </td>
                  <td className="px-3 py-3">
                    {ok ? (
                      <div>
                        <div className="num font-mono text-xs text-[var(--contact)]">{b.workEmail}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>via {b.winningProvider}</span>
                          {b.directPhone && <span>· {b.directPhone}</span>}
                          {b.gdprLia && (
                            <button
                              onClick={() => downloadLia(b)}
                              className="inline-flex items-center gap-0.5 text-brand hover:underline"
                            >
                              <FileBadge className="size-3" /> LIA
                            </button>
                          )}
                        </div>
                      </div>
                    ) : b.brewed ? (
                      <ToneBadge tone="crimson">missed — 0 credits</ToneBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground">locked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!b.brewed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => brew(b)}
                        disabled={isBrewing}
                        className="whitespace-nowrap"
                      >
                        {isBrewing ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <FlaskConical className="size-3.5" />
                        )}
                        Enrich contact
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        1 Credit = 1 verified work email. Personal addresses are stripped; misses cost 0.
        Every reveal ships a GDPR Art. 6(1)(f) LIA certificate.
      </p>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        spellId={spell.id}
        buyers={buyers.filter((b) => selected.size === 0 || selected.has(b.id))}
      />
    </div>
  );
}
