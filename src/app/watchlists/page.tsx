import { Eye } from "lucide-react";
import { currentWorkspace, store } from "@/lib/store";
import { WatchlistClient } from "./watchlist-client";

export const metadata = { title: "Hex Watchlists" };
export const dynamic = "force-dynamic";

export default async function WatchlistsPage() {
  const ws = await currentWorkspace();
  const watchlists = await store.listWatchlists(ws.id);
  return (
    <div className="container-page py-10">
      <div className="max-w-xl">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Eye className="size-5 text-brand" />
          Hex Watchlists
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Daily 06:00 UTC diff-detection — pricing changes, new ad launches and
          fresh 1-star reviews on your rivals, pushed to Slack or email with 10
          pre-matched buyers.
        </p>
      </div>
      <WatchlistClient initial={watchlists} />
    </div>
  );
}
