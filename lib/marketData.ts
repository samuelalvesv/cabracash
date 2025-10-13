const STOCK_ANALYSIS_ENDPOINT =
  "https://stockanalysis.com/api/screener/e/bd/name+open+low+high+close+premarketPrice+premarketChangePercent+preClose+premarketVolume+postmarketPrice+postmarketChangePercent+postClose+low52+high52+dollarVolume+averageVolume+relativeVolume+daysGap+changeFromOpen+expenseRatio+etfCategory+issuer+etfIndex+inceptionDate+peRatio+beta+rsi+rsiWeekly+rsiMonthly+atr+sharpeRatio+sortinoRatio+dps+lastDividend+dividendYield+dividendGrowth+dividendGrowthYears+divCAGR3+divCAGR5+divCAGR10+payoutRatio+payoutFrequency+exDivDate+paymentDate+exchange+etfRegion+etfCountry+etfLeverage+optionable+sharesOut+ch1m+ch3m+ch6m+chYTD+ch1y+ch3y+ch5y+ch10y+ch15y+ch20y+tr1m+tr3m+tr6m+trYTD+tr1y+tr3y+tr5y+tr10y+tr15y+tr20y+cagr1y+cagr3y+cagr5y+cagr10y+cagr15y+cagr20y+low52ch+high52ch+allTimeHigh+allTimeHighChange+allTimeHighDate+allTimeLow+allTimeLowChange+allTimeLowDate+tags+ma20+ma50+ma150+ma200+ma20ch+ma50ch+ma150ch+ma200ch+cusip+isin.json";

export interface MarketApiResponse {
  status: number;
  data: {
    data: Record<string, Record<string, number | string | null>>;
  };
}

export async function fetchMarketData(init?: RequestInit): Promise<MarketApiResponse> {
  const response = await fetch(STOCK_ANALYSIS_ENDPOINT, {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.statusText}`);
  }

  return (await response.json()) as MarketApiResponse;
}
