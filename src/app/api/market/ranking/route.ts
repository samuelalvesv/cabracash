import { NextResponse } from "next/server";

import { fetchRankedEtfs } from "@/features/ranking/server/scoring";
import { MarketDataConnectionError } from "@/services/market-data";

export async function GET() {
  try {
    const ranked = await fetchRankedEtfs();
    return NextResponse.json(
      {
        status: 200,
        data: ranked,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MarketDataConnectionError) {
      return NextResponse.json(
        {
          status: 503,
          error: "Não foi possível se conectar com o servidor de dados de mercado no momento.",
        },
        { status: 503 },
      );
    }

    console.error("Failed to compute ETF ranking", error);
    return NextResponse.json(
      {
        status: 500,
        error: "Unable to compute ETF ranking at the moment.",
      },
      { status: 500 },
    );
  }
}
