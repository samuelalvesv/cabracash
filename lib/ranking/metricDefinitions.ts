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
  { key: "expenseRatio", label: "Custo", format: "percent", weight: 0.2, getter: (item) => item.raw.expenseRatio as number | null | undefined },
  { key: "dollarVolume", label: "Liquidez (log)", weight: 0.15, getter: (item) => item.features.dollarVolume },
  { key: "issuerScore", label: "Emissor (score)", weight: 0.1, getter: (item) => item.features.issuerScore },
  { key: "sharpeRatio", label: "Sharpe", weight: 0.2, getter: (item) => item.raw.sharpeRatio as number | null | undefined },
  { key: "sortinoRatio", label: "Sortino", weight: 0.1, getter: (item) => item.raw.sortinoRatio as number | null | undefined },
  { key: "dividendYield", label: "Yield", format: "percent", weight: 0.1, getter: (item) => item.raw.dividendYield as number | null | undefined },
  { key: "dividendGrowthYears", label: "Dividendos (anos)", format: "number", weight: 0.05, getter: (item) => item.raw.dividendGrowthYears as number | null | undefined },
  { key: "dividendGrowth", label: "Crescimento Div.", weight: 0.05, getter: (item) => item.raw.dividendGrowth as number | null | undefined },
  { key: "betaDeviation", label: "Beta (desvio)", weight: 0.05, getter: (item) => item.features.betaDeviation },
  { key: "atrRatio", label: "ATR/Preço", weight: 0.05, getter: (item) => item.features.atrRatio },
];

export const OPPORTUNITY_DEFINITIONS: MetricDefinition[] = [
  { key: "top52Distance", label: "Dist. Topo 52", weight: 0.2, getter: (item) => item.features.top52Distance },
  { key: "bottom52Distance", label: "Dist. Fundo 52", weight: 0.2, getter: (item) => item.features.bottom52Distance },
  { key: "movingAverageCombo", label: "Médias Móveis", weight: 0.2, getter: (item) => item.features.movingAverageCombo },
  { key: "rsi", label: "RSI", weight: 0.15, getter: (item) => item.raw.rsi as number | null | undefined },
  { key: "relativeVolume", label: "Volume Rel.", weight: 0.1, getter: (item) => item.raw.relativeVolume as number | null | undefined },
  { key: "totalReturn1m", label: "Retorno 1m", weight: 0.1, getter: (item) => item.raw.tr1m as number | null | undefined },
  { key: "intradayChange", label: "Mov. Intradiário", weight: 0.05, getter: (item) => item.raw.changeFromOpen as number | null | undefined },
];
