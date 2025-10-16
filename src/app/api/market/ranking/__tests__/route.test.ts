import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchRankedEtfsMock = vi.fn();

vi.mock("@/features/ranking/server/scoring", () => ({
  fetchRankedEtfs: fetchRankedEtfsMock,
}));

describe("GET /api/market/ranking", () => {
  beforeEach(() => {
    fetchRankedEtfsMock.mockReset();
  });

  it("responde com 200 e a lista ranqueada", async () => {
    const { GET } = await import("../route");
    const ranking = [{ symbol: "AAA", scores: { final: 95 } }];
    fetchRankedEtfsMock.mockResolvedValue(ranking);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(ranking);
  });

  it("retorna 500 quando a geração do ranking falha", async () => {
    const { GET } = await import("../route");
    fetchRankedEtfsMock.mockRejectedValue(new Error("failed"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/Unable to compute ETF ranking/);
  });
});
