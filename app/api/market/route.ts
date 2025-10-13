import { NextResponse } from "next/server";

import { fetchMarketData } from "@/lib/marketData";

export async function GET() {
  try {
    const payload = await fetchMarketData();
    const status =
      typeof payload.status === "number" && payload.status >= 100 && payload.status <= 599
        ? payload.status
        : 200;

    return NextResponse.json(payload, { status });
  } catch (error) {
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
