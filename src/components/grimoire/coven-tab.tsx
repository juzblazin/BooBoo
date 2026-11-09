"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Send } from "lucide-react";
import { ToneBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CovenTrialResult } from "@/lib/types";

const AGENT_META = {
  alchemist: { name: "The Alchemist", role: "YC partner — steelmans the wedge", tone: "text-[var(--contact)]" },
  inquisitor: { name: "The Inquisitor", role: "red-team — tears it apart with evidence", tone: "text-[var(--hex)]" },
  synthesizer: { name: "The Synthesizer", role: "forges the surviving V2 hypothesis", tone: "text-brand" },
} as const;

type ChatMsg = { role: string; text: string; at: string };

export function CovenTab({ coven, spellId }: { coven: CovenTrialResult | null; spellId: string }) {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/spells/${spellId}/spar`)
      .then((r) => r.json())
      .then((d) => setChat(d.history ?? []))
      .catch(() => {});
  }, [spellId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat, thinking]);

  if (!coven) return null;

  const spar = async () => {
    const msg = input.trim();
    if (!msg || thinking) return;
    setInput("");
    setChat((c) => [...c, { role: "founder", text: msg, at: new Date().toISOString() }]);
    setThinking(true);
    try {
      const res = await fetch(`/api/spells/${spellId}/spar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const d = await res.json();
      setChat((c) => [...c, { role: "inquisitor", text: d.reply, at: new Date().toISOString() }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Corpus receipt */}
      <div className="glass flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <CorpusStat n={coven.corpus.sitesScraped} label="rival sites scraped" />
        <CorpusStat n={coven.corpus.transcripts} label="earnings transcripts" />
        <CorpusStat n={coven.corpus.reviews} label="raw reviews" />
        <CorpusStat n={coven.corpus.threads} label="vent threads" />
        <ToneBadge tone="crimson" className="ml-auto">
          <Flame className="size-3" />
          The Trial survived
        </ToneBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Truths */}
        <section>
          <h3 className="text-[15px] font-semibold tracking-tight">Unspoken market truths</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            What winners know that customers would never admit.
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {coven.truths.map((t, i) => (
              <details key={i} className="glass group p-4">
                <summary className="cursor-pointer text-[13px] font-medium leading-snug">
                  {t.truth}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.evidence}</p>
                <p className="mt-2 border-l-2 border-brand/50 pl-3 text-xs leading-relaxed text-brand">
                  {t.implication}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Shattered orthodoxies */}
        <section>
          <h3 className="text-[15px] font-semibold tracking-tight">Shattered orthodoxies</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Five industry beliefs — proven false today.
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {coven.orthodoxies.map((o, i) => (
              <div key={i} className="glass p-4">
                <div className="flex items-start gap-2.5">
                  <span className="num mt-0.5 text-xs font-semibold text-[var(--hex)]">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-medium line-through decoration-[var(--hex)]/60">
                      “{o.belief}”
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{o.whyFalse}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--cauldron)]">
                      Unserved pain: {o.unservedPain}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Debate transcript */}
      <section>
        <h3 className="text-[15px] font-semibold tracking-tight">The Trial by Fire — VC debate transcript</h3>
        <div className="mt-3 flex flex-col gap-3">
          {coven.debate.map((t, i) => {
            const meta = AGENT_META[t.agent];
            return (
              <div key={i} className="glass p-4">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[13px] font-semibold", meta.tone)}>{meta.name}</span>
                  <span className="text-[11px] text-muted-foreground">· {meta.role}</span>
                  <ToneBadge tone="neutral" className="ml-auto">Round {t.round}</ToneBadge>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Surviving hypothesis + sparring terminal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass border-brand/30 p-5 shadow-[0_0_0_0.5px_var(--brand),0_1px_2px_0_rgb(0_0_0/.5)]">
          <ToneBadge tone="brand">Surviving V2 GTM Hypothesis</ToneBadge>
          <dl className="mt-4 flex flex-col gap-4">
            <Hypo term="The wedge" value={coven.hypothesis.wedge} />
            <Hypo term="Counter-positioning" value={coven.hypothesis.positioning} />
            <Hypo term="ICP slice" value={coven.hypothesis.icpNarrowing} />
            <Hypo term="Step-0 offer" value={coven.hypothesis.offer} />
          </dl>
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Mom-Test discovery questions
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {coven.hypothesis.momTestQuestions.map((q, i) => (
                <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                  {i + 1}. {q}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sparring terminal */}
        <section className="glass flex flex-col p-5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--hex)]">The Inquisitor</span>
            <span className="text-[11px] text-muted-foreground">— spar against the indexed corpus</span>
          </div>
          <div ref={scrollRef} className="mt-3 flex min-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto">
            {chat.length === 0 && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Challenge the hypothesis. The Inquisitor answers with evidence from
                the {" "}
                {coven.corpus.sitesScraped + coven.corpus.transcripts + coven.corpus.reviews + coven.corpus.threads}
                -document corpus. Try: “Why won't the incumbent just copy this?”
              </p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                  m.role === "founder"
                    ? "self-end bg-brand/15 text-foreground"
                    : "self-start border border-[var(--hex)]/25 bg-[var(--hex)]/8 text-foreground/90",
                )}
              >
                {m.text}
              </div>
            ))}
            {thinking && (
              <div className="self-start rounded-lg border border-[var(--hex)]/25 bg-[var(--hex)]/8 px-3 py-2 text-[13px] text-muted-foreground">
                The Inquisitor is sharpening a knife…
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              spar();
            }}
            className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Defend your thesis…"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="grid size-7 place-items-center rounded-md bg-[var(--hex)]/15 text-[var(--hex)] transition-colors hover:bg-[var(--hex)]/25 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function CorpusStat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="num text-xl font-semibold tracking-tight">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Hypo({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-[13px] leading-relaxed">{value}</dd>
    </div>
  );
}
