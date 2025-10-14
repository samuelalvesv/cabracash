import { fetchMarketData } from "@/lib/marketData";

type IndicatorCheck = {
  label: string;
  getter: (record: Record<string, unknown>) => unknown;
};

const INDICATOR_CHECKS: IndicatorCheck[] = [
  { label: "Assets", getter: (record) => record.assets },
  { label: "Asset Class", getter: (record) => record.assetClass },
  { label: "Stock Price", getter: (record) => record.price ?? record.close },
  { label: "Holdings", getter: (record) => record.holdings ?? record.holdingsCount },
  { label: "Volume", getter: (record) => record.volume },
  { label: "1D Change", getter: (record) => record.ch1d ?? deriveCh1d(record) },
  { label: "Premarket Close", getter: (record) => record.premarketClose ?? record.preClose },
  { label: "Premarket % Change", getter: (record) => record.premarketChangePercent },
  { label: "After-hours % Change", getter: (record) => record.afterHoursChangePercent ?? record.postmarketChangePercent },
  { label: "After-hours Price", getter: (record) => record.afterHoursPrice ?? record.postmarketPrice },
];

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function deriveCh1d(record: Record<string, unknown>): number | null {
  const close = typeof record.close === "number" ? record.close : undefined;
  const preClose = typeof record.preClose === "number" ? record.preClose : undefined;
  if (close === undefined || preClose === undefined || preClose === 0) {
    return null;
  }
  return ((close - preClose) / preClose) * 100;
}

export async function findEmptyIndicators(): Promise<string[]> {
  const response = await fetchMarketData();
  const entries = Object.values(response.data?.data ?? {});

  if (entries.length === 0) {
    return INDICATOR_CHECKS.map((indicator) => indicator.label);
  }

  const failingIndicators: string[] = [];

  for (const indicator of INDICATOR_CHECKS) {
    const hasValue = entries.some((etf) => !isNullish(indicator.getter(etf)));
    if (!hasValue) {
      failingIndicators.push(indicator.label);
    }
  }

  return failingIndicators;
}
