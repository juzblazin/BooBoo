import { cn } from "@/lib/cn";
import { Badge as ShadBadge, type BadgeProps } from "@/components/ui/badge";

const toneMap: Record<string, BadgeProps["variant"]> = {
  neutral: "outline",
  brand: "brand",
  emerald: "success",
  amber: "warning",
  crimson: "destructive",
  info: "info",
  dark: "secondary",
};

export function ToneBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <ShadBadge variant={toneMap[tone]} className={className}>
      {children}
    </ShadBadge>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Circular /100 score badge — the data-dense readiness + CRS meter. */
export function ScoreBadge({
  score,
  size = 44,
  className,
  tone,
}: {
  score: number;
  size?: number;
  className?: string;
  tone?: "auto" | "brand";
}) {
  const color =
    tone === "brand"
      ? "var(--brand)"
      : score >= 75
        ? "var(--potion)"
        : score >= 50
          ? "var(--cauldron)"
          : "var(--hex)";
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in srgb, currentColor 12%, transparent)"
          strokeWidth={3}
          className="text-muted-foreground"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, score)) / 100)}
        />
      </svg>
      <span className="num absolute text-[11px] font-semibold" style={{ color }}>
        {score}
      </span>
    </span>
  );
}

export function Stat({
  value,
  label,
  tone,
  className,
}: {
  value: React.ReactNode;
  label: string;
  tone?: "emerald" | "amber" | "crimson";
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className={cn("num text-2xl font-semibold tracking-tight", tone && {
          "text-[var(--potion)]": tone === "emerald",
          "text-[var(--cauldron)]": tone === "amber",
          "text-[var(--hex)]": tone === "crimson",
        })}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">{label}</div>
    </div>
  );
}

const PLATFORM_STYLE: Record<string, string> = {
  meta: "text-[#7aa5ff]",
  linkedin: "text-[#6db6ff]",
  google: "text-[#ffb45e]",
  tiktok: "text-[#ff7aa5]",
};

export function PlatformChip({ platform }: { platform: string }) {
  const label =
    platform === "meta" ? "Meta" : platform === "linkedin" ? "LinkedIn" : platform === "google" ? "Google" : "TikTok";
  return (
    <ToneBadge tone="dark" className={cn("gap-1", PLATFORM_STYLE[platform])}>
      {label}
    </ToneBadge>
  );
}

const KIND_TONE = { direct: "crimson", search: "amber", paid: "info" } as const;
const KIND_LABEL = { direct: "Direct rival", search: "Search rival", paid: "Paid ad rival" } as const;

export function RivalKindChip({ kind }: { kind: keyof typeof KIND_TONE }) {
  return <ToneBadge tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</ToneBadge>;
}

/** Monogram tile for a domain. */
export function DomainMark({
  domain,
  size = 32,
  className,
}: {
  domain: string;
  size?: number;
  className?: string;
}) {
  const hue = [...domain].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-md text-[13px] font-semibold", className)}
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, oklch(0.55 0.18 ${hue}) 24%, var(--card))`,
        color: `oklch(0.8 0.12 ${hue})`,
        boxShadow: "var(--shadow-button)",
      }}
      aria-hidden
    >
      {domain.replace(/^www\./, "")[0]?.toUpperCase()}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
