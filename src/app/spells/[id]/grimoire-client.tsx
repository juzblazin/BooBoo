"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainMark, ScoreBadge, ToneBadge } from "@/components/ui";
import { Salem } from "@/components/salem";
import { HexesTab } from "@/components/grimoire/hexes-tab";
import { DarkArtsTab } from "@/components/grimoire/dark-arts-tab";
import { OracleTab } from "@/components/grimoire/oracle-tab";
import { CovenTab } from "@/components/grimoire/coven-tab";
import { ReadinessTab } from "@/components/grimoire/readiness-tab";
import { BuyersTab } from "@/components/grimoire/buyers-tab";
import type { Buyer, GrimoireSpell } from "@/lib/types";

const TABS = [
  { value: "hexes", label: "Competitor Gaps" },
  { value: "dark-arts", label: "Ad Intelligence" },
  { value: "oracle", label: "Timing & Trends" },
  { value: "coven", label: "GTM Strategy" },
  { value: "readiness", label: "Readiness Check" },
  { value: "buyers", label: "Leads & Export" },
];

export function GrimoireClient({ spell, buyers }: { spell: GrimoireSpell; buyers: Buyer[] }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(
    spell.publicShareSlug ? `/g/${spell.publicShareSlug}` : null,
  );
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (spell.status === "brewing") router.replace(`/cast/${spell.id}`);
  }, [spell.status, spell.id, router]);

  if (spell.status === "brewing") return null;

  const share = async () => {
    setSharing(true);
    const res = await fetch(`/api/spells/${spell.id}/share`, { method: "POST" });
    const d = await res.json();
    if (d.url) {
      setShareUrl(d.url);
      try {
        await navigator.clipboard.writeText(window.location.origin + d.url);
      } catch {}
    }
    setSharing(false);
  };

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <DomainMark domain={spell.userDomain} size={44} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">{spell.companyName}</h1>
              <ToneBadge tone="brand">report</ToneBadge>
              {spell.readiness && (
                <span className="num text-xs text-muted-foreground">
                  readiness {spell.readiness.total}/100
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {spell.userDomain} · analyzed {spell.selectedDomains.join(", ")} ·{" "}
              {(spell.totalApiCostMicro / 1_000_000).toFixed(2)} USD gateway cost
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {spell.readiness && <ScoreBadge score={spell.readiness.total} size={40} />}
          <button
            onClick={share}
            disabled={sharing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-card px-3 text-[13px] font-medium text-foreground shadow-[var(--shadow-button)] transition-all duration-150 hover:bg-muted active:scale-[0.97] disabled:opacity-50"
          >
            <Share2 className="size-3.5" />
            {shareUrl ? "Link copied" : "Share report"}
          </button>
        </div>
      </div>

      {spell.status === "failed" ? (
        <div className="glass mt-16 flex flex-col items-center p-12 text-center">
          <Salem state="idle" size={80} />
          <p className="mt-4 text-[15px] font-medium">This analysis failed</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{spell.error ?? "Unknown error"}</p>
        </div>
      ) : (
        <Tabs defaultValue="hexes" orientation="horizontal" className="mt-6 flex-col">
          <TabsList variant="line" className="hide-scrollbar w-full justify-start gap-1 overflow-x-auto border-b border-border pb-px">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-b-none border-b-2 border-transparent px-3 py-1.5 text-[13px] data-active:border-brand data-active:text-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="hexes" className="pt-6">
            <HexesTab hexes={spell.hexes ?? []} spell={spell} />
          </TabsContent>
          <TabsContent value="dark-arts" className="pt-6">
            <DarkArtsTab ads={spell.ads ?? []} />
          </TabsContent>
          <TabsContent value="oracle" className="pt-6">
            <OracleTab oracle={spell.oracle} />
          </TabsContent>
          <TabsContent value="coven" className="pt-6">
            <CovenTab coven={spell.coven} spellId={spell.id} />
          </TabsContent>
          <TabsContent value="readiness" className="pt-6">
            <ReadinessTab
              personas={spell.personas ?? []}
              readiness={spell.readiness}
            />
          </TabsContent>
          <TabsContent value="buyers" className="pt-6">
            <BuyersTab spell={spell} initialBuyers={buyers} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
