export const BASE_MARKET_FIELDS = [
  "name",
  "assets",
  "assetClass",
  "price",
  "volume",
  "holdings",
  "ch1d",
] as const;

export const DATA_POINTS_IDS = [
  "open",
  "low",
  "high",
  "close",
  "premarketPrice",
  "premarketChangePercent",
  "preClose",
  "premarketVolume",
  "postmarketPrice",
  "postmarketChangePercent",
  "postClose",
  "low52",
  "high52",
  "dollarVolume",
  "averageVolume",
  "relativeVolume",
  "daysGap",
  "changeFromOpen",
  "expenseRatio",
  "etfCategory",
  "issuer",
  "etfIndex",
  "inceptionDate",
  "peRatio",
  "beta",
  "rsi",
  "rsiWeekly",
  "rsiMonthly",
  "atr",
  "sharpeRatio",
  "sortinoRatio",
  "dps",
  "lastDividend",
  "dividendYield",
  "dividendGrowth",
  "dividendGrowthYears",
  "divCAGR3",
  "divCAGR5",
  "divCAGR10",
  "payoutRatio",
  "payoutFrequency",
  "exDivDate",
  "paymentDate",
  "exchange",
  "etfRegion",
  "etfCountry",
  "etfLeverage",
  "optionable",
  "sharesOut",
  "ch1m",
  "ch3m",
  "ch6m",
  "chYTD",
  "ch1y",
  "ch3y",
  "ch5y",
  "ch10y",
  "ch15y",
  "ch20y",
  "tr1m",
  "tr3m",
  "tr6m",
  "trYTD",
  "tr1y",
  "tr3y",
  "tr5y",
  "tr10y",
  "tr15y",
  "tr20y",
  "cagr1y",
  "cagr3y",
  "cagr5y",
  "cagr10y",
  "cagr15y",
  "cagr20y",
  "low52ch",
  "high52ch",
  "allTimeHigh",
  "allTimeHighChange",
  "allTimeHighDate",
  "allTimeLow",
  "allTimeLowChange",
  "allTimeLowDate",
  "tags",
  "ma20",
  "ma50",
  "ma150",
  "ma200",
  "ma20ch",
  "ma50ch",
  "ma150ch",
  "ma200ch",
  "cusip",
  "isin",
  "priceDate",
  "positionInRange",
  "priceCurrency",
  "beta1y",
  "beta2y",
  "dividendYears",
  "ch1w",
  "high52Date",
  "low52Date",
] as const;

export const MARKET_DATA_FIELDS = [
  ...BASE_MARKET_FIELDS,
  ...DATA_POINTS_IDS,
] as const;

export type BaseMarketField = (typeof BASE_MARKET_FIELDS)[number];
export type DataPointId = (typeof DATA_POINTS_IDS)[number];
export type MarketDataField = (typeof MARKET_DATA_FIELDS)[number];
export type MarketDataValue = number | string | string[] | null;
export type MarketDataRecord = Partial<Record<MarketDataField, MarketDataValue>>;

export const INITIAL_ENDPOINT =
  "https://stockanalysis.com/_api/endpoints/screener/initial?type=etf&countryCode=";

export const DATA_POINTS_ENDPOINT = `https://stockanalysis.com/_api/endpoints/screener/data-points?type=e&ids=${DATA_POINTS_IDS.join("+")}`;

export const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0.1 Safari/605.1.15",
  Accept: "*/*",
  Referer: "https://stockanalysis.com/",
};

export interface MarketApiResponse {
  status: number;
  data: {
    data: Record<string, MarketDataRecord>;
  };
}

export interface ScreenerInitialItem {
  s: string;
  n: string;
  assetClass: string | null;
  aum: number | null;
  price: number | null;
  change: number | null;
  volume: number | null;
  holdings: number | null;
}

export interface ScreenerInitialResponse {
  status?: number;
  data?: {
    count?: number;
    data?: ScreenerInitialItem[];
  };
}

export interface ScreenerDataPointsResponse {
  status?: number;
  data?: {
    data?: Record<string, Partial<Record<DataPointId, MarketDataValue>>>;
  };
}

export class MarketDataConnectionError extends Error {
  constructor(message = "Não foi possível estabelecer conexão com o servidor de dados de mercado.") {
    super(message);
    this.name = "MarketDataConnectionError";
  }
}

export function mergeMarketData(
  initialData: ScreenerInitialResponse | undefined,
  dataPointsData: ScreenerDataPointsResponse | undefined,
): Record<string, MarketDataRecord> {
  const merged: Record<string, MarketDataRecord> = {};
  const dpMap = dataPointsData?.data?.data ?? {};

  for (const item of initialData?.data?.data ?? []) {
    const sym = item.s;
    const dp = dpMap[sym] ?? {};
    merged[sym] = {
      ...dp,
      name: item.n,
      assets: item.aum,
      assetClass: item.assetClass,
      price: item.price,
      volume: item.volume,
      holdings: item.holdings,
      ch1d: item.change,
    };
  }

  for (const [sym, dp] of Object.entries(dpMap)) {
    if (!merged[sym]) {
      merged[sym] = { ...dp };
    }
  }

  return merged;
}

const FETCH_TIMEOUT_MS = 10000;

export async function fetchMarketData(init?: RequestInit): Promise<MarketApiResponse> {
  try {
    const signal = init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS);

    const [initialRes, dataPointsRes] = await Promise.all([
      fetch(INITIAL_ENDPOINT, {
        cache: "no-store",
        headers: FETCH_HEADERS,
        signal,
        ...init,
      }),
      fetch(DATA_POINTS_ENDPOINT, {
        cache: "no-store",
        headers: FETCH_HEADERS,
        signal,
        ...init,
      }),
    ]);

    if (!initialRes.ok || !dataPointsRes.ok) {
      throw new MarketDataConnectionError(
        `Falha na resposta da API de mercado: initial=${initialRes.status}, dataPoints=${dataPointsRes.status}`,
      );
    }

    const [initialJson, dataPointsJson] = (await Promise.all([
      initialRes.json(),
      dataPointsRes.json(),
    ])) as [ScreenerInitialResponse, ScreenerDataPointsResponse];

    const initialItems = initialJson?.data?.data;
    const dataPointsMap = dataPointsJson?.data?.data;

    if (
      initialJson?.status !== 200 ||
      dataPointsJson?.status !== 200 ||
      !Array.isArray(initialItems) ||
      initialItems.length === 0 ||
      !dataPointsMap ||
      typeof dataPointsMap !== "object" ||
      Object.keys(dataPointsMap).length === 0
    ) {
      throw new MarketDataConnectionError("Contrato inválido ou resposta vazia da API de mercado.");
    }

    const merged = mergeMarketData(initialJson, dataPointsJson);
    return {
      status: 200,
      data: {
        data: merged,
      },
    };
  } catch (error) {
    if (error instanceof MarketDataConnectionError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new MarketDataConnectionError(`Falha de comunicação com a API de mercado: ${message}`);
  }
}
