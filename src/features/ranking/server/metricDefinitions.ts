import type { MetricFormat } from "@/shared/utils/formatters";
import { FUNDAMENTALS_WEIGHTS, OPPORTUNITY_WEIGHTS } from "@/features/ranking/server/scoring";
import type {
  FeatureKey,
  FundamentalFeatureKey,
  OpportunityFeatureKey,
  RankedEtf,
} from "@/features/ranking/server/types";

export interface MetricDefinition<K extends FeatureKey = FeatureKey> {
  key: K;
  label: string;
  format?: MetricFormat;
  weight: number;
  getter: (item: RankedEtf) => number | string | null | undefined;
}

export const FUNDAMENTAL_DEFINITIONS: MetricDefinition<FundamentalFeatureKey>[] = [
  {
    key: "expenseRatio",
    label: "Custo",
    format: "percent",
    weight: FUNDAMENTALS_WEIGHTS.expenseRatio,
    getter: (item) => item.raw.expenseRatio as number | null | undefined,
  },
  {
    key: "liquidityComposite",
    label: "Liquidez composta",
    weight: FUNDAMENTALS_WEIGHTS.liquidityComposite,
    getter: (item) => item.features.liquidityComposite,
  },
  {
    key: "holdings",
    label: "Holdings",
    format: "number",
    weight: FUNDAMENTALS_WEIGHTS.holdings,
    getter: (item) => item.raw.holdings as number | null | undefined,
  },
  {
    key: "assetsLog",
    label: "Assets",
    format: "compact",
    weight: FUNDAMENTALS_WEIGHTS.assetsLog,
    getter: (item) => item.raw.assets as number | null | undefined,
  },
  {
    key: "issuerScore",
    label: "Emissor (score)",
    weight: FUNDAMENTALS_WEIGHTS.issuerScore,
    getter: (item) => item.features.issuerScore,
  },
  {
    key: "riskAdjustedReturn",
    label: "Risco/retorno",
    weight: FUNDAMENTALS_WEIGHTS.riskAdjustedReturn,
    getter: (item) => item.features.riskAdjustedReturn,
  },
  {
    key: "dividendYield",
    label: "Dividend Yield",
    format: "percent",
    weight: FUNDAMENTALS_WEIGHTS.dividendYield,
    getter: (item) => item.raw.dividendYield as number | null | undefined,
  },
  {
    key: "dividendStability",
    label: "Estabilidade de dividendos",
    weight: FUNDAMENTALS_WEIGHTS.dividendStability,
    getter: (item) => item.features.dividendStability,
  },
  {
    key: "riskBalance",
    label: "Risco balanceado",
    weight: FUNDAMENTALS_WEIGHTS.riskBalance,
    getter: (item) => item.features.riskBalance,
  },
];

export const OPPORTUNITY_DEFINITIONS: MetricDefinition<OpportunityFeatureKey>[] = [
  {
    key: "intradayMomentum",
    label: "Variação diária",
    format: "percent",
    weight: OPPORTUNITY_WEIGHTS.intradayMomentum,
    getter: (item) => item.raw.ch1d as number | null | undefined,
  },
  {
    key: "discountFromHigh",
    label: "Desconto topo 52s",
    weight: OPPORTUNITY_WEIGHTS.discountFromHigh,
    getter: (item) => item.features.discountFromHigh,
  },
  {
    key: "distanceFromLow",
    label: "Distância fundo 52s",
    weight: OPPORTUNITY_WEIGHTS.distanceFromLow,
    getter: (item) => item.features.distanceFromLow,
  },
  {
    key: "movingAverageCombo",
    label: "Médias móveis",
    weight: OPPORTUNITY_WEIGHTS.movingAverageCombo,
    getter: (item) => item.features.movingAverageCombo,
  },
  {
    key: "rsi",
    label: "RSI",
    weight: OPPORTUNITY_WEIGHTS.rsi,
    getter: (item) => item.raw.rsi as number | null | undefined,
  },
  {
    key: "volumePulse",
    label: "Volume relativo",
    weight: OPPORTUNITY_WEIGHTS.volumePulse,
    getter: (item) => item.raw.relativeVolume as number | null | undefined,
  },
  {
    key: "momentum1m",
    label: "Retorno 1m",
    format: "percent",
    weight: OPPORTUNITY_WEIGHTS.momentum1m,
    getter: (item) => item.raw.tr1m as number | null | undefined,
  },
  {
    key: "gapSignal",
    label: "Pré/pós-market",
    format: "percent",
    weight: OPPORTUNITY_WEIGHTS.gapSignal,
    getter: (item) => item.features.gapSignal,
  },
];
