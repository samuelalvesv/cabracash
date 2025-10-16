import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EtfDetailsView from "@/features/ranking/components/EtfDetailsView";
import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/features/ranking/server/metricDefinitions";
import type { RankedEtf } from "@/features/ranking/server/types";
import ThemeRegistry from "@/theme/ThemeRegistry";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

function buildEtf(symbol: string): RankedEtf {
  const features: RankedEtf["features"] = {
    expenseRatio: 0.05,
    liquidityComposite: Math.log10(100_000_000),
    holdings: 150,
    assetsLog: Math.log10(700_000_000),
    issuerScore: 92,
    riskAdjustedReturn: 0.7,
    dividendYield: 2.0,
    dividendStability: 0.55,
    trackingEfficiency: 0.012,
    riskBalance: 0.06,
    intradayMomentum: 1.1,
    discountFromHigh: -6,
    distanceFromLow: 11,
    movingAverageCombo: -1.2,
    rsi: 48,
    volumePulse: Math.log1p(1.2),
    momentum1m: 3,
    gapSignal: 0.215,
  };

  const fundamentalsComponents: Record<string, number> = {};
  FUNDAMENTAL_DEFINITIONS.forEach((def) => {
    fundamentalsComponents[def.key] = (def.weight ?? 0) * 75;
  });

  const opportunityComponents: Record<string, number> = {};
  OPPORTUNITY_DEFINITIONS.forEach((def) => {
    opportunityComponents[def.key] = (def.weight ?? 0) * 65;
  });

  const raw = {
    name: "Detalhes ETF",
    assetClass: "Asset Allocation",
    etfCategory: "Global Blend",
    issuer: "BlackRock",
    etfIndex: "MSCI ACWI",
    exchange: "NYSEARCA",
    etfRegion: "Global",
    etfCountry: "United States",
    etfLeverage: "Long",
    optionable: "Yes",
    inceptionDate: "2010-01-01",
    cusip: "123456789",
    isin: "US1234567890",
    tags: "global, allocation",
    assets: 700_000_000,
    holdings: 150,
    price: 60,
    open: 59,
    high: 61,
    low: 58,
    close: 60,
    preClose: 59.5,
    premarketClose: 59.2,
    premarketPrice: 59.8,
    premarketChangePercent: 0.4,
    premarketVolume: 15000,
    afterHoursPrice: 60.5,
    afterHoursChangePercent: 0.25,
    postmarketPrice: 60.3,
    postmarketChangePercent: 0.2,
    postClose: 60.2,
    changeFromOpen: 2,
    daysGap: 1,
    volume: 3_000_000,
    dollarVolume: 180_000_000,
    averageVolume: 2_500_000,
    relativeVolume: 1.3,
    sharesOut: 50_000_000,
    rsi: 48,
    rsiWeekly: 50,
    rsiMonthly: 52,
    atr: 1.1,
    sharpeRatio: 1.0,
    sortinoRatio: 0.7,
    ma20: 58,
    ma20ch: -3,
    ma50: 57,
    ma50ch: -2,
    ma150: 55,
    ma150ch: -1,
    ma200: 54,
    ma200ch: -0.5,
    beta: 1.1,
    peRatio: 20,
    ch1d: 1.1,
    ch1m: 2.3,
    ch3m: 5.2,
    ch6m: 8.4,
    chYTD: 6.1,
    ch1y: 12.5,
    ch3y: 25,
    ch5y: 40,
    ch10y: 80,
    ch15y: 120,
    ch20y: 150,
    tr1m: 3,
    tr3m: 7,
    tr6m: 12,
    trYTD: 9,
    tr1y: 15,
    tr3y: 32,
    tr5y: 60,
    tr10y: 120,
    tr15y: 200,
    tr20y: 260,
    cagr1y: 15,
    cagr3y: 10,
    cagr5y: 8,
    cagr10y: 7,
    cagr15y: 6,
    cagr20y: 5,
    dividendYield: 2,
    dps: 1.2,
    lastDividend: 0.3,
    dividendGrowth: 4,
    dividendGrowthYears: 4,
    divCAGR3: 3,
    divCAGR5: 2.5,
    divCAGR10: 2,
    payoutRatio: 45,
    payoutFrequency: "Quarterly",
    exDivDate: "2025-06-01",
    paymentDate: "2025-06-10",
    low52: 48,
    high52: 70,
    low52ch: 5,
    high52ch: -12,
    allTimeHigh: 80,
    allTimeHighChange: -20,
    allTimeHighDate: "2023-01-01",
    allTimeLow: 30,
    allTimeLowChange: 100,
    allTimeLowDate: "2015-01-01",
  } as RankedEtf["raw"];

  return {
    symbol,
    features,
    scores: {
      fundamentals: 75,
      opportunity: 65,
      final: 0.6 * 75 + 0.4 * 65,
      fundamentalsComponents,
      opportunityComponents,
    },
    raw,
  };
}

describe("EtfDetailsView", () => {
  it("exibe seções principais e score final", () => {
    const etf = buildEtf("ETF1");

    render(
      <ThemeRegistry>
        <EtfDetailsView etf={etf} />
      </ThemeRegistry>,
    );

    expect(screen.getAllByText(/ETF1/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Detalhes ETF/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Score Final/)).toBeInTheDocument();
    expect(screen.getByText(/Componentes de Fundamentos/)).toBeInTheDocument();
    expect(screen.getByText(/Componentes de Oportunidade/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voltar/i })).toBeInTheDocument();
  });
});
