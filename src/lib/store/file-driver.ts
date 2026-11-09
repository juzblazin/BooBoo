import type {
  Buyer,
  CovenTrialResult,
  GrimoireSpell,
  OracleEvent,
  Watchlist,
  Workspace,
} from "@/lib/types";
import type {
  DomainCacheEntry,
  LedgerEntry,
  StoreDriver,
  TeleportIntegration,
} from "./types";

/** JSON-file store used when DATABASE_URL is not configured. Dev/demo only. */

interface FileData {
  workspaces: Record<string, Workspace>;
  spells: Record<string, GrimoireSpell>;
  buyers: Record<string, Record<string, Buyer>>;
  covens: Record<string, CovenTrialResult & { sparring?: { role: string; text: string; at: string }[] }>;
  domainCache: Record<string, DomainCacheEntry & { expiresAt: string }>;
  oracleEvents: { events: OracleEvent[]; expiresAt: string } | null;
  watchlists: Record<string, Watchlist>;
  integrations: Record<string, TeleportIntegration>;
  ledger: LedgerEntry[];
}

const FILE = ".boo-data/store.json";
let cache: FileData | null = null;

async function load(): Promise<FileData> {
  if (cache) return cache;
  const fs = await import("node:fs/promises");
  try {
    cache = JSON.parse(await fs.readFile(FILE, "utf8")) as FileData;
  } catch {
    cache = {
      workspaces: {},
      spells: {},
      buyers: {},
      covens: {},
      domainCache: {},
      oracleEvents: null,
      watchlists: {},
      integrations: {},
      ledger: [],
    };
  }
  return cache!;
}

async function persist() {
  const fs = await import("node:fs/promises");
  await fs.mkdir(".boo-data", { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache, null, 2));
}

export const fileDriver: StoreDriver = {
  async getWorkspace(id) {
    return (await load()).workspaces[id] ?? null;
  },
  async putWorkspace(w) {
    (await load()).workspaces[w.id] = w;
    await persist();
  },

  async getSpell(id) {
    return (await load()).spells[id] ?? null;
  },
  async getSpellBySlug(slug) {
    const d = await load();
    return Object.values(d.spells).find((s) => s.publicShareSlug === slug) ?? null;
  },
  async putSpell(s) {
    (await load()).spells[s.id] = s;
    await persist();
  },
  async listSpells(workspaceId) {
    const d = await load();
    return Object.values(d.spells)
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async putBuyers(spellId, buyers) {
    const d = await load();
    d.buyers[spellId] ??= {};
    for (const b of buyers) d.buyers[spellId][b.id] = b;
    await persist();
  },
  async listBuyers(spellId) {
    const d = await load();
    return Object.values(d.buyers[spellId] ?? {}).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  },
  async putBuyer(spellId, b) {
    const d = await load();
    d.buyers[spellId] ??= {};
    d.buyers[spellId][b.id] = b;
    await persist();
  },

  async putCoven(spellId, c) {
    const d = await load();
    d.covens[spellId] = { ...c, sparring: d.covens[spellId]?.sparring ?? [] };
    await persist();
  },
  async getSparring(spellId) {
    return (await load()).covens[spellId]?.sparring ?? [];
  },
  async pushSparring(spellId, msg) {
    const d = await load();
    d.covens[spellId] ??= { corpus: { sitesScraped: 0, transcripts: 0, reviews: 0, threads: 0 }, truths: [], orthodoxies: [], debate: [], hypothesis: { wedge: "", positioning: "", icpNarrowing: "", offer: "", momTestQuestions: [] }, sparring: [] };
    d.covens[spellId].sparring!.push(msg);
    await persist();
  },

  async getDomainCache(domain) {
    const d = await load();
    const e = d.domainCache[domain];
    if (!e || e.expiresAt < new Date().toISOString()) return null;
    return e;
  },
  async putDomainCache(domain, data) {
    const d = await load();
    d.domainCache[domain] = {
      ...data,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
    await persist();
  },

  async getOracleEvents() {
    const d = await load();
    if (!d.oracleEvents || d.oracleEvents.expiresAt < new Date().toISOString()) return null;
    return d.oracleEvents.events;
  },
  async putOracleEvents(events) {
    const d = await load();
    d.oracleEvents = {
      events,
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    };
    await persist();
  },

  async listWatchlists(workspaceId) {
    const d = await load();
    return Object.values(d.watchlists)
      .filter((w) => w.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async putWatchlist(w) {
    (await load()).watchlists[w.id] = w;
    await persist();
  },

  async listIntegrations(workspaceId) {
    const d = await load();
    return Object.values(d.integrations).filter((i) => i.workspaceId === workspaceId);
  },
  async putIntegration(i) {
    (await load()).integrations[i.id] = i;
    await persist();
  },

  async addLedger(e) {
    (await load()).ledger.push(e);
    await persist();
  },
  async ledgerFor(workspaceId) {
    const d = await load();
    return d.ledger.filter((l) => l.workspaceId === workspaceId).reverse();
  },
};
