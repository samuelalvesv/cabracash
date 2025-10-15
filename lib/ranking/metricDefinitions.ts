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
  {
    key: "expenseRatio",
    label: "Custo",
    format: "percent",
    weight: 0.12,
    getter: (item) => item.raw.expenseRatio as number | null | undefined,
  },
  {
    key: "liquidityComposite",
    label: "Liquidez composta",
    weight: 0.12,
    getter: (item) => item.features.liquidityComposite,
  },
  {
    key: "holdings",
    label: "Holdings",
    format: "number",
    weight: 0.08,
    getter: (item) => (item.raw.holdings ?? item.raw.holdingsCount) as number | null | undefined,
  },
  {
    key: "assetsLog",
    label: "Assets",
    format: "compact",
    weight: 0.06,
    getter: (item) => item.raw.assets as number | null | undefined,
  },
  {
    key: "issuerScore",
    label: "Emissor (score)",
    weight: 0.08,
    getter: (item) => item.features.issuerScore,
  },
  {
    key: "riskAdjustedReturn",
    label: "Risco/retorno",
    weight: 0.18,
    getter: (item) => item.features.riskAdjustedReturn,
  },
  {
    key: "dividendYield",
    label: "Dividend Yield",
    format: "percent",
    weight: 0.07,
    getter: (item) => item.raw.dividendYield as number | null | undefined,
  },
  {
    key: "dividendStability",
    label: "Estabilidade de dividendos",
    weight: 0.07,
    getter: (item) => item.features.dividendStability,
  },
  {
    key: "trackingEfficiency",
    label: "Tracking (abs)",
    weight: 0.1,
    getter: (item) => item.features.trackingEfficiency,
  },
  {
    key: "riskBalance",
    label: "Risco balanceado",
    weight: 0.12,
    getter: (item) => item.features.riskBalance,
  },
];

export const OPPORTUNITY_DEFINITIONS: MetricDefinition[] = [
  {
    key: "intradayMomentum",
    label: "Variação diária",
    format: "percent",
    weight: 0.12,
    getter: (item) => item.raw.ch1d as number | null | undefined,
  },
  {
    key: "discountFromHigh",
    label: "Desconto topo 52s",
    weight: 0.18,
    getter: (item) => item.features.discountFromHigh,
  },
  {
    key: "distanceFromLow",
    label: "Distância fundo 52s",
    weight: 0.15,
    getter: (item) => item.features.distanceFromLow,
  },
  {
    key: "movingAverageCombo",
    label: "Médias móveis",
    weight: 0.15,
    getter: (item) => item.features.movingAverageCombo,
  },
  {
    key: "rsi",
    label: "RSI",
    weight: 0.12,
    getter: (item) => item.raw.rsi as number | null | undefined,
  },
  {
    key: "volumePulse",
    label: "Volume relativo",
    weight: 0.1,
    getter: (item) => item.raw.relativeVolume as number | null | undefined,
  },
  {
    key: "momentum1m",
    label: "Retorno 1m",
    format: "percent",
    weight: 0.08,
    getter: (item) => item.raw.tr1m as number | null | undefined,
  },
  {
    key: "gapSignal",
    label: "Pré/pós-market",
    format: "percent",
    weight: 0.1,
    getter: (item) => item.features.gapSignal,
  },
];
