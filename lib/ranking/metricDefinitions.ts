import type { MetricFormat } from "@/lib/formatters";
import type { RankedEtf } from "@/lib/ranking/types";

export interface MetricDefinition {
  key: string;
  label: string;
  format?: MetricFormat;
  weight?: number;
  getter: (item: RankedEtf) => number | string | null | undefined;
}

export const FUNDAMENTAL_DEFINITIONS: MetricDefinition[] = [
  { key: "expenseRatio", label: "Custo", format: "percent", weight: 0.15, getter: (item) => item.raw.expenseRatio as number | null | undefined },
  { key: "dollarVolume", label: "Liquidez (US$)", format: "compact", weight: 0.12, getter: (item) => item.raw.dollarVolume as number | null | undefined },
  { key: "volumeLog", label: "Liquidez (cotas)", format: "compact", weight: 0.08, getter: (item) => item.raw.volume as number | null | undefined },
  { key: "holdings", label: "Holdings", format: "number", weight: 0.10, getter: (item) => (item.raw.holdings ?? item.raw.holdingsCount) as number | null | undefined },
  { key: "assetsLog", label: "Assets", format: "compact", weight: 0.05, getter: (item) => item.raw.assets as number | null | undefined },
  { key: "issuerScore", label: "Emissor (score)", weight: 0.10, getter: (item) => item.features.issuerScore },
  { key: "sharpeRatio", label: "Sharpe", weight: 0.15, getter: (item) => item.raw.sharpeRatio as number | null | undefined },
  { key: "sortinoRatio", label: "Sortino", weight: 0.05, getter: (item) => item.raw.sortinoRatio as number | null | undefined },
  { key: "dividendYield", label: "Dividend Yield", format: "percent", weight: 0.08, getter: (item) => item.raw.dividendYield as number | null | undefined },
  { key: "dividendGrowthYears", label: "Dividendos (anos)", format: "number", weight: 0.04, getter: (item) => item.raw.dividendGrowthYears as number | null | undefined },
  { key: "dividendGrowth", label: "Crescimento Div.", weight: 0.04, getter: (item) => item.raw.dividendGrowth as number | null | undefined },
  { key: "betaDeviation", label: "Beta (desvio)", weight: 0.02, getter: (item) => item.features.betaDeviation },
  { key: "atrRatio", label: "ATR/Preço", weight: 0.02, getter: (item) => item.features.atrRatio },
];

export const OPPORTUNITY_DEFINITIONS: MetricDefinition[] = [
  { key: "ch1d", label: "Variação diária", format: "percent", weight: 0.12, getter: (item) => item.raw.ch1d as number | null | undefined },
  { key: "top52Distance", label: "Dist. Topo 52", weight: 0.18, getter: (item) => item.features.top52Distance },
  { key: "bottom52Distance", label: "Dist. Fundo 52", weight: 0.18, getter: (item) => item.features.bottom52Distance },
  { key: "movingAverageCombo", label: "Médias Móveis", weight: 0.15, getter: (item) => item.features.movingAverageCombo },
  { key: "rsi", label: "RSI", weight: 0.10, getter: (item) => item.raw.rsi as number | null | undefined },
  { key: "relativeVolume", label: "Volume Rel.", weight: 0.08, getter: (item) => item.raw.relativeVolume as number | null | undefined },
  { key: "totalReturn1m", label: "Retorno 1m", weight: 0.08, getter: (item) => item.raw.tr1m as number | null | undefined },
  { key: "premarketChangePercent", label: "Pré-market %", format: "percent", weight: 0.05, getter: (item) => item.raw.premarketChangePercent as number | null | undefined },
  {
    key: "afterHoursChangePercent",
    label: "After-hours %",
    format: "percent",
    weight: 0.06,
    getter: (item) =>
      (item.raw.afterHoursChangePercent ?? item.raw.postmarketChangePercent) as number | null | undefined,
  },
];
