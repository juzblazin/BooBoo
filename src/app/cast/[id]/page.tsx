import { CauldronClient } from "./cauldron-client";

export const metadata = { title: "Analyzing" };

export default async function CastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CauldronClient spellId={id} />;
}
