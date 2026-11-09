"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const SUGGESTIONS = ["yourdomain.com", "hubspot.com", "clay.com", "apollo.io"];

export function SummonForm({
  size = "lg",
  className,
  autoFocus,
}: {
  size?: "lg" | "sm";
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(q)) {
      setError("Enter a valid domain — e.g. yourdomain.com");
      return;
    }
    router.push(`/summon?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={submit}
        className={cn(
          "glass relative flex w-full flex-col rounded-2xl",
          size === "lg" ? "min-h-[64px] px-4 py-3 pr-[130px]" : "px-3 py-2 pr-[110px]",
        )}
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          autoFocus={autoFocus}
          placeholder="yourdomain.com"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          aria-label="Your domain or business idea"
          className={cn(
            "w-full flex-1 bg-transparent tracking-tight outline-none placeholder:text-muted-foreground/50",
            size === "lg" ? "text-[16px]" : "text-sm",
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary font-medium text-primary-foreground shadow-[var(--shadow-primary)] transition-all duration-150 ease-[cubic-bezier(.23,1,.32,1)] hover:opacity-90 active:scale-[0.97]",
            size === "lg" ? "h-9 px-4 text-sm" : "h-8 px-3.5 text-[13px]",
          )}
        >
          <Sparkles className="size-3.5" />
          Cast a Spell
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-[var(--hex)]">{error}</p>}

      {size === "lg" && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                router.push(`/summon?q=${encodeURIComponent(s)}`);
              }}
              className="h-9 rounded-full border border-border/70 px-4 text-[13px] text-muted-foreground shadow-[var(--shadow-button)] transition-colors hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
