"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DomainMark, ToneBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GrimoireSpell, HexReport } from "@/lib/types";

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
}

const SEV_TONE = { high: "crimson", medium: "amber", low: "neutral" } as const;

export function HexesTab({ hexes, spell }: { hexes: HexReport[]; spell: GrimoireSpell }) {
  const [active, setActive] = useState(0);
  const h = hexes[active];
  if (!h) return <Empty />;

  const maxChannel = Math.max(...h.channels.map((c) => c.share));
  const maxAeo = Math.max(...h.aeo.map((a) => a.citationShare), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Rival rail */}
      <div className="flex gap-2 overflow-x-auto lg:flex-col">
        {hexes.map((hex, i) => (
          <button
            key={hex.domain}
            onClick={() => setActive(i)}
            className={cn(
              "glass flex min-w-[180px] items-center gap-2.5 p-3 text-left transition-shadow duration-150",
              i === active && "shadow-[0_0_0_0.5px_var(--brand),0_1px_2px_0_rgb(0_0_0/.5)]",
            )}
          >
            <DomainMark domain={hex.domain} size={28} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">{hex.domain}</span>
              <span className="num text-[11px] text-muted-foreground">
                {fmt(hex.monthlyVisits)}/mo
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {/* Headline metrics */}
        <div className="glass grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
          <Metric
            label="Monthly visits"
            value={fmt(h.monthlyVisits)}
            delta={h.visitsChangePct}
          />
          <Metric label="Bounce rate" value={`${h.bounceRate}%`} />
          <Metric label="Pages / visit" value={h.pagesPerVisit.toFixed(1)} />
          <Metric label="Est. PPC spend" value={`$${fmt(h.ppcSpendUsd)}/mo`} />
        </div>

        {/* Vulnerabilities */}
        <section>
          <h3 className="text-[15px] font-semibold tracking-tight">Blind spots</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {h.vulnerabilities.map((v) => (
              <div key={v.label} className="glass p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{v.label}</span>
                  <ToneBadge tone={SEV_TONE[v.severity]}>{v.severity}</ToneBadge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{v.detail}</p>
                {v.metric && (
                  <span className="num mt-2 inline-block text-[11px] font-medium text-[var(--cauldron)]">
                    {v.metric}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Traffic sparkline + channels */}
          <section className="glass p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">24-month traffic</h3>
            <Sparkline points={h.trend.map((t) => t.visits)} />
            <div className="mt-4 flex flex-col gap-2">
              {h.channels.map((c) => (
                <div key={c.channel} className="flex items-center gap-2">
                  <span className="w-24 truncate text-xs text-muted-foreground">{c.channel}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(c.share / maxChannel) * 100}%` }}
                    />
                  </div>
                  <span className="num w-9 text-right text-[11px] text-muted-foreground">
                    {Math.round(c.share * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AEO + tech stack */}
          <section className="glass p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">
              AI answer-engine share <span className="text-xs font-normal text-muted-foreground">(AEO)</span>
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {h.aeo.map((a) => (
                <div key={a.engine} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">{a.engine}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        a.citationShare >= 30 ? "bg-[var(--hex)]" : "bg-[var(--cauldron)]",
                      )}
                      style={{ width: `${(a.citationShare / maxAeo) * 100}%` }}
                    />
                  </div>
                  <span className="num w-9 text-right text-[11px] text-muted-foreground">
                    {a.citationShare}%
                  </span>
                  {a.trend === "up" ? (
                    <TrendingUp className="size-3 text-[var(--hex)]" />
                  ) : a.trend === "down" ? (
                    <TrendingDown className="size-3 text-[var(--contact)]" />
                  ) : (
                    <span className="size-3" />
                  )}
                </div>
              ))}
            </div>
            <h4 className="mt-6 text-[13px] font-medium">Installed stack</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {h.techStack.map((t) => (
                <ToneBadge key={t.name} tone="dark">
                  {t.name}
                </ToneBadge>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Keyword gaps */}
          <section className="glass overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-[15px] font-semibold tracking-tight">Keyword gaps they own</h3>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-y border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Keyword</th>
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Vol</th>
                  <th className="px-5 py-2 font-medium">Intent</th>
                </tr>
              </thead>
              <tbody>
                {h.keywordGaps.map((k) => (
                  <tr key={k.keyword} className="border-b border-border/40 last:border-0">
                    <td className="max-w-[180px] truncate px-5 py-2.5">{k.keyword}</td>
                    <td className="num px-3 py-2.5">#{k.rivalRank}</td>
                    <td className="num px-3 py-2.5 text-muted-foreground">{fmt(k.volume)}</td>
                    <td className="px-5 py-2.5">
                      <ToneBadge tone={k.intent === "transactional" ? "emerald" : k.intent === "commercial" ? "amber" : "neutral"}>
                        {k.intent}
                      </ToneBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Review complaints */}
          <section className="glass p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Recurring complaints</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Clustered 1–3 star complaints — your counter-positioning ammunition.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {h.complaints.map((c) => (
                <div key={c.theme} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <ToneBadge tone="crimson">{c.source}</ToneBadge>
                    <span className="num text-[11px] text-muted-foreground">{c.count} mentions</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">“{c.sample}”</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div>
      <div className="num flex items-baseline gap-1.5 text-xl font-semibold tracking-tight">
        {value}
        {delta != null && (
          <span className={cn("text-xs font-medium", delta >= 0 ? "text-[var(--contact)]" : "text-[var(--hex)]")}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 320;
  const hgt = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = hgt - ((p - min) / Math.max(1, max - min)) * (hgt - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${hgt}`} className="mt-4 h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="1.8" />
      <path d={`${path} L${w},${hgt} L0,${hgt} Z`} fill="color-mix(in srgb, var(--brand) 14%, transparent)" stroke="none" />
    </svg>
  );
}

function Empty() {
  return (
    <div className="glass flex flex-col items-center p-12 text-center">
      <p className="text-[15px] font-medium">No hexes on record</p>
      <p className="mt-1 text-[13px] text-muted-foreground">The analysis is still brewing.</p>
    </div>
  );
}
