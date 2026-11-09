import Link from "next/link";
import { notFound } from "next/navigation";
import { BooMark } from "@/components/salem";
import { DomainMark, ScoreBadge, ToneBadge } from "@/components/ui";
import { store } from "@/lib/store";

export const metadata = { title: "Shared report" };
export const dynamic = "force-dynamic";

/** PRD-10 — public read-only white-label share link (boo.sh/g/[slug]). */
export default async function Sharedreport({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spell = await store.getSpellBySlug(slug);
  if (!spell || spell.status !== "ready") notFound();
  const ws = await store.getWorkspace(spell.workspaceId);
  const label = ws?.whitelabel?.logoText ?? "Boo";

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="flex items-center gap-3.5">
        <DomainMark domain={spell.userDomain} size={44} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{spell.companyName}</h1>
            <ToneBadge tone="brand">Shared report</ToneBadge>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Prepared by {label} · {new Date(spell.createdAt).toLocaleDateString()}
          </p>
        </div>
        {spell.readiness && <ScoreBadge score={spell.readiness.total} size={44} className="ml-auto" />}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="glass p-5">
          <div className="num text-2xl font-semibold tracking-tight">{spell.selectedDomains.length}</div>
          <div className="mt-1 text-[13px] text-muted-foreground">rivals analyzed</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {spell.selectedDomains.map((d) => (
              <ToneBadge key={d} tone="dark">{d}</ToneBadge>
            ))}
          </div>
        </div>
        <div className="glass p-5">
          <div className="num text-2xl font-semibold tracking-tight">
            {(spell.ads ?? []).filter((a) => a.evergreen).length}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">evergreen rival creatives</div>
          <div className="num mt-2 text-[11px] text-muted-foreground">
            {(spell.ads ?? []).length} ads captured across 4 platforms
          </div>
        </div>
        <div className="glass p-5">
          <div className="num text-2xl font-semibold tracking-tight">
            {spell.oracle?.events.length ?? 0}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">oracle triggers in 90 days</div>
          <div className="num mt-2 text-[11px] text-muted-foreground">
            {spell.coven ? `${spell.coven.truths.length} market truths · ${spell.coven.orthodoxies.length} shattered orthodoxies` : ""}
          </div>
        </div>
      </div>

      {spell.coven && (
        <div className="glass mt-6 p-6">
          <ToneBadge tone="brand">Surviving V2 GTM Hypothesis</ToneBadge>
          <p className="mt-4 text-[15px] leading-relaxed">{spell.coven.hypothesis.wedge}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {spell.coven.hypothesis.icpNarrowing}
          </p>
        </div>
      )}

      {spell.hexes && (
        <div className="mt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Blind spots found</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {spell.hexes.flatMap((h) =>
              h.vulnerabilities.slice(0, 2).map((v) => (
                <div key={`${h.domain}-${v.label}`} className="glass p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{v.label}</span>
                    <ToneBadge tone={v.severity === "high" ? "crimson" : "amber"}>{v.severity}</ToneBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.domain}</p>
                </div>
              )),
            )}
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <BooMark size={64} />
        <p className="text-[13px] text-muted-foreground">
          Summon your own report — rivals, ads, timing & buyers in 60 seconds.
        </p>
        <Link
          href="/#summon"
          className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-[var(--shadow-primary)] transition-all hover:bg-brand/90 active:scale-[0.97]"
        >
          Cast a Spell free
        </Link>
      </div>
    </div>
  );
}
