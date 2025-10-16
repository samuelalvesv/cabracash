export type RawEtfMetrics = Record<string, number | string | null>;

export interface EtfEntry {
  symbol: string;
  metrics: RawEtfMetrics;
}

export interface FeatureSet {
  expenseRatio: number | null;
  liquidityComposite: number | null;
  holdings: number | null;
  assetsLog: number | null;
  issuerScore: number | null;
  riskAdjustedReturn: number | null;
  dividendYield: number | null;
  dividendStability: number | null;
  trackingEfficiency: number | null;
  riskBalance: number | null;
  intradayMomentum: number | null;
  discountFromHigh: number | null;
  distanceFromLow: number | null;
  movingAverageCombo: number | null;
  rsi: number | null;
  volumePulse: number | null;
  momentum1m: number | null;
  gapSignal: number | null;
}

export interface ScaledFeatureSet {
  [key: string]: number;
}

export interface ScoreBreakdown {
  fundamentals: number;
  opportunity: number;
  final: number;
  fundamentalsComponents: Record<string, number>;
  opportunityComponents: Record<string, number>;
}

export interface RankedEtf {
  symbol: string;
  features: FeatureSet;
  scores: ScoreBreakdown;
  raw: RawEtfMetrics;
}
