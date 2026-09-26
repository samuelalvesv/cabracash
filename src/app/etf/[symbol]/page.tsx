import { notFound } from "next/navigation";

import EtfDetailsView from "@/features/ranking/components/EtfDetailsView";
import { fetchRankedEtfs } from "@/features/ranking/server/scoring";

interface EtfPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default async function EtfPage(props: EtfPageProps) {
  const [params, ranked] = await Promise.all([props.params, fetchRankedEtfs()]);
  const symbol = params.symbol?.toUpperCase();
  const etf = ranked.find((item) => item.symbol.toUpperCase() === symbol);

  if (!etf) {
    notFound();
  }

  return <EtfDetailsView etf={etf} />;
}
