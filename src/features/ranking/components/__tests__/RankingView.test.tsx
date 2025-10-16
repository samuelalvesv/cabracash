import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RankingView from "@/features/ranking/components/RankingView";
import * as filterStorage from "@/features/ranking/components/rankingFilterStorage";
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

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});
function buildSampleEtf(symbol: string): RankedEtf {
  const features: RankedEtf["features"] = {
    expenseRatio: 0.05,
    liquidityComposite: Math.log10(100_000_000),
    holdings: 200,
    assetsLog: Math.log10(500_000_000),
    issuerScore: 95,
    riskAdjustedReturn: 0.75,
    dividendYield: 2.5,
    dividendStability: 0.6,
    trackingEfficiency: 0.01,
    riskBalance: 0.08,
    intradayMomentum: 1.2,
    discountFromHigh: -4,
    distanceFromLow: 10,
    movingAverageCombo: -1.5,
    rsi: 45,
    volumePulse: Math.log1p(1.5),
    momentum1m: 4,
    gapSignal: 0.25,
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
      final: 0.55 * 80 + 0.45 * 70,
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
      trackingDifference: 0.4,
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

  it("aplica filtros iniciais de score mínimo", () => {
    const strong = buildSampleEtf("AAA");
    const weak = buildSampleEtf("BBB");
    weak.scores = {
      ...weak.scores,
      fundamentals: 40,
      opportunity: 30,
      final: 0.55 * 40 + 0.45 * 30,
    };

    render(
      <ThemeRegistry>
        <RankingView
          items={[strong, weak]}
          pageSize={12}
          initialPage={1}
          initialMinFundamentals={70}
          initialMinOpportunity={0}
        />
      </ThemeRegistry>,
    );

    expect(screen.getAllByText(/AAA/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/BBB/)).toBeNull();
    expect(screen.queryByText(/Nenhum ETF encontrado/)).toBeNull();
  });

  it("restaura filtros salvos quando não há parâmetros na URL", async () => {
    const first = buildSampleEtf("AAA");
    const second = buildSampleEtf("BBB");

    window.sessionStorage.setItem(
      "ranking:filters",
      JSON.stringify({
        page: 2,
        search: "BBB",
        minFundamentals: 65,
        minOpportunity: 45,
      }),
    );

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    render(
      <ThemeRegistry>
        <RankingView items={[first, second]} pageSize={1} initialPage={1} />
      </ThemeRegistry>,
    );

    expect(replaceStateSpy).toHaveBeenCalled();
    const updatedUrls = replaceStateSpy.mock.calls.map((call) => call[2] as string);
    expect(updatedUrls.some((url) => url?.includes("search=BBB"))).toBe(true);
    expect(updatedUrls.some((url) => url?.includes("minFundamentals=65"))).toBe(true);
    expect(updatedUrls.some((url) => url?.includes("minOpportunity=45"))).toBe(true);
    expect(updatedUrls.some((url) => url?.includes("page=2"))).toBe(true);
  });

  it("permite limpar filtros ativos de forma rápida", async () => {
    const first = buildSampleEtf("AAA");
    const second = buildSampleEtf("BBB");

    const saveSpy = vi.spyOn(filterStorage, "saveRankingFilters");

    render(
      <ThemeRegistry>
        <RankingView
          items={[first, second]}
          pageSize={12}
          initialPage={1}
          initialSearch="BBB"
          initialMinFundamentals={60}
          initialMinOpportunity={40}
        />
      </ThemeRegistry>,
    );

    const clearButtons = screen.getAllByRole("button", { name: /limpar filtros/i });
    fireEvent.click(clearButtons[clearButtons.length - 1]);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith({ page: 1, search: "", minFundamentals: 0, minOpportunity: 0 });
    });
  });
});
