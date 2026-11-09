import Link from "next/link";
import { BooMark } from "./salem";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#summon", label: "Summon Rivals" },
      { href: "/grimoire", label: "My Reports" },
      { href: "/watchlists", label: "Hex Watchlists" },
      { href: "/export", label: "Export to Stack" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/#how", label: "How it works" },
      { href: "/#lexicon", label: "The Lexicon" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { href: "/export", label: "GDPR Art. 6(1)(f) LIA" },
      { href: "/pricing", label: "Credit Credits" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <BooMark size={56} />
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Wickedly smart B2B strategy. Zero cold-email spam — Boo never sends
            a single message. It just tells you who to call, when, and why.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {col.title}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex h-12 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Boo. No spells were harmed.</span>
          <span className="num">85%+ gross margin by design</span>
        </div>
      </div>
    </footer>
  );
}
