import { NextResponse } from "next/server";

import { fetchMarketData, MarketDataConnectionError } from "@/services/market-data";

export async function GET() {
  try {
    const payload = await fetchMarketData();
    return NextResponse.json(payload, { status: 200 });
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

    console.error("Market data fetch failed", error);
    return NextResponse.json(
      {
        status: 500,
        error: "Unable to retrieve market data at the moment.",
      },
      { status: 500 },
    );
  }
}
