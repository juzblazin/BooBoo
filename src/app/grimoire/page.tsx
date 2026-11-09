import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Salem } from "@/components/salem";
import { DomainMark, ToneBadge } from "@/components/ui";
import { currentWorkspace, PLAN_LIMITS, store } from "@/lib/store";

export const metadata = { title: "My Reports" };
export const dynamic = "force-dynamic";

export default async function reportPage() {
  const ws = await currentWorkspace();
  const spells = await store.listSpells(ws.id);
  const ready = spells.filter((s) => s.status === "ready");

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <BookOpen className="size-5 text-brand" />
            My Reports
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your workspace library of saved teardowns, timelines & buyer lists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToneBadge tone="brand">{PLAN_LIMITS[ws.planTier].label}</ToneBadge>
          <ToneBadge tone="neutral">
            {Math.max(0, ws.spellsBalance - ws.spellsUsed)} spells left
          </ToneBadge>
          <ToneBadge tone="emerald">{ws.elixirCreditsBalance} credits</ToneBadge>
        </div>
      </div>

      {spells.length === 0 ? (
        <div className="glass mt-10 flex flex-col items-center p-14 text-center">
          <Salem state="idle" size={88} />
          <p className="mt-5 text-[15px] font-medium">No spells cast yet</p>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
            Enter your domain on the homepage — Boo will find your rivals
            and brew your first report.
          </p>
          <Link
            href="/#summon"
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-[var(--shadow-primary)] transition-all hover:bg-brand/90 active:scale-[0.97]"
          >
            Cast your first Spell
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spells.map((s) => (
            <Link key={s.id} href={`/spells/${s.id}`} className="glass group p-5 transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)]">
              <div className="flex items-center gap-3">
                <DomainMark domain={s.userDomain} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-tight">
                    {s.companyName}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.userDomain}</div>
                </div>
                <ToneBadge
                  tone={s.status === "ready" ? "emerald" : s.status === "brewing" ? "amber" : "crimson"}
                  className="ml-auto shrink-0"
                >
                  {s.status}
                </ToneBadge>
              </div>
              <div className="num mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span>{s.selectedDomains.length} rivals analyzed</span>
                {s.readiness && <span>{s.readiness.total}/100 readiness</span>}
                <span className="ml-auto">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <p className="num mt-6 text-[11px] text-muted-foreground">
          Lifetime gateway spend: ${(spells.reduce((a, s) => a + s.totalApiCostMicro, 0) / 1_000_000).toFixed(2)}
        </p>
      )}
    </div>
  );
}
