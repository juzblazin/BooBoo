"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function CheckoutButton({
  plan,
  label,
  featured,
}: {
  plan: string;
  label: string;
  featured?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = await res.json();
      if (d.url) {
        if (d.url.startsWith("http")) window.location.href = d.url;
        else {
          router.push(d.url);
          router.refresh();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={checkout}
      disabled={busy}
      className={cn(
        "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50",
        featured
          ? "bg-brand text-brand-foreground shadow-[var(--shadow-primary)] hover:bg-brand/90"
          : "bg-card shadow-[var(--shadow-button)] hover:bg-muted",
      )}
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      Upgrade to {label}
    </button>
  );
}
