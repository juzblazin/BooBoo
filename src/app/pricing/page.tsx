import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./checkout-button";
import { ToneBadge } from "@/components/ui";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Pricing" };

const TIERS = [
  {
    ...PLANS.FREE_TRIAL,
    tagline: "Validate the intelligence in 60 seconds",
    features: [
      "1 competitor per analysis",
      "6-channel snapshot (cached-first, top 50 reviews & ads)",
      "1-vs-1 head-to-head gap matrix",
      "Core ICP + 1 buyer persona",
      "1 validation sprint card",
      "Read-only report + copy to clipboard",
    ],
  },
  {
    ...PLANS.PREMIUM,
    tagline: "For growth & revenue teams",
    featured: true,
    features: [
      "Up to 3 competitors per analysis",
      `${PLANS.PREMIUM.monthlyTaskRuns} analyses / month`,
      "Full 6-channel deep dive",
      "3-way category matrix",
      "Economic vs. operator personas + full counter-messaging",
      "3 sprint cards",
      "CSV export + Notion / Slack webhook",
      "Weekly competitor polling",
    ],
  },
  {
    ...PLANS.SCALE,
    tagline: "For agencies & category leaders",
    features: [
      "Up to 5 competitors per analysis",
      `${PLANS.SCALE.monthlyTaskRuns} analyses / month`,
      "Deep dive + historical trend velocity",
      "5-way market landscape matrix",
      "Regional ad compliance variants (US vs. EU/UK)",
      "5 sprint cards",
      "1-click sync to Clay, Smartlead, Instantly & CRM",
      "Daily price & ad shift alerts",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Choose your coven</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Pay-as-you-go intelligence underneath, software margins on top.
          1 Credit = 1 verified work email — misses cost nothing.
        </p>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TIERS.map((p) => (
          <div
            key={p.tier}
            className={cn(
              "glass relative flex flex-col p-6",
              "featured" in p && p.featured && "shadow-[0_0_0_0.5px_var(--brand),0_1px_2px_0_rgb(0_0_0/.5),0_3px_4px_-2px_rgb(0_0_0/.4)]",
            )}
          >
            {"featured" in p && p.featured && (
              <ToneBadge tone="brand" className="absolute -top-2.5 left-5">
                Most summoned
              </ToneBadge>
            )}
            <h2 className="text-[15px] font-semibold tracking-tight">{p.label}</h2>
            <p className="text-xs text-muted-foreground">{p.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="num text-3xl font-semibold tracking-tight">
                ${p.monthlyPriceUsd}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            <p className="num mt-0.5 text-[11px] text-muted-foreground">
              {p.annualPriceUsd ? `$${p.annualPriceUsd}/mo billed annually` : "one free analysis"}
            </p>
            <ul className="mt-5 flex flex-1 flex-col gap-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--contact)]" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {p.tier === "FREE_TRIAL" ? (
                <a
                  href="/#summon"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-card text-sm font-medium shadow-[var(--shadow-button)] transition-all hover:bg-muted active:scale-[0.97]"
                >
                  Start free
                </a>
              ) : (
                <CheckoutButton plan={p.slug} label={p.label} featured={"featured" in p && p.featured} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass mx-auto mt-10 max-w-2xl p-6">
        <h3 className="text-[15px] font-semibold tracking-tight">Contact Credits & the margin guard</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Every reveal is cost-capped at the gateway (max $0.05/email, $0.30/dial)
          and logged against your spell's{" "}
          <code className="font-mono text-xs">X-Treg-Cost-Micro</code> ledger.
          Unverified misses always cost 0 Credits — you only pay for verified
          work contacts with a GDPR LIA certificate attached.
        </p>
      </div>
    </div>
  );
}
