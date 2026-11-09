"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/** React Bits-style ReflectiveCard — specular sheen + subtle tilt that
 *  follows the pointer across the card surface. */
export function ReflectiveCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--rx", `${(y / r.height - 0.5) * -7}deg`);
    el.style.setProperty("--ry", `${(x / r.width - 0.5) * 7}deg`);
    el.style.setProperty("--mx", `${(x / r.width) * 100}%`);
    el.style.setProperty("--my", `${(y / r.height) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "-120%");
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("reflective-card glass relative overflow-hidden", className)}
      style={{
        transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
        transition: "transform 250ms cubic-bezier(.23,1,.32,1)",
      }}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, -120%), rgb(183 148 255 / 0.22), transparent 65%)",
          transition: "background-position 200ms",
        }}
      />
    </div>
  );
}
