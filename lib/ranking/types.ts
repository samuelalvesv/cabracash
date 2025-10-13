export type RawEtfMetrics = Record<string, number | string | null>;

export interface EtfEntry {
  symbol: string;
  metrics: RawEtfMetrics;
}

export interface FeatureSet {
  expenseRatio: number | null;
  dollarVolume: number | null;
  issuerScore: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  dividendYield: number | null;
  dividendGrowthYears: number | null;
  dividendGrowth: number | null;
  betaDeviation: number | null;
  atrRatio: number | null;
  top52Distance: number | null;
  bottom52Distance: number | null;
  movingAverageCombo: number | null;
  rsi: number | null;
  relativeVolume: number | null;
  totalReturn1m: number | null;
  intradayChange: number | null;
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
