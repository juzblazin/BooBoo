import { cn } from "@/lib/cn";

const GHOST =
  "M60 10C38 10 26 30 26 54L26 92C26 97 29.5 99 33 96.5C37.5 93.5 40.5 101 47 101C53.5 101 55.5 94.5 62 98.5C65 100.5 68 99.5 70 97.5C74.5 93.5 78 101 84.5 101C91 101 93.5 93.5 97.5 96.5C101 99 104.5 97 104.5 92L104.5 54C104.5 30 82 10 60 10Z";

/** The Boo ghost as live SVG — rainbow ring, white body, black outline,
 *  and eyes that glance left and right. Floats via .ghost-float. */
export function GhostHero({
  size = 132,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("ghost-float", className)}
      style={{ width: size, height: size, filter: "drop-shadow(0 10px 20px rgb(0 0 0 / 0.5))" }}
      role="img"
      aria-label="Boo the ghost"
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <linearGradient id="boo-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="30%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="78%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#d9f74a" />
          </linearGradient>
        </defs>
        {/* rainbow ring peeking out behind the body */}
        <path d={GHOST} fill="url(#boo-ring)" transform="translate(-3 3) scale(1.07)" transform-origin="60 60" />
        {/* white ghost with black outline */}
        <path d={GHOST} fill="#ffffff" stroke="#0a0a0b" strokeWidth="7" strokeLinejoin="round" />
        {/* eyes — glance left / right / center */}
        <g className="ghost-eyes-look">
          <ellipse cx="45" cy="52" rx="6.5" ry="9" fill="#0a0a0b" />
          <ellipse cx="71" cy="52" rx="6.5" ry="9" fill="#0a0a0b" />
        </g>
      </svg>
    </div>
  );
}
