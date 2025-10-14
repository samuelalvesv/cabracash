import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RankingView from "@/components/RankingView";
import ThemeRegistry from "@/components/ThemeRegistry";
import type { RankedEtf } from "@/lib/ranking/types";
import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/lib/ranking/metricDefinitions";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

function buildSampleEtf(symbol: string): RankedEtf {
  const features: RankedEtf["features"] = {
    expenseRatio: 0.05,
    dollarVolume: Math.log10(100_000_000),
    volumeLog: Math.log10(2_000_000),
    holdings: 200,
    assetsLog: Math.log10(500_000_000),
    issuerScore: 95,
    sharpeRatio: 1.1,
    sortinoRatio: 0.8,
    dividendYield: 2.5,
    dividendGrowthYears: 5,
    dividendGrowth: 3,
    betaDeviation: 0.1,
    atrRatio: 0.02,
    ch1d: 1.2,
    top52Distance: -4,
    bottom52Distance: 10,
    movingAverageCombo: -1.5,
    rsi: 45,
    relativeVolume: Math.log1p(1.5),
    totalReturn1m: 4,
    premarketChangePercent: 0.3,
    afterHoursChangePercent: 0.2,
  };

  const fundamentalsComponents: Record<string, number> = {};
  FUNDAMENTAL_DEFINITIONS.forEach((def) => {
    fundamentalsComponents[def.key] = (def.weight ?? 0) * 80;
  });

  const opportunityComponents: Record<string, number> = {};
  OPPORTUNITY_DEFINITIONS.forEach((def) => {
    opportunityComponents[def.key] = (def.weight ?? 0) * 70;
  });

  return {
    symbol,
    features,
    scores: {
      fundamentals: 80,
      opportunity: 70,
      final: 0.6 * 80 + 0.4 * 70,
      fundamentalsComponents,
      opportunityComponents,
    },
    raw: {
      name: "Sample ETF",
      assetClass: "Equity",
      etfCategory: "Large Blend",
      issuer: "Vanguard",
      exchange: "NYSEARCA",
      dollarVolume: 100_000_000,
      volume: 2_000_000,
      holdings: 200,
      assets: 500_000_000,
      sharpeRatio: 1.1,
      sortinoRatio: 0.8,
      dividendYield: 2.5,
      dividendGrowthYears: 5,
      dividendGrowth: 3,
      beta: 1.1,
      atr: 2,
      close: 50,
      open: 48,
      preClose: 49,
      high52ch: -4,
      low52ch: 10,
      ma20: 49,
      ma20ch: -2,
      ma50: 47,
      ma50ch: -3,
      ma150: 45,
      ma150ch: -5,
      ma200: 44,
      ma200ch: -6,
      rsi: 45,
      relativeVolume: 1.5,
      tr1m: 4,
      changeFromOpen: 1.5,
      ch1d: 1.2,
      premarketChangePercent: 0.3,
      afterHoursChangePercent: 0.2,
    } as RankedEtf["raw"],
  };
}

describe("RankingView", () => {
  it("renderiza cards com dados principais", () => {
    const etf = buildSampleEtf("AAA");

    render(
      <ThemeRegistry>
        <RankingView items={[etf]} pageSize={12} initialPage={1} />
      </ThemeRegistry>,
    );

    expect(screen.getByText(/AAA/)).toBeInTheDocument();
    expect(screen.getByText(/Sample ETF/)).toBeInTheDocument();
    expect(screen.getAllByText(/Fundamentos/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Oportunidade/)[0]).toBeInTheDocument();
  });
});
