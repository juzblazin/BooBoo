import { NextRequest } from "next/server";
import { jobEvents, subscribe, startCastJob } from "@/lib/jobs";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** "The Cauldron" — SSE progress stream for a brewing spell.
 *  Replays persisted progress, tails the live job, closes on completion.
 *  If the process restarted mid-brew the pipeline is transparently resumed. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const spell = await store.getSpell(id);
  if (!spell) {
    return new Response("spell not found", { status: 404 });
  }

  // Self-heal: a brewing spell with no live job means the process restarted.
  if (spell.status === "brewing" && jobEvents(id).events.length === 0) {
    startCastJob(spell);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      let closed = false;
      let unsub: () => void = () => {};
      let pulse: ReturnType<typeof setInterval> | null = null;
      const close = () => {
        if (closed) return;
        closed = true;
        unsub();
        if (pulse) clearInterval(pulse);
        try {
          controller.close();
        } catch {}
      };

      // Replay everything we already know (job memory, else DB progress).
      const mem = jobEvents(id);
      const replay = mem.events.length ? mem.events : spell.progress;
      for (const ev of replay) send("progress", ev);

      if (spell.status === "ready" || spell.status === "failed" || mem.done) {
        send("done", { status: spell.status, error: spell.error ?? null });
        close();
        return;
      }

      unsub = subscribe(id, (ev) => send("progress", ev));

      // Watch for completion without relying solely on push events.
      pulse = setInterval(async () => {
        const j = jobEvents(id);
        if (j.done) {
          const fresh = await store.getSpell(id);
          send("done", { status: fresh?.status ?? "ready", error: fresh?.error ?? j.failed ?? null });
          close();
        }
      }, 700);

      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
