import { GhostHero } from "@/components/ghost";
import { SummonForm } from "@/components/summon-form";

export default function Home() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="summon" className="nesh-sky relative overflow-hidden">
        <div className="nesh-stars" aria-hidden />
        <div className="container-page relative flex min-h-[88vh] flex-col items-center justify-center pb-24 pt-16 text-center">
          <div className="nesh-orb">
            <GhostHero size={132} />
          </div>
          <h1 className="mt-8 text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Hello, I&apos;m Boo.
          </h1>
          <p className="mt-3 max-w-md text-balance text-[15px] leading-relaxed text-[#b794ff]">
            The smart assistant for B2B strategy.
          </p>
          <p className="mt-1.5 max-w-md text-balance text-[13px] leading-relaxed text-muted-foreground">
            Drop your domain or a rival&apos;s — I&apos;ll map the
            competition and summon your buyers in 60 seconds.
          </p>
          <SummonForm className="mt-9 w-full max-w-lg" autoFocus />
          <p className="mt-4 text-xs text-muted-foreground">
            Free teaser: 1 Spell + 5 Credits. No card required.
          </p>
          <a
            href="#how"
            className="nesh-scroll mt-10 grid size-10 place-items-center rounded-full border border-[#b794ff]/40 text-[#b794ff]"
            aria-label="Scroll to how it works"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </a>
        </div>
      </section>

      <div className="pb-4" />
    </div>
  );
}
