import { notFound } from "next/navigation";

import EtfDetailsView from "@/components/EtfDetailsView";
import { fetchRankedEtfs } from "@/lib/ranking/scoring";

interface EtfPageProps {
  params: {
    symbol: string;
  };
}

export default async function EtfPage({ params }: EtfPageProps) {
  const symbol = params.symbol?.toUpperCase();
  const ranked = await fetchRankedEtfs();
  const etf = ranked.find((item) => item.symbol.toUpperCase() === symbol);

  if (!etf) {
    notFound();
  }

  return <EtfDetailsView etf={etf} />;
}
