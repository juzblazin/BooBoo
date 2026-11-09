import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CheckoutButton } from "./checkout-button";
import { ToneBadge } from "@/components/ui";

export const metadata = { title: "Pricing" };

const PLANS = [
  {
    id: "free",
    name: "Free Teaser",
    monthly: 0,
    annual: 0,
    tagline: "Taste the magic",
    features: ["1 Spell", "5 Contact Credits", "Full 6-tab report", "CSV export"],
    cta: "Start free",
    href: "/#summon",
  },
  {
    id: "apprentice",
    name: "Starter",
    monthly: 149,
    annual: 129,
    tagline: "For solo founders",
    features: [
      "3 Spells / month",
      "500 Contact Credits",
      "Ad Intelligence",
      "CSV Export",
    ],
  },
  {
    id: "sorcerer",
    name: "Pro",
    monthly: 399,
    annual: 349,
    tagline: "For revenue teams",
    featured: true,
    features: [
      "10 Spells / month",
      "2,500 Contact Credits",
      "250 Direct Dials",
      "90-day Timing & Trends calendar",
      "The GTM Strategy",
      "Rival Watchlists",
      "1-Click CRM / Sequencer Export",
    ],
  },
  {
    id: "coven",
    name: "Agency",
    monthly: 899,
    annual: 749,
    tagline: "Agencies & teams",
    features: [
      "35 Spells / month",
      "10,000 Contact Credits",
      "1,000 Direct Dials",
      "Multi-client sub-workspaces",
      "White-label shareable reports",
      "20% agency rev-share",
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

      <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={cn(
              "glass relative flex flex-col p-6",
              p.featured && "shadow-[0_0_0_0.5px_var(--brand),0_1px_2px_0_rgb(0_0_0/.5),0_3px_4px_-2px_rgb(0_0_0/.4)]",
            )}
          >
            {p.featured && (
              <ToneBadge tone="brand" className="absolute -top-2.5 left-5">
                Most summoned
              </ToneBadge>
            )}
            <h2 className="text-[15px] font-semibold tracking-tight">{p.name}</h2>
            <p className="text-xs text-muted-foreground">{p.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="num text-3xl font-semibold tracking-tight">
                ${p.monthly}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            <p className="num mt-0.5 text-[11px] text-muted-foreground">
              {p.annual ? `$${p.annual}/mo billed annually` : "free forever"}
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
              {p.id === "free" ? (
                <a
                  href="/#summon"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-card text-sm font-medium shadow-[var(--shadow-button)] transition-all hover:bg-muted active:scale-[0.97]"
                >
                  Start free
                </a>
              ) : (
                <CheckoutButton plan={p.id} featured={p.featured} />
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
