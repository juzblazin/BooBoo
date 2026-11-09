"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { PlatformChip, ToneBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import type { AdCreative, AdPlatform } from "@/lib/types";

const PLATFORM_FILTERS: (AdPlatform | "all")[] = ["all", "meta", "linkedin", "google", "tiktok"];
const HOOK_LABEL: Record<string, string> = {
  "fear-of-missing-out": "FOMO",
  "social-proof": "Social proof",
  "cost-savings": "Cost savings",
  "time-savings": "Time savings",
  contrarian: "Contrarian",
  offer: "Offer",
};

export function DarkArtsTab({ ads }: { ads: AdCreative[] }) {
  const [platform, setPlatform] = useState<AdPlatform | "all">("all");
  const [open, setOpen] = useState<AdCreative | null>(null);

  const filtered = ads.filter((a) => platform === "all" || a.platform === platform);
  const evergreenCount = filtered.filter((a) => a.evergreen).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {PLATFORM_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "h-7 rounded-full px-3 text-[13px] font-medium capitalize transition-colors",
                platform === p
                  ? "bg-brand/15 text-brand"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "all" ? "All platforms" : p}
            </button>
          ))}
        </div>
        <ToneBadge tone="emerald">
          <Flame className="size-3" />
          {evergreenCount} Evergreen Winners
        </ToneBadge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ad) => (
          <article key={ad.id} className="glass flex flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <PlatformChip platform={ad.platform} />
              {ad.evergreen ? (
                <ToneBadge tone="emerald">Evergreen · {ad.survivalDays}d</ToneBadge>
              ) : (
                <ToneBadge tone="neutral">{ad.survivalDays}d live</ToneBadge>
              )}
            </div>
            <h3 className="mt-3 text-[14px] font-semibold leading-snug tracking-tight">
              {ad.headline}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {ad.body}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ToneBadge tone="dark">{HOOK_LABEL[ad.hookCategory]}</ToneBadge>
                <span className="num">~${ad.modeledSpendUsd.toLocaleString()}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpen(ad)}>
                Steal & Counter
              </Button>
            </div>
            <div className="num mt-2 text-[10px] text-muted-foreground/70">
              {ad.competitor} · {ad.startDate} → {ad.lastSeenDate}
            </div>
          </article>
        ))}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {open && (
            <>
              <SheetHeader className="border-b border-border/60 pb-4">
                <SheetTitle className="text-base">Steal & Counter</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 p-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Their control creative
                  </div>
                  <p className="mt-2 text-[13px] font-medium">{open.headline}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{open.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <PlatformChip platform={open.platform} />
                    <ToneBadge tone={open.evergreen ? "emerald" : "neutral"}>
                      {open.survivalDays} days survival
                    </ToneBadge>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Counter angle
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed">{open.stealAndCounter.angle}</p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Why it matters
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {open.stealAndCounter.counterHook}
                  </p>
                </div>
                <div className="rounded-lg border border-brand/25 bg-brand/8 p-3.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                    Your counter-script
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed">{open.stealAndCounter.script}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
