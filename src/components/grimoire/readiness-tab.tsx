"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import { ScoreBadge, ToneBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Persona, ReadinessScorecard } from "@/lib/types";

const STATUS_META = {
  pass: { icon: Check, tone: "text-[var(--contact)]", badge: "emerald" },
  warn: { icon: TriangleAlert, tone: "text-[var(--cauldron)]", badge: "amber" },
  fail: { icon: X, tone: "text-[var(--hex)]", badge: "crimson" },
} as const;

export function ReadinessTab({
  personas,
  readiness,
}: {
  personas: Persona[];
  readiness: ReadinessScorecard | null;
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Persona cards */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[15px] font-semibold tracking-tight">ICP Alchemist — 3 buying-committee personas</h3>
          <span className="text-[11px] text-muted-foreground">Gate 6: multi-thread every account</span>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {personas.map((p) => (
            <div key={p.id} className="glass flex flex-col p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold tracking-tight">{p.name}</h4>
              </div>
              <p className="mt-0.5 text-[13px] text-brand">{p.role}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.firmographic}</p>
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Observable triggers
                </div>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {p.triggers.map((t) => (
                    <li key={t} className="text-xs leading-relaxed text-muted-foreground">· {t}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 rounded-lg border border-[var(--hex)]/25 bg-[var(--hex)]/8 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hex)]">Hex hook</div>
                <p className="mt-1 text-xs leading-relaxed">{p.hexHook}</p>
              </div>
              <div className="mt-3 rounded-lg border border-border/50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mom-test question</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">“{p.momQuestion}”</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scorecard */}
      {readiness && (
        <section>
          <div className="glass flex items-center gap-5 p-5">
            <ScoreBadge score={readiness.total} size={64} />
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">Pre-Spell Readiness Gate</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                6-point audit before Export unlocks — motion locked:{" "}
                <span className="text-foreground">{readiness.motionLock}</span>
              </p>
            </div>
            <ToneBadge
              tone={readiness.total >= 70 ? "emerald" : readiness.total >= 50 ? "amber" : "crimson"}
              className="ml-auto"
            >
              {readiness.total >= 70 ? "Cleared to Export" : readiness.total >= 50 ? "Export with caution" : "Not ready"}
            </ToneBadge>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {readiness.gates.map((g) => {
              const meta = STATUS_META[g.status];
              return (
                <div key={g.gate} className="glass flex items-start gap-4 p-4">
                  <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-current/30", meta.tone)}>
                    <meta.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">
                        Gate {g.gate}: {g.name}
                      </span>
                      <ToneBadge tone={meta.badge}>{g.score}</ToneBadge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.finding}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--cauldron)]">→ {g.fix}</p>
                  </div>
                  <div className="hidden w-24 shrink-0 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          g.score >= 70 ? "bg-[var(--contact)]" : g.score >= 50 ? "bg-[var(--cauldron)]" : "bg-[var(--hex)]",
                        )}
                        style={{ width: `${g.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
