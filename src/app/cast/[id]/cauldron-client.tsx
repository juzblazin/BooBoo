"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Salem } from "@/components/salem";
import { cn } from "@/lib/cn";
import type { CastEvent, SalemState } from "@/lib/types";

const BREW_LINES = [
  "Brewing traffic telemetry, ad hooks, Reddit vents & cultural signals…",
  "The cauldron doesn't rush. Neither does good strategy.",
  "25+ rival sites, 100+ reviews, 4 ad networks, 90 days of timing…",
];

export function CauldronClient({ spellId }: { spellId: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<CastEvent[]>([]);
  const [state, setState] = useState<SalemState>("stalking");
  const [done, setDone] = useState<"ready" | "failed" | null>(null);
  const [line, setLine] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const es = new EventSource(`/api/spells/${spellId}/events`);
    es.addEventListener("progress", (e) => {
      const ev = JSON.parse(e.data) as CastEvent;
      setEvents((prev) => [...prev, ev]);
      setState(ev.state);
    });
    es.addEventListener("done", (e) => {
      const d = JSON.parse(e.data) as { status: string };
      es.close();
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(d.status === "failed" ? "failed" : "ready");
      if (d.status !== "failed") {
        setState("summoned");
        setTimeout(() => router.push(`/spells/${spellId}`), 1600);
      }
    });
    es.onerror = () => {
      es.close();
      if (!doneRef.current) setDone("failed");
    };
    return () => es.close();
  }, [spellId, router]);

  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % BREW_LINES.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container-page flex max-w-2xl flex-col items-center py-16 text-center">
      <div className="relative">
        <Salem state={state} size={140} />
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {done === "failed"
          ? "Analysis failed"
          : state === "summoned"
            ? "Your report is ready"
            : "Analyzing your market"}
      </h1>
      <p className="mt-2 h-5 text-sm text-muted-foreground">
        {done === "failed"
          ? "Something in the ritual went sideways — try casting again."
          : state === "summoned"
            ? "Opening your report…"
            : BREW_LINES[line]}
      </p>

      <div className="mt-10 w-full max-w-md text-left">
        {events.map((ev, i) => {
          const last = i === events.length - 1;
          return (
            <div key={`${ev.step}-${ev.at}`} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border",
                    last && !done
                      ? "border-brand bg-brand/20"
                      : "border-[var(--contact)]/50 bg-[var(--contact)]/15 text-[var(--contact)]",
                  )}
                >
                  {last && !done ? (
                    <span className="size-2 animate-pulse rounded-full bg-brand" />
                  ) : (
                    <Check className="size-3" />
                  )}
                </span>
                {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <div className={cn("text-[13px] font-medium", last && !done && "text-brand")}>
                  {ev.label}
                </div>
                {ev.detail && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{ev.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
