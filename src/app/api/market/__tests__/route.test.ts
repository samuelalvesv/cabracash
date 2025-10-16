import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMarketDataMock = vi.fn();

vi.mock("@/services/market-data", () => ({
  fetchMarketData: fetchMarketDataMock,
}));

describe("GET /api/market", () => {
  beforeEach(() => {
    fetchMarketDataMock.mockReset();
  });

  it("retorna 200 com o payload do serviço", async () => {
    const { GET } = await import("../route");
    const payload = {
      status: 200,
      data: {
        data: {
          AAA: { symbol: "AAA" },
        },
      },
    };
    fetchMarketDataMock.mockResolvedValue(payload);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(payload);
  });

  it("retorna 500 quando o serviço falha", async () => {
    const { GET } = await import("../route");
    fetchMarketDataMock.mockRejectedValue(new Error("network error"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Unable to retrieve market data/);
  });
});
