"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Clapperboard, Landmark, Trophy, TrendingUp, Users } from "lucide-react";
import { ScoreBadge, ToneBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { OracleCategory, OracleTimeline } from "@/lib/types";

const CAT_META: Record<OracleCategory, { icon: typeof Trophy; label: string; tone: string }> = {
  conference: { icon: Users, label: "Conference", tone: "text-brand" },
  trend: { icon: TrendingUp, label: "Viral trend", tone: "text-[var(--contact)]" },
  macro: { icon: Landmark, label: "Macro", tone: "text-muted-foreground" },
  holiday: { icon: CalendarDays, label: "Seasonal", tone: "text-[var(--cauldron)]" },
  sports: { icon: Trophy, label: "Sports", tone: "text-[var(--cauldron)]" },
  movie: { icon: Clapperboard, label: "Movie", tone: "text-[#ff7aa5]" },
};

const WAVE_TONE = ["emerald", "amber", "brand"] as const;

export function OracleTab({ oracle }: { oracle: OracleTimeline | null }) {
  if (!oracle) return null;
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 90 * 86_400_000);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Seasonality */}
        <section className="glass p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] font-semibold tracking-tight">Category seasonality index</h3>
            <span className="text-[11px] text-muted-foreground">24-month Similarweb series · 1.00 = mean</span>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={oracle.seasonality} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="seas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(139 92 246 / 0.08)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0.6, 1.4]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}x`}
                />
                <ReferenceLine y={1} stroke="rgb(139 92 246 / 0.3)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "0.5px solid rgb(139 92 246 / 0.25)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number | string) => [`${v}x`, "Index"]}
                />
                <Area type="monotone" dataKey="multiplier" stroke="#8b5cf6" strokeWidth={1.8} fill="url(#seas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Next 90 days */}
        <section className="glass p-5">
          <h3 className="text-[15px] font-semibold tracking-tight">Next 90 days</h3>
          <div className="num mt-1 text-[11px] text-muted-foreground">
            {today} → {horizon.toISOString().slice(0, 10)}
          </div>
          <div className="mt-4 flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
            {oracle.events.slice(0, 12).map((e) => {
              const meta = CAT_META[e.category];
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
                  <meta.icon className={cn("size-4 shrink-0", meta.tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{e.title}</div>
                    <div className="num text-[11px] text-muted-foreground">{e.date}</div>
                  </div>
                  <ScoreBadge score={e.crs} size={30} tone="brand" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Campaign waves */}
      <section>
        <h3 className="text-[15px] font-semibold tracking-tight">Three campaign waves</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {oracle.waves.map((w, i) => (
            <div key={w.phase} className="glass flex flex-col p-5">
              <div className="flex items-center justify-between">
                <ToneBadge tone={WAVE_TONE[i]}>{w.phase}</ToneBadge>
              </div>
              <h4 className="mt-3 text-[15px] font-semibold tracking-tight">{w.theme}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{w.objective}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {w.plays.length ? (
                  w.plays.map((p) => (
                    <div key={p.title} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{p.title}</span>
                        <span className="num shrink-0 text-[11px] text-[var(--cauldron)]">{p.sendDate}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No high-CRS events in this window — run the evergreen cadence.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
