import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { hasDb } from "@/db";
import { neonDriver } from "./neon-driver";
import { fileDriver } from "./file-driver";
import type { StoreDriver } from "./types";
import { PLANS } from "@/lib/plans";
import type { Workspace } from "@/lib/types";

export const store: StoreDriver = hasDb ? neonDriver : fileDriver;

export const WORKSPACE_COOKIE = "boo_ws";

export { PLANS } from "@/lib/plans";

/** Anonymous workspace identity — a `boo_ws` cookie maps to a workspaces row.
 *  Neon Auth (Managed Better Auth) can replace this when auth is provisioned. */
export async function currentWorkspace(): Promise<Workspace> {
  const jar = await cookies();
  let id = jar.get(WORKSPACE_COOKIE)?.value;
  let ws = id ? await store.getWorkspace(id) : null;
  if (!ws) {
    // Keep the cookie id stable so the browser's identity persists.
    id = id ?? `ws_${randomUUID()}`;
    ws = {
      id,
      name: "My Workspace",
      planTier: "FREE_TRIAL",
      maxCompetitorsPerTask: PLANS.FREE_TRIAL.maxCompetitorsPerTask,
      freeTrialConsumed: false,
      monthlyTaskRunsRemaining: PLANS.FREE_TRIAL.monthlyTaskRuns,
      spellsUsed: 0,
      elixirCreditsBalance: PLANS.FREE_TRIAL.elixirs,
      parentAgencyWorkspaceId: null,
      whitelabel: null,
      createdAt: new Date().toISOString(),
    };
    await store.putWorkspace(ws);
  }
  return ws;
}

export async function setWorkspaceCookie(id: string) {
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
