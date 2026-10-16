import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketDataConnectionError } from "@/services/market-data";

const { fetchMarketDataMock } = vi.hoisted(() => ({
  fetchMarketDataMock: vi.fn(),
}));

vi.mock("@/services/market-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/market-data")>();
  return {
    ...actual,
    fetchMarketData: fetchMarketDataMock,
  };
});

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
          AAA: { name: "AAA" },
        },
      },
    };
    fetchMarketDataMock.mockResolvedValue(payload);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(payload);
  });

  it("retorna 503 quando há falha de conexão com a API de mercado", async () => {
    const { GET } = await import("../route");
    fetchMarketDataMock.mockRejectedValue(new MarketDataConnectionError("Conexão falhou"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/Não foi possível se conectar com o servidor/);
  });

  it("retorna 500 quando ocorre outro erro inesperado", async () => {
    const { GET } = await import("../route");
    fetchMarketDataMock.mockRejectedValue(new Error("unexpected crash"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Unable to retrieve market data/);
  });
});
