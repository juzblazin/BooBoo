import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { GrimoireClient } from "./grimoire-client";

export const metadata = { title: "My Reports" };

export const dynamic = "force-dynamic";

export default async function SpellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spell = await store.getSpell(id);
  if (!spell) notFound();
  const buyers = await store.listBuyers(id);
  return <GrimoireClient spell={spell} buyers={buyers} />;
}
