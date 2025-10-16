import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAllCaches,
  fetchWithCache,
  readCache,
  writeCache,
} from "@/features/ranking/server/cache";

const KEY = "test-cache";

describe("fetchWithCache", () => {
  beforeEach(() => {
    clearAllCaches();
    vi.useRealTimers();
  });

  it("retorna o dado já armazenado sem chamar o loader novamente", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const payload = { foo: "bar" };
    writeCache(KEY, payload, 60_000);
    const loader = vi.fn<() => Promise<typeof payload>>();

    const result = await fetchWithCache(KEY, 60_000, loader);

    expect(result).toBe(payload);
    expect(loader).not.toHaveBeenCalled();
    expect(readCache<typeof payload>(KEY)?.data).toBe(payload);

    vi.useRealTimers();
  });

  it("deduplica carregamentos concorrentes enquanto o fetch está pendente", async () => {
    let resolveDeferred!: (value: { timestamp: number }) => void;
    const deferred = new Promise<{ timestamp: number }>((resolve) => {
      resolveDeferred = resolve;
    });

    const loader = vi.fn(() => deferred);

    const pendingA = fetchWithCache(KEY, 1_000, loader);
    const pendingB = fetchWithCache(KEY, 1_000, loader);

    expect(loader).toHaveBeenCalledTimes(1);

    const payload = { timestamp: Date.now() };
    resolveDeferred(payload);
    const [valueA, valueB] = await Promise.all([pendingA, pendingB]);

    expect(valueA).toEqual(valueB);
    expect(readCache<typeof valueA>(KEY)?.data).toEqual(payload);
  });

  it("refaz o fetch quando o TTL expira", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const loader = vi
      .fn<() => Promise<{ run: number }>>()
      .mockResolvedValueOnce({ run: 1 })
      .mockResolvedValueOnce({ run: 2 });

    const first = await fetchWithCache(KEY, 5_000, loader);
    expect(first).toEqual({ run: 1 });
    expect(loader).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(4_000);
    const stillCached = await fetchWithCache(KEY, 5_000, loader);
    expect(stillCached).toBe(first);
    expect(loader).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    const refreshed = await fetchWithCache(KEY, 5_000, loader);
    expect(refreshed).toEqual({ run: 2 });
    expect(loader).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
