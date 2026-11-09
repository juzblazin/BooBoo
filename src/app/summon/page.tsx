import { Suspense } from "react";
import { SummonClient } from "./summon-client";

export const metadata = { title: "Summon Rivals" };

export default function SummonPage() {
  return (
    <Suspense>
      <SummonClient />
    </Suspense>
  );
}
