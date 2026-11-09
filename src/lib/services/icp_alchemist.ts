import { rngFor, titleFromDomain } from "@/lib/rng";
import type {
  CovenTrialResult,
  GrimoireSpell,
  Persona,
  ReadinessScorecard,
} from "@/lib/types";

/** PRD-07 Tab 5 — 3 persona cards + the 6-Gate Pre-Spell Readiness Scorecard. */
export function forgePersonas(
  spell: GrimoireSpell,
  coven: CovenTrialResult,
): Persona[] {
  const rng = rngFor(`personas:${spell.id}`);
  const rival = titleFromDomain(spell.selectedDomains[0] ?? spell.rivals[0]?.domain ?? "the incumbent");
  const pain = coven.orthodoxies[0]?.unservedPain ?? "Teams re-buy stale contacts every quarter";

  return [
    {
      id: "p_econ",
      name: "The Economic Alchemist",
      role: "VP Revenue Operations / CRO",
      firmographic: "B2B, 50–500 employees, $5M–$80M ARR, owns the GTM tooling budget",
      triggers: [
        `Renewal window approaching on ${rival}`,
        "Board mandate to cut CAC this half",
        "Hiring first dedicated RevOps hire",
      ],
      hexHook: `${rival} renewal shock — the account is quietly comparison-shopping`,
      momQuestion: coven.hypothesis.momTestQuestions[3] ?? "Who has to believe a new vendor before you can spend?",
    },
    {
      id: "p_champ",
      name: "The Burned Champion",
      role: "Director of Demand Gen / Growth Lead",
      firmographic: "B2B SaaS or agency, runs outbound + paid, judged on meetings booked",
      triggers: [
        `Publicly complained about ${rival} in the last 90 days`,
        "Just took over outbound after a reorg",
        "Posted about deliverability or data decay on LinkedIn/Reddit",
      ],
      hexHook: `"${pain.slice(0, 80)}…" — they lived this last quarter`,
      momQuestion: coven.hypothesis.momTestQuestions[0] ?? "Tell me about the last list that actually converted.",
    },
    {
      id: "p_eval",
      name: "The Skeptical Evaluator",
      role: "Head of Data / Director of Engineering",
      firmographic: "Technical gatekeeper at the same accounts — kills tools that can't prove provenance",
      triggers: [
        "Owns the CRM data quality SLA",
        "Burned by an unverifiable 'verified contact' claim before",
        "Evaluates any tool that touches enrichment pipelines",
      ],
      hexHook: "Zero Personal Email guarantee + per-record verification receipts",
      momQuestion: coven.hypothesis.momTestQuestions[4] ?? "What would make you distrust a 'verified email' claim on sight?",
    },
  ];
}

export function scoreReadiness(
  spell: GrimoireSpell,
  coven: CovenTrialResult,
  buyerCount: number,
): ReadinessScorecard {
  const rng = rngFor(`readiness:${spell.id}`);
  const topHex = spell.hexes?.[0];
  const evergreenCount = (spell.ads ?? []).filter((a) => a.evergreen).length;

  const gates: ReadinessScorecard["gates"] = [
    {
      gate: 1,
      name: "ACV-to-Motion Economics",
      score: rng.int(68, 92),
      status: "pass",
      finding: "Estimated ACV $8K–$45K → Data-First Outbound + narrow paid social locked in as the motion.",
      fix: "Keep PLG as the Step-0 funnel (self-serve teardown report), not the primary motion.",
    },
    {
      gate: 2,
      name: "Trigger-Bound ICP Slice",
      score: buyerCount >= 24 ? rng.int(80, 95) : rng.int(55, 70),
      status: buyerCount >= 24 ? "pass" : "warn",
      finding: `ICP bounded to ~${buyerCount * 180} accounts via observable triggers: rival installs, complaint windows, hiring signals.`,
      fix: buyerCount >= 24 ? "Slice is tight." : "Tighten the trigger filter — require ≥2 observable signals per account.",
    },
    {
      gate: 3,
      name: "Evidence-Backed Counter-Positioning",
      score: topHex ? rng.int(74, 94) : 40,
      status: topHex ? "pass" : "fail",
      finding: topHex
        ? `Every persona is paired with a verified ${titleFromDomain(topHex.domain)} vulnerability and a Coven Trial truth.`
        : "No rival weakness evidence attached to personas.",
      fix: topHex ? "Ready." : "Re-run Hexes & Blind Spots before export.",
    },
    {
      gate: 4,
      name: "Frictionless Step-0 Offer",
      score: evergreenCount > 0 ? rng.int(70, 90) : rng.int(45, 60),
      status: evergreenCount > 0 ? "pass" : "warn",
      finding: `Step-0 asset modeled on ${evergreenCount} evergreen rival creatives: an interactive 'Competitive Hex Report' with no demo gate.`,
      fix: evergreenCount > 0 ? "Ship the self-serve teardown as the CTA." : "No proven evergreen creative to model — build the offer from the Coven Trial wedge.",
    },
    {
      gate: 5,
      name: "Temporal & Cultural Sync",
      score: (spell.oracle?.events.length ?? 0) >= 8 ? rng.int(78, 96) : rng.int(50, 65),
      status: (spell.oracle?.events.length ?? 0) >= 8 ? "pass" : "warn",
      finding: `${spell.oracle?.events.length ?? 0} oracle events mapped; every buyer carries a recommended send date and timeline hook.`,
      fix: "Hold sends inside the flagged CRS windows — off-window sends underperform.",
    },
    {
      gate: 6,
      name: "Multi-Threaded Send-Time Verification",
      score: rng.int(72, 95),
      status: "pass",
      finding: "2–3 buying-committee roles per account (Economic Buyer + Champion + Evaluator); every email verified at unlock.",
      fix: "Never send to a single thread — export the full committee per account.",
    },
  ];

  const total = Math.round(gates.reduce((a, g) => a + g.score, 0) / gates.length);
  return {
    total,
    motionLock: "Data-First Outbound + Step-0 PLG funnel",
    gates,
  };
}
