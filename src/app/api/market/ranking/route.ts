import { NextResponse } from "next/server";

import { fetchRankedEtfs } from "@/features/ranking/server/scoring";

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
