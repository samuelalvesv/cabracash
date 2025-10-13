import { fetchMarketData } from "@/lib/marketData";

import { mean, minMaxScale, safeNumber, winsorize } from "./utils";
import type { EtfEntry, FeatureSet, RankedEtf, RawEtfMetrics, ScaledFeatureSet } from "./types";

const ISSUER_SCORES: Record<string, number> = {
  Vanguard: 100,
  BlackRock: 95,
  "State Street": 92,
  "American Century Investments": 75,
  GraniteShares: 70,
};

const DEFAULT_ISSUER_SCORE = 60;

const FEATURE_CONFIG: Record<
  keyof FeatureSet,
  {
    invert?: boolean;
    pretransform?: (value: number) => number;
  }
> = {
  expenseRatio: { invert: true },
  dollarVolume: {},
  issuerScore: {},
  sharpeRatio: {},
  sortinoRatio: {},
  dividendYield: {},
  dividendGrowthYears: {},
  dividendGrowth: {},
  betaDeviation: { invert: true },
  atrRatio: { invert: true },
  top52Distance: { invert: true },
  bottom52Distance: { invert: true },
  movingAverageCombo: { invert: true },
  rsi: { invert: true },
  relativeVolume: {},
  totalReturn1m: {},
  intradayChange: {},
};

const FUNDAMENTALS_WEIGHTS: Record<string, number> = {
  expenseRatio: 0.2,
  dollarVolume: 0.15,
  issuerScore: 0.1,
  sharpeRatio: 0.2,
  sortinoRatio: 0.1,
  dividendYield: 0.1,
  dividendGrowthYears: 0.05,
  betaDeviation: 0.05,
  atrRatio: 0.05,
  dividendGrowth: 0.05,
};

const OPPORTUNITY_WEIGHTS: Record<string, number> = {
  top52Distance: 0.2,
  bottom52Distance: 0.2,
  movingAverageCombo: 0.2,
  rsi: 0.15,
  relativeVolume: 0.1,
  totalReturn1m: 0.1,
  intradayChange: 0.05,
};

function buildEtfEntries(data: Record<string, RawEtfMetrics | undefined>): EtfEntry[] {
  return Object.entries(data)
    .map(([symbol, metrics]) => ({
      symbol,
      metrics: metrics ?? {},
    }))
    .filter((entry) => Object.keys(entry.metrics).length > 0);
}

function scoreIssuer(issuer: unknown): number | null {
  if (typeof issuer !== "string" || issuer.length === 0) {
    return null;
  }

  return ISSUER_SCORES[issuer] ?? DEFAULT_ISSUER_SCORE;
}

function toNullableNumber(value: unknown): number | null {
  const numeric = safeNumber(value, NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function log10Safely(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  const normalized = Math.max(1, value);
  return Math.log10(normalized);
}

function log1pSafely(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  const normalized = Math.max(0, value);
  return Math.log1p(normalized);
}

function computeAtrRatio(metrics: RawEtfMetrics): number | null {
  const atr = toNullableNumber(metrics.atr);
  const basePrice = [metrics.close, metrics.open, metrics.preClose]
    .map((value) => toNullableNumber(value))
    .find((value) => value !== null && value > 0);

  if (atr === null || basePrice === undefined || basePrice === null) {
    return null;
  }

  return atr / Math.max(basePrice, 1);
}

function computeMovingAverageCombo(metrics: RawEtfMetrics): number | null {
  const values = [metrics.ma20ch, metrics.ma50ch, metrics.ma200ch].map((value) =>
    toNullableNumber(value),
  );
  const filtered = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (filtered.length === 0) {
    return null;
  }

  return mean(filtered);
}

function getFeatureSet(entry: EtfEntry): FeatureSet {
  const { metrics } = entry;
  const betaDeviation = (() => {
    const beta = toNullableNumber(metrics.beta);
    if (beta === null) {
      return null;
    }
    return Math.abs(beta - 1);
  })();

  return {
    expenseRatio: toNullableNumber(metrics.expenseRatio),
    dollarVolume: log10Safely(toNullableNumber(metrics.dollarVolume)),
    issuerScore: scoreIssuer(metrics.issuer),
    sharpeRatio: toNullableNumber(metrics.sharpeRatio),
    sortinoRatio: toNullableNumber(metrics.sortinoRatio),
    dividendYield: toNullableNumber(metrics.dividendYield),
    dividendGrowthYears: toNullableNumber(metrics.dividendGrowthYears),
    dividendGrowth: toNullableNumber(metrics.dividendGrowth),
    betaDeviation,
    atrRatio: computeAtrRatio(metrics),
    top52Distance: toNullableNumber(metrics.high52ch),
    bottom52Distance: toNullableNumber(metrics.low52ch),
    movingAverageCombo: computeMovingAverageCombo(metrics),
    rsi: toNullableNumber(metrics.rsi),
    relativeVolume: log1pSafely(toNullableNumber(metrics.relativeVolume)),
    totalReturn1m: toNullableNumber(metrics.tr1m),
    intradayChange: toNullableNumber(metrics.changeFromOpen),
  };
}

function compileFeatureMatrix(featureSets: FeatureSet[]): Record<keyof FeatureSet, number[]> {
  const matrix = {} as Record<keyof FeatureSet, number[]>;

  (Object.keys(FEATURE_CONFIG) as Array<keyof FeatureSet>).forEach((key) => {
    matrix[key] = featureSets.map((features) => {
      const value = features[key];
      if (value === null || Number.isNaN(value)) {
        return Number.NaN;
      }

      const config = FEATURE_CONFIG[key];
      const transformed = config?.pretransform ? config.pretransform(value) : value;
      return config?.invert ? -transformed : transformed;
    });
  });

  return matrix;
}

function normalizeFeatureMatrix(matrix: Record<keyof FeatureSet, number[]>): Record<keyof FeatureSet, ScaledFeatureSet> {
  const normalized = {} as Record<keyof FeatureSet, ScaledFeatureSet>;

  (Object.keys(matrix) as Array<keyof FeatureSet>).forEach((key) => {
    const values = matrix[key];
    const availableValues = values.filter((value) => Number.isFinite(value));

    if (availableValues.length === 0) {
      normalized[key] = {};
      return;
    }

    const winsorized = winsorize(availableValues, 2, 98);
    const minMax = minMaxScale(winsorized);

    const scaled: ScaledFeatureSet = {};
    let index = 0;
    values.forEach((value, position) => {
      if (!Number.isFinite(value)) {
        scaled[position] = 50;
        return;
      }

      scaled[position] = minMax[index];
      index += 1;
    });

    normalized[key] = scaled;
  });

  return normalized;
}

function pickScaledScore(
  normalized: Record<keyof FeatureSet, ScaledFeatureSet>,
  index: number,
  key: keyof FeatureSet,
): number {
  const featureScores = normalized[key];
  if (!featureScores) {
    return 50;
  }

  const score = featureScores[index];
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 50;
  }

  return score;
}

export function scoreEtfs(entries: EtfEntry[]): RankedEtf[] {
  if (entries.length === 0) {
    return [];
  }

  const featureSets = entries.map(getFeatureSet);
  const matrix = compileFeatureMatrix(featureSets);
  const normalized = normalizeFeatureMatrix(matrix);

  return entries
    .map<RankedEtf>((entry, index) => {
      const fundamentalsComponents: Record<string, number> = {};
      const opportunityComponents: Record<string, number> = {};

      Object.entries(FUNDAMENTALS_WEIGHTS).forEach(([key, weight]) => {
        fundamentalsComponents[key] = pickScaledScore(normalized, index, key as keyof FeatureSet) * weight;
      });

      Object.entries(OPPORTUNITY_WEIGHTS).forEach(([key, weight]) => {
        opportunityComponents[key] = pickScaledScore(normalized, index, key as keyof FeatureSet) * weight;
      });

      const fundamentalsScore =
        Object.values(fundamentalsComponents).reduce((acc, value) => acc + value, 0) /
        Object.values(FUNDAMENTALS_WEIGHTS).reduce((acc, value) => acc + value, 0);

      const opportunityScore =
        Object.values(opportunityComponents).reduce((acc, value) => acc + value, 0) /
        Object.values(OPPORTUNITY_WEIGHTS).reduce((acc, value) => acc + value, 0);

      const finalScore = 0.5 * fundamentalsScore + 0.5 * opportunityScore;

      return {
        symbol: entry.symbol,
        raw: entry.metrics,
        features: featureSets[index],
        scores: {
          fundamentals: fundamentalsScore,
          opportunity: opportunityScore,
          final: finalScore,
          fundamentalsComponents,
          opportunityComponents,
        },
      };
    })
    .sort((a, b) => b.scores.final - a.scores.final);
}

const CACHE_TTL_MS = 60_000;
let cachedRanking: { timestamp: number; data: RankedEtf[] } | null = null;

export async function fetchRankedEtfs(): Promise<RankedEtf[]> {
  if (cachedRanking && Date.now() - cachedRanking.timestamp < CACHE_TTL_MS) {
    return cachedRanking.data;
  }

  const response = await fetchMarketData();
  const entries = buildEtfEntries(response.data?.data ?? {});
  const ranked = scoreEtfs(entries);
  cachedRanking = {
    timestamp: Date.now(),
    data: ranked,
  };
  return ranked;
}
