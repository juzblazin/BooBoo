import { analyzeCompetitor } from "@/lib/services/hex_analyzer";
import { fetchDarkArts } from "@/lib/services/dark_arts_ads";
import { buildOracleTimeline } from "@/lib/services/oracle_timeline";
import { runCovenTrial } from "@/lib/services/coven_trial";
import { summonBuyers } from "@/lib/services/buyer_summoner";
import { forgePersonas, scoreReadiness } from "@/lib/services/icp_alchemist";
import { store } from "@/lib/store";
import type { CastEvent, GrimoireSpell } from "@/lib/types";

/** In-memory job registry — the SSE route replays + tails these events, and
 *  every event is also persisted to grimoire_spells.progress_json so a
 *  reconnect (or fresh process) can resume the stream. */

interface Job {
  events: CastEvent[];
  done: boolean;
  failed?: string;
}

const jobs = new Map<string, Job>();
const subscribers = new Map<string, Set<(e: CastEvent) => void>>();

export function subscribe(spellId: string, fn: (e: CastEvent) => void) {
  let set = subscribers.get(spellId);
  if (!set) subscribers.set(spellId, (set = new Set()));
  set.add(fn);
  return () => set.delete(fn);
}

export function jobEvents(spellId: string): { events: CastEvent[]; done: boolean; failed?: string } {
  const j = jobs.get(spellId);
  return { events: j?.events ?? [], done: j?.done ?? false, failed: j?.failed };
}

export function isJobActive(spellId: string) {
  const j = jobs.get(spellId);
  return Boolean(j && !j.done);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function emit(spell: GrimoireSpell, job: Job, e: Omit<CastEvent, "at">) {
  const ev: CastEvent = { ...e, at: Date.now() };
  job.events.push(ev);
  spell.progress = job.events;
  for (const fn of subscribers.get(spell.id) ?? []) fn(ev);
  await store.putSpell(spell).catch(() => {});
}

/** The full "Cast a Spell" pipeline — parallel fan-out, then synthesis. */
export function startCastJob(spell: GrimoireSpell) {
  if (jobs.get(spell.id) && !jobs.get(spell.id)!.done) return;

  const job: Job = { events: spell.progress ?? [], done: false };
  jobs.set(spell.id, job);

  void (async () => {
    try {
      const domains = spell.selectedDomains;
      let costMicro = 0;

      await emit(spell, job, {
        step: "stalk",
        label: `Boo is scanning ${domains.length} rivals…`,
        detail: "Traffic telemetry, SEO gaps, AEO share, tech stacks, review curses",
        state: "stalking",
      });
      await sleep(1200);
      const hexes = await Promise.all(domains.map((d) => analyzeCompetitor(d)));
      spell.hexes = hexes;
      costMicro += domains.length * 580_000;
      await emit(spell, job, {
        step: "analyzed",
        label: `${hexes.reduce((a, h) => a + h.vulnerabilities.length, 0)} hexes found across ${domains.length} rivals`,
        detail: `${hexes.reduce((a, h) => a + h.complaints.length, 0)} complaint clusters · ${hexes.reduce((a, h) => a + h.keywordGaps.length, 0)} keyword gaps`,
        state: "brewing",
      });

      await emit(spell, job, {
        step: "ads",
        label: "Raiding the Ad Intelligence…",
        detail: "Meta · LinkedIn · Google · TikTok — ranking creatives by survival days",
        state: "brewing",
      });
      await sleep(1400);
      spell.ads = await fetchDarkArts(domains);
      costMicro += 50_000;
      await emit(spell, job, {
        step: "ads-done",
        label: `${spell.ads.length} ads captured — ${spell.ads.filter((a) => a.evergreen).length} Evergreen Winners`,
        detail: `${spell.ads.filter((a) => a.evergreen).length} creatives survived 60+ days`,
        state: "brewing",
      });

      await emit(spell, job, {
        step: "oracle",
        label: "Consulting the Timing & Trends…",
        detail: "24-month seasonality · movies · sports · conferences · macro triggers",
        state: "brewing",
      });
      await sleep(1200);
      spell.oracle = await buildOracleTimeline(spell.userDomain, hexes[0]?.trend ?? []);
      costMicro += 80_000;
      await emit(spell, job, {
        step: "oracle-done",
        label: `${spell.oracle.events.length} cultural triggers mapped to 3 campaign waves`,
        state: "brewing",
      });

      await emit(spell, job, {
        step: "coven",
        label: "The GTM Strategy is convening…",
        detail: `${domains.length * 9} rival pages · earnings transcripts · 100+ reviews · Reddit vents`,
        state: "brewing",
      });
      await sleep(1800);
      spell.coven = await runCovenTrial(spell.userDomain, spell.companyName, spell.rivals, hexes);
      await store.putCoven(spell.id, spell.coven);
      costMicro += 120_000 + 350_000; // corpus + LLM sparring
      await emit(spell, job, {
        step: "coven-done",
        label: "The Trial survived — a V2 GTM hypothesis was forged",
        detail: `${spell.coven.truths.length} market truths · ${spell.coven.orthodoxies.length} orthodoxies shattered`,
        state: "brewing",
      });

      await emit(spell, job, {
        step: "personas",
        label: "Forging the ICP & auditing the 6 Pre-Spell Gates…",
        state: "brewing",
      });
      await sleep(900);
      spell.personas = forgePersonas(spell, spell.coven);
      const buyers = await summonBuyers(spell, spell.personas, spell.oracle);
      await store.putBuyers(spell.id, buyers);
      spell.readiness = scoreReadiness(spell, spell.coven, buyers.length);
      costMicro += 1_680_000;
      await emit(spell, job, {
        step: "buyers",
        label: `${buyers.length} buyers summoned across ${new Set(buyers.map((b) => b.company)).size} accounts`,
        detail: `Readiness gate: ${spell.readiness.total}/100 — ${spell.readiness.motionLock}`,
        state: "brewing",
      });

      spell.totalApiCostMicro = costMicro;
      spell.status = "ready";
      await emit(spell, job, {
        step: "sealed",
        label: "Your report is ready. Salem holds the key.",
        detail: `Total gateway cost: $${(costMicro / 1_000_000).toFixed(2)}`,
        state: "summoned",
      });
      await store.putSpell(spell);
      await store.commitTaskRun(spell.id);
      spell.quotaState = "committed";
      job.done = true;
    } catch (err) {
      job.done = true;
      job.failed = err instanceof Error ? err.message : "Cast failed";
      spell.status = "failed";
      spell.error = job.failed;
      await store.putSpell(spell).catch(() => {});
      // AC-02 — a run that never completes gives the quota (incl. the free try) back.
      await store
        .refundTaskRun(spell.id, job.failed)
        .then((refunded) => refunded && (spell.quotaState = "refunded"))
        .catch(() => {});
    }
  })();
}
