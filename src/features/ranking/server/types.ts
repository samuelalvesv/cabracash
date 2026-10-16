import type { MarketDataRecord } from "@/services/market-data";

export type RawEtfMetrics = MarketDataRecord;

export interface EtfEntry {
  symbol: string;
  metrics: RawEtfMetrics;
}

export type FundamentalFeatureKey =
  | "expenseRatio"
  | "liquidityComposite"
  | "holdings"
  | "assetsLog"
  | "issuerScore"
  | "riskAdjustedReturn"
  | "dividendYield"
  | "dividendStability"
  | "riskBalance";

export type OpportunityFeatureKey =
  | "intradayMomentum"
  | "discountFromHigh"
  | "distanceFromLow"
  | "movingAverageCombo"
  | "rsi"
  | "volumePulse"
  | "momentum1m"
  | "gapSignal";

export type FeatureKey = FundamentalFeatureKey | OpportunityFeatureKey;

export type FeatureSet = Record<FeatureKey, number | null>;

export interface ScoreBreakdown {
  fundamentals: number;
  opportunity: number;
  final: number;
  fundamentalsComponents: Record<FundamentalFeatureKey, number>;
  opportunityComponents: Record<OpportunityFeatureKey, number>;
}

export interface RankedEtf {
  symbol: string;
  features: FeatureSet;
  scores: ScoreBreakdown;
  raw: RawEtfMetrics;
}

