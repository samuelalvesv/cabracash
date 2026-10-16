import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMarketData, MarketDataConnectionError, mergeMarketData } from "@/services/market-data";

const originalFetch = global.fetch;

describe("fetchMarketData", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retorna o payload mesclado quando ambas as requisições são bem-sucedidas", async () => {
    const initialJson = {
      status: 200,
      data: {
        count: 1,
        data: [
          {
            s: "AAA",
            n: "Triple A Fund",
            assetClass: "Equity",
            aum: 100_000_000,
            price: 50.5,
            change: 1.2,
            volume: 10_000,
            holdings: 45,
          },
        ],
      },
    };

    const dataPointsJson = {
      status: 200,
      data: {
        data: {
          AAA: {
            peRatio: 18.5,
            dividendYield: 2.1,
            expenseRatio: 0.05,
          },
        },
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("initial")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(initialJson),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(dataPointsJson),
      });
    });

    const response = await fetchMarketData();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(response.data.data.AAA).toBeDefined();
    expect(response.data.data.AAA.name).toBe("Triple A Fund");
    expect(response.data.data.AAA.assets).toBe(100_000_000);
    expect(response.data.data.AAA.peRatio).toBe(18.5);
    expect(response.data.data.AAA.dividendYield).toBe(2.1);
  });

  it("lança MarketDataConnectionError quando a resposta externa falha", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(fetchMarketData()).rejects.toThrow(MarketDataConnectionError);
  });

  it("lança MarketDataConnectionError quando ocorre exceção de rede", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection error"));

    await expect(fetchMarketData()).rejects.toThrow(MarketDataConnectionError);
  });

  it("lança MarketDataConnectionError quando o payload retornado está vazio ou inválido", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 200, data: { data: [] } }),
    });

    await expect(fetchMarketData()).rejects.toThrow(MarketDataConnectionError);
  });
});

describe("mergeMarketData", () => {
  it("mescla corretamente dados cadastrais e indicadores por símbolo", () => {
    const initial = {
      status: 200,
      data: {
        count: 1,
        data: [
          {
            s: "TEST",
            n: "Test ETF",
            assetClass: "Equity",
            aum: 500,
            price: 10,
            change: 0.5,
            volume: 1000,
            holdings: 10,
          },
        ],
      },
    };

    const dataPoints = {
      status: 200,
      data: {
        data: {
          TEST: {
            peRatio: 15,
            rsi: 45,
          },
        },
      },
    };

    const merged = mergeMarketData(initial, dataPoints);
    expect(merged.TEST).toEqual({
      peRatio: 15,
      rsi: 45,
      name: "Test ETF",
      assets: 500,
      assetClass: "Equity",
      price: 10,
      volume: 1000,
      holdings: 10,
      ch1d: 0.5,
    });
  });
});
