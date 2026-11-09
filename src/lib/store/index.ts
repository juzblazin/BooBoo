import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { hasDb } from "@/db";
import { neonDriver } from "./neon-driver";
import { fileDriver } from "./file-driver";
import type { StoreDriver } from "./types";
import type { Workspace } from "@/lib/types";

export const store: StoreDriver = hasDb ? neonDriver : fileDriver;

export const WORKSPACE_COOKIE = "boo_ws";

export const PLAN_LIMITS: Record<
  Workspace["planTier"],
  { spellsPerMonth: number; elixirs: number; directDials: number; label: string }
> = {
  free: { spellsPerMonth: 1, elixirs: 5, directDials: 0, label: "Free Teaser" },
  apprentice: { spellsPerMonth: 3, elixirs: 500, directDials: 0, label: "Starter" },
  sorcerer: { spellsPerMonth: 10, elixirs: 2500, directDials: 250, label: "Pro" },
  coven: { spellsPerMonth: 35, elixirs: 10000, directDials: 1000, label: "Agency" },
};

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
      planTier: "free",
      spellsBalance: PLAN_LIMITS.free.spellsPerMonth,
      spellsUsed: 0,
      elixirCreditsBalance: PLAN_LIMITS.free.elixirs,
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
