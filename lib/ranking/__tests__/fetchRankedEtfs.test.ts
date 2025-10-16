import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMarketDataMock = vi.fn();

vi.mock("@/lib/marketData", () => ({
  fetchMarketData: fetchMarketDataMock,
}));

const mockApiResponse = {
  status: 200,
  data: {
    data: {
      AAA: {
        expenseRatio: 0.05,
        holdings: 150,
        assets: 500_000_000,
        dollarVolume: 80_000_000,
        volume: 1_500_000,
        relativeVolume: 1.2,
        ch1d: 0.8,
        tr1m: 2.4,
        high52ch: -4.5,
        low52ch: 10.5,
        ma20ch: -0.5,
        ma50ch: -1.1,
        ma150ch: -1.8,
        ma200ch: -2,
        rsi: 48,
        sharpeRatio: 1.1,
        sortinoRatio: 0.9,
        dividendYield: 2.2,
        dividendGrowthYears: 4,
        dividendGrowth: 3.1,
        trackingDifference: 0.4,
        beta: 0.95,
        atr: 1.1,
        close: 100,
        open: 99,
        preClose: 98.5,
        premarketChangePercent: 0.2,
        afterHoursChangePercent: 0.1,
      },
      BBB: {
        expenseRatio: 0.25,
        holdings: 90,
        assets: 200_000_000,
        dollarVolume: 40_000_000,
        volume: 800_000,
        relativeVolume: 0.9,
        ch1d: -0.4,
        tr1m: 1.1,
        high52ch: -6.2,
        low52ch: 15.2,
        ma20ch: 0.6,
        ma50ch: 0.4,
        ma150ch: -0.3,
        ma200ch: -0.5,
        rsi: 52,
        sharpeRatio: 0.4,
        sortinoRatio: 0.6,
        dividendYield: 1.4,
        dividendGrowthYears: 2,
        dividendGrowth: 1.2,
        trackingDifference: 0.7,
        beta: 1.1,
        atr: 0.8,
        close: 45,
        open: 44.5,
        preClose: 44.2,
        premarketChangePercent: -0.1,
        afterHoursChangePercent: -0.2,
      },
    },
  },
};

describe("fetchRankedEtfs cache behaviour", () => {
  type CacheModule = typeof import("@/lib/ranking/cache");
  type FetchRankedEtfsModule = typeof import("@/lib/ranking/scoring");

  let fetchRankedEtfs: FetchRankedEtfsModule["fetchRankedEtfs"];
  let cacheModule: CacheModule;

  beforeEach(async () => {
    vi.resetModules();
    fetchMarketDataMock.mockReset();
    fetchMarketDataMock.mockResolvedValue(mockApiResponse);
    cacheModule = await import("@/lib/ranking/cache");
    cacheModule.clearAllCaches();
    ({ fetchRankedEtfs } = await import("@/lib/ranking/scoring"));
    vi.useRealTimers();
  });

  it("reutiliza os dados cacheados dentro da janela de 15 minutos", async () => {
    const initial = await fetchRankedEtfs();
    expect(fetchMarketDataMock).toHaveBeenCalledTimes(1);

    const cached = await fetchRankedEtfs();
    expect(fetchMarketDataMock).toHaveBeenCalledTimes(1);
    expect(cached).toBe(initial);
    expect(cacheModule.readCache(cacheModule.RANKING_CACHE_KEY)?.data).toBe(initial);
  });

  it("refaz o fetch quando a janela expira", async () => {
    vi.useFakeTimers();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const first = await fetchRankedEtfs();
    expect(fetchMarketDataMock).toHaveBeenCalledTimes(1);
    expect(cacheModule.readCache(cacheModule.RANKING_CACHE_KEY)?.data).toBe(first);

    vi.advanceTimersByTime(FIFTEEN_MINUTES_MS - 5000);
    const beforeExpiry = await fetchRankedEtfs();
    expect(beforeExpiry).toBe(first);
    expect(fetchMarketDataMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10_000);
    const second = await fetchRankedEtfs();
    expect(fetchMarketDataMock).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
    vi.useRealTimers();
  });

  it("deduplica requisições concorrentes enquanto o fetch está em andamento", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const deferred = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    fetchMarketDataMock.mockReturnValueOnce(deferred);

    const pendingA = fetchRankedEtfs();
    const pendingB = fetchRankedEtfs();

    expect(fetchMarketDataMock).toHaveBeenCalledTimes(1);

    resolveFetch(mockApiResponse);
    const [resultA, resultB] = await Promise.all([pendingA, pendingB]);

    expect(resultA).toBe(resultB);
    expect(cacheModule.readCache(cacheModule.RANKING_CACHE_KEY)?.data).toBe(resultA);
  });
});
