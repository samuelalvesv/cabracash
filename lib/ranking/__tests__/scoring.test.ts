import { describe, expect, it } from "vitest";

import { scoreEtfs } from "@/lib/ranking/scoring";
import type { EtfEntry } from "@/lib/ranking/types";

const baseMetrics = {
  atr: 1.2,
  close: 100,
  open: 99.5,
  preClose: 99.2,
  high52ch: -5,
  low52ch: 12,
  ma20ch: -1,
  ma50ch: -1.5,
  ma200ch: -2,
  rsi: 45,
  relativeVolume: 1.5,
  tr1m: 3,
  changeFromOpen: 0.5,
};

describe("scoreEtfs", () => {
  it("ordenates ETFs por score final", () => {
    const entries: EtfEntry[] = [
      {
        symbol: "AAA",
        metrics: {
          ...baseMetrics,
          expenseRatio: 0.05,
          dollarVolume: 100_000_000,
          issuer: "Vanguard",
          sharpeRatio: 1.2,
          sortinoRatio: 0.9,
          dividendYield: 2.5,
          dividendGrowthYears: 5,
          dividendGrowth: 4,
          beta: 0.95,
        },
      },
      {
        symbol: "BBB",
        metrics: {
          ...baseMetrics,
          expenseRatio: 0.35,
          dollarVolume: 1_000_000,
          issuer: "GraniteShares",
          sharpeRatio: -0.2,
          sortinoRatio: -0.1,
          dividendYield: 1.2,
          dividendGrowthYears: 1,
          dividendGrowth: -5,
          beta: 1.4,
          rsi: 65,
          high52ch: -0.5,
          low52ch: 40,
          ma20ch: 2,
          ma50ch: 1.5,
          ma200ch: 1,
          tr1m: -1,
          changeFromOpen: -0.3,
        },
      },
    ];

    const scored = scoreEtfs(entries);

    expect(scored).toHaveLength(2);
    expect(scored[0].symbol).toBe("AAA");
    expect(scored[0].scores.final).toBeGreaterThan(scored[1].scores.final);
    expect(scored[0].scores.final).toBeGreaterThan(0);
    expect(scored[0].scores.final).toBeLessThanOrEqual(100);
  });

  it("atribui nota neutra quando métricas faltam", () => {
    const entries: EtfEntry[] = [
      {
        symbol: "CCC",
        metrics: {
          close: 50,
          atr: null,
          high52ch: null,
          low52ch: null,
          ma20ch: null,
          ma50ch: null,
          ma200ch: null,
          rsi: null,
          relativeVolume: null,
          tr1m: null,
          changeFromOpen: null,
        },
      },
      {
        symbol: "DDD",
        metrics: {
          ...baseMetrics,
          expenseRatio: 0.1,
          dollarVolume: 20_000_000,
          issuer: "BlackRock",
          sharpeRatio: 0.6,
          sortinoRatio: 0.4,
          dividendYield: 3.2,
          dividendGrowthYears: 2,
          dividendGrowth: 1,
          beta: 1.05,
        },
      },
    ];

    const scored = scoreEtfs(entries);
    const lowDataEtf = scored.find((item) => item.symbol === "CCC");

    expect(lowDataEtf).toBeDefined();
    expect(lowDataEtf?.scores.final).toBeGreaterThan(0);
    expect(lowDataEtf?.scores.final).toBeLessThanOrEqual(100);
  });
});
