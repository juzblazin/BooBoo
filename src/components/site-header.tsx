import Link from "next/link";
import { FlaskConical, Sparkles } from "lucide-react";
import { BooMark } from "./salem";
import { currentWorkspace, PLAN_LIMITS } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/grimoire", label: "My Reports" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/export", label: "Export" },
  { href: "/pricing", label: "Pricing" },
];

export async function SiteHeader() {
  let ws = null;
  try {
    ws = await currentWorkspace();
  } catch {}

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px glow-line"
        aria-hidden="true"
      />
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Boo home">
          <BooMark size={56} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-brand/10 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {ws && (
            <div className="hidden items-center gap-1.5 sm:flex" aria-label="Workspace balances">
              <Badge variant="secondary" className="gap-1">
                <Sparkles />
                <span className="num">{Math.max(0, ws.spellsBalance - ws.spellsUsed)}</span>
                <span className="text-muted-foreground">spells</span>
              </Badge>
              <Badge variant="success" className="gap-1">
                <FlaskConical />
                <span className="num">{ws.elixirCreditsBalance}</span>
                <span className="text-muted-foreground">credits</span>
              </Badge>
              <Badge variant="brand">{PLAN_LIMITS[ws.planTier].label}</Badge>
            </div>
          )}
          <Link
            href="/#summon"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-medium text-brand-foreground shadow-[var(--shadow-primary)] transition-all duration-150 ease-[cubic-bezier(.23,1,.32,1)] hover:bg-brand/90 active:scale-[0.97]"
          >
            Cast a Spell
          </Link>
        </div>
      </div>
    </header>
  );
}
