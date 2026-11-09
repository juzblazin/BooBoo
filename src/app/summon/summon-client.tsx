"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { Check, Sparkles } from "lucide-react";
import { Salem } from "@/components/salem";
import { SummonForm } from "@/components/summon-form";
import { DomainMark, RivalKindChip, ToneBadge } from "@/components/ui";
import RBReflectiveCard from "@/components/react-bits/ReflectiveCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReflectiveCard = RBReflectiveCard as unknown as (props: Record<string, any>) => JSX.Element;
import { cn } from "@/lib/cn";
import type { Rival } from "@/lib/types";

type Phase = "loading" | "choosing" | "casting" | "error";

export function SummonClient() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? params.get("domain") ?? "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<"domain" | "idea">("domain");
  const [subject, setSubject] = useState("");
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!query || ran.current) return;
    ran.current = true;
    fetch("/api/spells/discover-rivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setMode(d.mode);
        setSubject(d.domain);
        setRivals(d.rivals);
        setSelected(new Set(d.rivals.filter((r: Rival) => r.preselected).map((r: Rival) => r.domain)));
        setPhase("choosing");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      });
  }, [query]);

  const toggle = (d: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const cast = async () => {
    setPhase("casting");
    const res = await fetch("/api/spells/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: subject,
        companyName: mode === "idea" ? subject : undefined,
        rivals,
        selectedDomains: [...selected],
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? "Analysis failed.");
      setPhase("error");
      return;
    }
    router.push(`/cast/${d.spellId}`);
  };

  return (
    <div className="container-page max-w-5xl py-14">
      <div className="flex flex-col items-center text-center">
        <Salem state={phase === "loading" ? "stalking" : "idle"} size={88} />
        <h1 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight">
          {phase === "loading" && "Boo is analyzing competitors…"}
          {phase === "choosing" && "Competitors found. Choose who to analyze."}
          {phase === "casting" && "Starting analysis…"}
          {phase === "error" && "Something went wrong"}
        </h1>
        {phase === "choosing" && (
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Boo found {rivals.length} competitors for {subject}. We pre-selected
            the top 3 — adjust your picks, then run the analysis.
          </p>
        )}
      </div>

      {phase === "loading" && (
        <div className="mt-10 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-[68px] animate-pulse" />
          ))}
        </div>
      )}

      {phase === "choosing" && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rivals.map((r) => {
              const on = selected.has(r.domain);
              return (
                <div key={r.domain} className="flex justify-center">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(r.domain)}
                    onKeyDown={(e) => e.key === "Enter" && toggle(r.domain)}
                    className={cn(
                      "relative w-fit cursor-pointer rounded-2xl",
                      on && "ring-1 ring-brand",
                    )}
                  >
                  <ReflectiveCard
                    name={r.domain}
                    role={`${r.kind} · ${r.overlapScore}/100`}
                    badge=""
                    status=""
                    idLabel=""
                    idValue=""
                    tint="#7f5cff"
                    metalness={0.9}
                    roughness={0.35}
                    shine={0.9}
                    glare={0.45}
                    tiltStrength={8}
                    radius={16}
                    enableTilt
                    intro
                    theme="dark"
                    style={{ "--rc-width": "300px", "--rc-height": "189px" }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${r.domain}&sz=128`}
                    alt=""
                    width={36}
                    height={36}
                    className="absolute bottom-[72px] left-4 z-10 size-9 rounded-lg bg-white/90 p-1 shadow-md"
                  />
                  <span
                    className={cn(
                      "absolute right-2.5 top-2.5 z-20 grid size-7 place-items-center rounded-full border-2 shadow-md transition-colors",
                      on
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-white/40 bg-black/50 text-white/40",
                    )}
                  >
                    <Check className="size-4" />
                  </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <ToneBadge tone="neutral">{selected.size} rivals selected</ToneBadge>
            <button
              onClick={cast}
              disabled={!selected.size}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-[var(--shadow-primary)] transition-all duration-150 hover:bg-brand/90 active:scale-[0.97] disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              Cast a Spell
            </button>
          </div>
        </>
      )}

      {phase === "casting" && (
        <div className="mt-10 flex justify-center">
          <Salem state="brewing" size={96} />
        </div>
      )}

      {phase === "error" && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--hex)]">{error}</p>
          <div className="mx-auto mt-6 max-w-md">
            <SummonForm size="sm" />
          </div>
          {error?.includes("Spells") && (
            <a href="/pricing" className="mt-4 inline-block text-sm text-brand hover:underline">
              See plans →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
