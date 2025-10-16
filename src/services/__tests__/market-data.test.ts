import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMarketData } from "@/services/market-data";

const originalFetch = global.fetch;

describe("fetchMarketData", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retorna o payload quando a requisição é bem-sucedida", async () => {
    const json = vi.fn().mockResolvedValue({
      status: 200,
      data: { data: { AAA: { symbol: "AAA" } } },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      json,
    });

    const response = await fetchMarketData();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledTimes(1);
    expect(response.data.data.AAA).toEqual({ symbol: "AAA" });
  });

  it("lança erro quando a resposta não é ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
    });

    await expect(fetchMarketData()).rejects.toThrowError("Failed to fetch market data: Bad Request");
  });
});
