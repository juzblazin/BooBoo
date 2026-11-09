import { treg } from "@/lib/gateways/treg";
import { rngFor } from "@/lib/rng";
import { store } from "@/lib/store";
import type {
  OracleCategory,
  OracleEvent,
  OracleTimeline,
  TrafficPoint,
} from "@/lib/types";
import { ORACLE_TITLES } from "@/lib/demo/vocab";

const CATEGORY_WEIGHT: Record<OracleCategory, number> = {
  conference: 0.95,
  trend: 0.85,
  macro: 0.7,
  holiday: 0.8,
  sports: 0.55,
  movie: 0.45,
};

const HOOKS: Record<OracleCategory, string> = {
  conference: "Run a 'hallway track' campaign — target attendees with rival teardowns while budgets are open",
  trend: "Newsjack the discourse: publish the contrarian data point while the thread is hot",
  macro: "Anchor messaging to the macro print — CFO attention peaks around rate/earnings cycles",
  holiday: "Time the send to the seasonal budget motion, not the calendar everyone else uses",
  sports: "Cultural metaphor creative — borrow the event's drama without the rights fees",
  movie: "Ride the fandom wave with a themed teardown format your buyers will actually share",
};

/** PRD-05 — predictive 30/60/90-day cultural timeline ("The Oracle's Hourglass"). */
export async function buildOracleTimeline(
  userDomain: string,
  trend: TrafficPoint[],
): Promise<OracleTimeline> {
  const rng = rngFor(`oracle:${userDomain}`);

  // Seasonality multipliers from the 24-month series (month-of-year index).
  const monthly = new Array(12).fill(0).map((_, m) => {
    const vals = trend.filter((t) => Number(t.month.slice(5)) === m + 1).map((t) => t.visits);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
  });
  const mean = monthly.reduce((a, b) => a + b, 0) / 12 || 1;
  const seasonality = monthly.map((avg, m) => ({
    month: new Date(2000, m, 1).toLocaleString("en", { month: "short" }),
    multiplier: Math.round((avg / mean) * 100) / 100,
  }));

  // Events — 14-day global cache, live pulls when TREG key exists.
  let events = await store.getOracleEvents();
  if (!events) {
    const live = await Promise.all([treg.imdbUpcoming(), treg.productHunt()]);
    void live;

    const cats = Object.keys(ORACLE_TITLES) as OracleCategory[];
    const generated: OracleEvent[] = [];
    for (let d = rng.int(3, 6); d < 90; d += rng.int(3, 9)) {
      const category = rng.pick(cats);
      const title = rng.pick(ORACLE_TITLES[category]);
      const date = new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
      const crs = Math.round(rng.float(30, 98) * CATEGORY_WEIGHT[category]);
      generated.push({
        id: `ev_${d}_${category}`,
        title,
        category,
        date,
        crs: Math.min(99, crs),
        hook: HOOKS[category],
      });
    }
    events = generated.sort((a, b) => a.date.localeCompare(b.date));
    await store.putOracleEvents(events);
  }

  const pick = (lo: number, hi: number) =>
    events!.filter((e) => {
      const day = (new Date(e.date).getTime() - Date.now()) / 86_400_000;
      return day >= lo && day < hi;
    });

  const waves: OracleTimeline["waves"] = [
    {
      phase: "Days 1–30",
      theme: "Strike while the cauldron is hot",
      objective: "Convert the loudest complaint window into discovery calls",
      plays: pick(0, 30).slice(0, 3).map((e) => ({
        title: e.title,
        detail: e.hook,
        sendDate: e.date,
      })),
    },
    {
      phase: "Days 31–60",
      theme: "Own the mid-quarter narrative",
      objective: "Publish the counter-positioning asset tied to the biggest CRS event",
      plays: pick(30, 60).slice(0, 3).map((e) => ({
        title: e.title,
        detail: e.hook,
        sendDate: e.date,
      })),
    },
    {
      phase: "Days 61–90",
      theme: "Land the proof wave",
      objective: "Multi-thread the buying committee before rivals react",
      plays: pick(60, 90).slice(0, 3).map((e) => ({
        title: e.title,
        detail: e.hook,
        sendDate: e.date,
      })),
    },
  ];

  return { seasonality, events, waves };
}
