import { cn } from "@/lib/cn";
import type { SalemState } from "@/lib/types";

/** Salem — the geometric black-cat mascot.
 *  Four states: idle (blinking violet eyes), stalking (prowl), brewing
 *  (cauldron bubbles), summoned (holding the golden key). */
export function Salem({
  state = "idle",
  className,
  size = 96,
}: {
  state?: SalemState;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn("relative inline-block", state === "stalking" && "salem-prowl", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Salem the cat — ${state}`}
    >
      <svg viewBox="0 0 96 96" width={size} height={size} fill="none">
        {/* tail */}
        <path
          className="salem-tail"
          d="M78 74c8-2 12-8 10-16-1-4-5-7-9-6"
          stroke="#1c1c22"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* body */}
        <path
          d="M22 88V64c0-14 11-26 26-26s26 12 26 26v24H22Z"
          fill="#17171c"
        />
        {/* chest highlight */}
        <path
          d="M30 88V68c0-10 8-20 18-20s18 10 18 20v20H30Z"
          fill="#1d1d24"
        />
        {/* ears */}
        <path d="M28 42 24 22l16 10-12 10Z" fill="#17171c" />
        <path d="M68 42l4-20-16 10 12 10Z" fill="#17171c" />
        <path d="M29.5 36 27 27l9 6-6.5 3Z" fill="#2a2038" />
        <path d="M66.5 36 69 27l-9 6 6.5 3Z" fill="#2a2038" />
        {/* head */}
        <circle cx="48" cy="46" r="22" fill="#17171c" />
        {/* eyes */}
        <g className="salem-eyes">
          <ellipse cx="40" cy="44" rx="4.2" ry="4.8" fill="#8b5cf6" />
          <ellipse cx="56" cy="44" rx="4.2" ry="4.8" fill="#8b5cf6" />
          <ellipse cx="40" cy="44" rx="1.4" ry="3" fill="#0b0b0e" />
          <ellipse cx="56" cy="44" rx="1.4" ry="3" fill="#0b0b0e" />
        </g>
        {/* nose + mouth */}
        <path d="M46 52h4l-2 3-2-3Z" fill="#3f3f4a" />
        <path
          d="M42 57c2 2 4 2 6 0 2 2 4 2 6 0"
          stroke="#3f3f4a"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* whiskers */}
        <path d="M24 50h10M26 55l9-2" stroke="#2a2a33" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M72 50H62M70 55l-9-2" stroke="#2a2a33" strokeWidth="1.2" strokeLinecap="round" />

        {state === "summoned" && (
          <g className="float-key">
            <circle cx="76" cy="20" r="4.5" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M79 23l8 8m-3-1-3 3m6-6-3 3" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {state === "brewing" && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2" aria-hidden>
          <svg width={size * 0.62} height={size * 0.34} viewBox="0 0 60 34">
            <ellipse className="brew-glow" cx="30" cy="12" rx="24" ry="7" fill="#8b5cf6" opacity="0.5" />
            <path d="M6 12h48v4c0 10-10 18-24 18S6 26 6 16v-4Z" fill="#101014" stroke="#2a2a33" />
            <circle className="animate-[brew-bubble_1.8s_ease-in_infinite]" cx="22" cy="8" r="2.4" fill="#10b981" />
            <circle className="animate-[brew-bubble_1.8s_ease-in_0.5s_infinite]" cx="30" cy="9" r="1.8" fill="#8b5cf6" />
            <circle className="animate-[brew-bubble_1.8s_ease-in_1s_infinite]" cx="38" cy="8" r="2" fill="#f59e0b" />
          </svg>
        </div>
      )}
    </div>
  );
}

/** The Boo ghost mark — rounded app-icon tile. */
export function BooMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Boo"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-[22%]", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Four-point sparkle mark — the Boo glyph. */
export function SparkMark({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 1.5c.7 5.8 4.7 9.8 10.5 10.5-5.8.7-9.8 4.7-10.5 10.5-.7-5.8-4.7-9.8-10.5-10.5C7.3 11.3 11.3 7.3 12 1.5Z" />
    </svg>
  );
}
