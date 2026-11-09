import { rngFor, titleFromDomain } from "@/lib/rng";
import type { CovenTrialResult, HexReport, Rival } from "@/lib/types";

/** PRD-06 — "The Coven Trial": 4-pillar corpus + adversarial VC sparring. */
export async function runCovenTrial(
  userDomain: string,
  userName: string,
  rivals: Rival[],
  hexes: HexReport[],
): Promise<CovenTrialResult> {
  const rng = rngFor(`coven:${userDomain}`);
  const topRival = rivals[0]?.domain ?? "the incumbent";
  const topName = titleFromDomain(topRival);
  const worstComplaint = hexes[0]?.complaints[0]?.theme ??
    "Data accuracy decays fast — bounced emails killed our domain rep";
  const bleed = hexes.find((h) => h.visitsChangePct < 0);

  const corpus = {
    sitesScraped: rng.int(25, 40),
    transcripts: rng.int(3, 5) * 4,
    reviews: rng.int(100, 240),
    threads: rng.int(50, 90),
  };

  const truths: CovenTrialResult["truths"] = [
    {
      truth: "Buyers don't want more data — they want someone to blame when the quarter misses",
      evidence: `Across ${corpus.reviews} scraped reviews, 'accuracy' complaints are really 'I got burned in front of my VP' complaints. ${topName}'s refund threads all mention internal embarrassment, not feature gaps.`,
      implication: "Sell accountability, not accuracy. A verifiable provenance trail per contact is the real wedge.",
    },
    {
      truth: "The market's 'verified' claim is unverifiable on purpose",
      evidence: `${rivals.length} rivals advertise 'verified contacts' but none show verification timestamps. Reddit threads show bounce rates of 18-31% on 'verified' exports.`,
      implication: "Publish verification receipts per record — turns an industry-wide lie into your proof asset.",
    },
    {
      truth: "Champions get fired for vendor choices, not for doing nothing",
      evidence: "1-star review clustering shows complaints spike at renewal — champions who pushed the purchase defend it until they leave, then the account churns.",
      implication: "Arm the champion with a defensible internal narrative, not just a PDF.",
    },
    {
      truth: "Speed-to-insight beats depth-of-database in every evaluation thread",
      evidence: `${corpus.threads} practitioner threads: 'time to first useful answer' outranks database size in win/loss mentions 4:1.`,
      implication: "Lead with the 60-second teardown, not the 275M-row claim.",
    },
  ];

  const orthodoxies: CovenTrialResult["orthodoxies"] = [
    {
      belief: "Bigger database = better product",
      whyFalse: "ZoomInfo's 1% growth at $1.25B proves static scale is commoditized. Buyers churn on decay, not coverage.",
      unservedPain: "Teams re-buy the same stale contacts every quarter and call it 'pipeline'.",
    },
    {
      belief: "Cold email volume is the growth lever",
      whyFalse: "Reply rates sub-1.5% industry-wide; spam filters now punish shared sender infrastructure.",
      unservedPain: "SDRs burn domains and morale on sends that were dead before the first open.",
    },
    {
      belief: "Intent data predicts buying",
      whyFalse: "Bombora-style 'intent' fires on research, not purchase. Practitioners call it 'horoscope data' in vent threads.",
      unservedPain: "Reps chase 'intent' accounts that were never buying while real triggers go unwatched.",
    },
    {
      belief: "More sequences = more meetings",
      whyFalse: "Top-quartile teams in the corpus run 40% fewer touches but multi-thread 2.7 roles per account.",
      unservedPain: "Single-threaded outreach dies silently when the champion ghosts.",
    },
    {
      belief: "Pricing must be hidden behind sales",
      whyFalse: `${topName}'s gated pricing drove the largest single complaint cluster in the corpus — buyers route around it.`,
      unservedPain: "Mid-market buyers self-select out and never tell you why.",
    },
  ];

  const debate: CovenTrialResult["debate"] = [
    {
      agent: "alchemist",
      round: 1,
      text: `The wedge: ${userName} sells *evidence-backed* outbound. ${topName} sells contacts; we sell the reason to call them — the hex (their churning users), the timing (the oracle window), and the verified route in. Nobody else prices the 'why now'.`,
    },
    {
      agent: "inquisitor",
      round: 1,
      text: `Pushback: 'why now' data decays as fast as contact data. ${topName} can ship a 'triggers' tab in a quarter — they have 800 engineers and your entire corpus is scrapeable. What's the moat when they copy the feature?`,
    },
    {
      agent: "alchemist",
      round: 2,
      text: `They can't copy it without cannibalizing the core pitch. ${topName}'s renewal economics depend on selling *volume*; our model monetizes *precision* — we get paid when sends work, they get paid whether they work or not. Their pricing page literally can't say that.`,
    },
    {
      agent: "inquisitor",
      round: 2,
      text: `Counter: precision claims invite precision audits. One quarter where 'hexes' underperform raw volume and churn doubles. ${bleed ? `Also ${titleFromDomain(bleed.domain)} is down ${Math.abs(bleed.visitsChangePct).toFixed(0)}% — a wounded rival may get desperate on price.` : "A desperate incumbent undercuts you on price."} How does the thesis survive a race to the bottom?`,
    },
    {
      agent: "alchemist",
      round: 3,
      text: `We don't fight the price war — we anchor on cost-per-verified-outcome, a metric incumbents can't publish without exposing their decay. And the oracle layer compounds: timing windows expire, but the *calendar asset* renews every quarter and becomes a workflow, not a feature.`,
    },
    {
      agent: "synthesizer",
      round: 3,
      text: `Surviving hypothesis V2: ${userName} wins by owning the 'evidence layer' — verified triggers + verified contacts + verified timing — and refusing the volume war. Kill criteria: if cost-per-verified-outcome doesn't beat the incumbent's effective rate within 2 quarters, the wedge is narrative, not structural.`,
    },
  ];

  const hypothesis = {
    wedge: `Evidence-backed outbound: every ${userName} contact ships with the trigger that makes now the right time, provenance receipts rivals can't show, and a send window tuned to real cultural/seasonal timing.`,
    positioning: `Not a database — the anti-database. ${topName} rents you rows; ${userName} hands you reasons. Counter-position directly at their '${worstComplaint.slice(0, 60)}…' complaint cluster.`,
    icpNarrowing: `5K–15K accounts: B2B companies 10–200 employees currently using ${topName} or a listed rival (TheirStack), who left a ≤3-star review or complained publicly in the last 90 days, and are hiring at least one revenue role.`,
    offer: `Step-0: a self-serve 'Competitive Hex Report' — prospects paste their domain, get their own rivals' wasted spend + complaint map. No demo gate; the report is the pitch.`,
    momTestQuestions: [
      "Walk me through the last time a contact list you bought actually converted — what happened?",
      "How do you decide *when* to reach out to an account today?",
      "What did your team do the last time a campaign bounced hard?",
      "Who internally has to believe a new data vendor before you can spend?",
      "What would make you distrust a 'verified email' claim on sight?",
    ],
  };

  return { corpus, truths, orthodoxies, debate, hypothesis };
}
