import { randomUUID } from "node:crypto";
import { treg } from "@/lib/gateways/treg";
import { domainFromCompany, rngFor, titleFromDomain } from "@/lib/rng";
import type {
  Buyer,
  CommitteeRole,
  GrimoireSpell,
  OracleTimeline,
  Persona,
} from "@/lib/types";
import {
  BUYER_COMPANIES,
  FIRST_NAMES,
  LAST_NAMES,
  TITLES_BY_ROLE,
  TRIGGERS,
} from "@/lib/demo/vocab";

const ROLE_ORDER: CommitteeRole[] = ["Economic Buyer", "Champion", "Technical Evaluator"];
const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "icloud.com", "outlook.com"];

function seniorityOf(role: CommitteeRole): Buyer["seniority"] {
  return role === "Economic Buyer"
    ? Math.random() < 0.5 ? "VP" : "C-Suite"
    : role === "Champion"
      ? "Director"
      : "Director";
}

/** PRD-08 step 1 — zero-credit candidate discovery (preview 30–50 buyers). */
export async function summonBuyers(
  spell: GrimoireSpell,
  personas: Persona[],
  oracle: OracleTimeline,
): Promise<Buyer[]> {
  const rng = rngFor(`buyers:${spell.id}`);
  const hexHooks = (spell.hexes ?? []).flatMap((h) =>
    h.vulnerabilities.map((v) => `${titleFromDomain(h.domain)}: ${v.label.toLowerCase()}`),
  );
  const sendDates = oracle.waves.flatMap((w) => w.plays.map((p) => p.sendDate));
  const momQuestions =
    spell.coven?.hypothesis.momTestQuestions ??
    ["Walk me through the last time this problem cost you a deal?"];

  const companies = rng.pickN(BUYER_COMPANIES, 16);
  const buyers: Buyer[] = [];
  let i = 0;

  for (const company of companies) {
    // Multi-threaded: 2–3 committee roles per account (Gate 6).
    const roles = rng.pickN(ROLE_ORDER, rng.int(2, 3));
    for (const role of roles) {
      const fullName = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
      const persona = personas[i % Math.max(1, personas.length)];
      buyers.push({
        id: `b_${randomUUID().slice(0, 8)}`,
        fullName,
        title: rng.pick(TITLES_BY_ROLE[role]),
        company,
        domain: domainFromCompany(company),
        seniority: seniorityOf(role),
        committeeRole: role,
        trigger: rng.pick(TRIGGERS),
        competitorHexHook: hexHooks[i % Math.max(1, hexHooks.length)] ?? "Rival ad fatigue detected",
        oracleTimelineHook:
          sendDates[i % Math.max(1, sendDates.length)]
            ? `Timed to the ${sendDates[i % sendDates.length]} oracle window`
            : "Send inside the Days 1–30 wave",
        momTestQuestion: momQuestions[i % momQuestions.length],
        recommendedSendDate:
          sendDates[i % Math.max(1, sendDates.length)] ??
          new Date(Date.now() + rng.int(3, 30) * 86_400_000).toISOString().slice(0, 10),
        workEmail: null,
        emailVerificationStatus: "pending",
        directPhone: null,
        phoneCarrierStatus: null,
        winningProvider: null,
        gdprLia: null,
        brewed: false,
      });
      i++;
    }
  }

  return buyers.slice(0, 48);
}

export interface PotionResult {
  ok: boolean;
  buyer?: Buyer;
  elixirsSpent: number;
  costMicro: number;
  reason?: string;
}

/** PRD-08 steps 2–4 — cost-capped waterfall + verification gate + GDPR LIA.
 *  1 Elixir is spent only when the work email verifies `valid`. */
export async function brewPotion(
  buyer: Buyer,
  rng: ReturnType<typeof rngFor>,
): Promise<PotionResult> {
  const [emailRes, phoneRes] = await Promise.all([
    treg.emailWaterfall(buyer.fullName, buyer.domain),
    rng.chance(0.4) ? treg.phoneWaterfall(buyer.fullName, buyer.domain) : Promise.resolve(null),
  ]);

  let workEmail =
    (emailRes?.data as { email?: string })?.email ??
    (rng.chance(0.9)
      ? `${buyer.fullName.split(" ")[0].toLowerCase()}.${buyer.fullName.split(" ")[1].toLowerCase()}@${buyer.domain}`
      : rng.chance(0.5)
        ? `${buyer.fullName.split(" ")[0].toLowerCase()}@${PERSONAL_DOMAINS[0]}` // will be stripped
        : null);

  const directPhone =
    (phoneRes?.data as { phone?: string })?.phone ??
    (rng.chance(0.35) ? `+1${rng.int(201, 989)}${rng.int(200, 999)}${rng.int(1000, 9999)}` : null);

  // Mandatory verification gate.
  if (workEmail && PERSONAL_DOMAINS.some((d) => workEmail!.endsWith(`@${d}`))) {
    workEmail = null; // Zero Personal Email guarantee — strip & report miss.
  }

  let verification: Buyer["emailVerificationStatus"] = "unverified";
  let provider: string | null = null;
  if (workEmail) {
    const verify = await treg.verifyEmail(workEmail);
    const verdict =
      (verify?.data as { status?: string })?.status ?? (rng.chance(0.88) ? "valid" : "invalid");
    verification = verdict === "valid" ? "valid" : "invalid";
    provider = rng.pick(["MillionVerifier", "ZeroBounce", "BounceBan"]);
  }

  const verified = verification === "valid";
  const updated: Buyer = {
    ...buyer,
    workEmail: verified ? workEmail : null,
    emailVerificationStatus: verification,
    directPhone: verified || rng.chance(0.5) ? directPhone : null,
    phoneCarrierStatus: directPhone ? (rng.chance(0.85) ? "active" : "disconnected") : null,
    winningProvider: verified ? rng.pick(["Apollo", "Prospeo", "Findymail", "ContactOut", "Hunter", "Wiza"]) : null,
    gdprLia: verified
      ? {
          rationale: `GDPR Art. 6(1)(f) legitimate interest: B2B prospecting to ${buyer.title} at ${buyer.company} is proportionate — role-relevant offer, work contact only, balanced against minimal intrusion and clear opt-out.`,
          balancingTest:
            `Purpose: B2B intro relevant to role (${buyer.committeeRole}). Necessity: no less-intrusive route achieves the goal. ` +
            `Balance: professional context only, corporate data categories, easy objection path. Provenance: ${buyer.domain} corporate directory via routed waterfall.`,
          generatedAt: new Date().toISOString(),
        }
      : null,
    brewed: true,
  };

  return {
    ok: verified,
    buyer: updated,
    elixirsSpent: verified ? 1 : 0,
    costMicro: rng.int(18_000, 52_000),
    reason: verified ? undefined : workEmail ? `Verification failed (${verification})` : "No work email found — 0 elixirs spent",
  };
}
