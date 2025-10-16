import { fetchMarketData, MARKET_DATA_FIELDS } from "@/services/market-data";

type IndicatorCheck = {
  label: string;
  getter: (record: Record<string, unknown>) => unknown;
};

type MarketDataField = (typeof MARKET_DATA_FIELDS)[number];

type IndicatorConfig = {
  label: string;
  keys: MarketDataField[];
  getter?: (record: Record<string, unknown>) => unknown;
};

const BASE_VALIDATION_INDICATORS: IndicatorConfig[] = [
  { label: "Name", keys: ["name"] },
  { label: "Assets", keys: ["assets"] },
  { label: "Asset Class", keys: ["assetClass"] },
  { label: "Stock Price", keys: ["price", "close"] },
  { label: "Holdings", keys: ["holdings", "holdingsCount"] },
  { label: "Volume", keys: ["volume"] },
  {
    label: "1D Change",
    keys: ["ch1d", "close", "preClose"],
    getter: (record) => record.ch1d ?? deriveCh1d(record),
  },
  { label: "Premarket Close", keys: ["premarketClose", "preClose"] },
  { label: "Premarket % Change", keys: ["premarketChangePercent"] },
  {
    label: "After-hours % Change",
    keys: ["afterHoursChangePercent", "postmarketChangePercent"],
  },
  { label: "After-hours Price", keys: ["afterHoursPrice", "postmarketPrice"] },
  { label: "After-hours Close", keys: ["afterHoursClose", "postClose"] },
];

const BASE_KEYS = new Set<MarketDataField>(BASE_VALIDATION_INDICATORS.flatMap((indicator) => indicator.keys));

export const VALIDATION_INDICATORS: IndicatorConfig[] = [
  ...BASE_VALIDATION_INDICATORS,
  ...MARKET_DATA_FIELDS.filter((field) => !BASE_KEYS.has(field)).map<IndicatorConfig>((field) => ({
    label: field,
    keys: [field],
  })),
];

function buildGetterFromKeys(keys: MarketDataField[]): (record: Record<string, unknown>) => unknown {
  return (record) => {
    for (const key of keys) {
      const value = record[key];
      if (!isNullish(value)) {
        return value;
      }
    }
    return record[keys[0]];
  };
}

const INDICATOR_CHECKS: IndicatorCheck[] = VALIDATION_INDICATORS.map(({ label, keys, getter }) => ({
  label,
  getter: getter ?? buildGetterFromKeys(keys),
}));

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
