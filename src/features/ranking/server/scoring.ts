import { fetchMarketData } from "@/services/market-data";

import { mean, minMaxScale, safeNumber, winsorize } from "./utils";
import type { EtfEntry, FeatureSet, RankedEtf, RawEtfMetrics, ScaledFeatureSet } from "./types";
import { RANKING_CACHE_KEY, RANKING_CACHE_TTL_MS, fetchWithCache } from "./cache";

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
  liquidityComposite: {},
  holdings: {},
  assetsLog: {},
  issuerScore: {},
  riskAdjustedReturn: {},
  dividendYield: {},
  dividendStability: {},
  trackingEfficiency: { invert: true },
  riskBalance: { invert: true },
  intradayMomentum: {},
  discountFromHigh: { invert: true },
  distanceFromLow: { invert: true },
  movingAverageCombo: { invert: true },
  rsi: { invert: true },
  volumePulse: {},
  momentum1m: {},
  gapSignal: {},
};

const FUNDAMENTALS_WEIGHTS: Record<string, number> = {
  expenseRatio: 0.12,
  liquidityComposite: 0.12,
  holdings: 0.08,
  assetsLog: 0.06,
  issuerScore: 0.08,
  riskAdjustedReturn: 0.18,
  dividendYield: 0.07,
  dividendStability: 0.07,
  trackingEfficiency: 0.1,
  riskBalance: 0.12,
};

const OPPORTUNITY_WEIGHTS: Record<string, number> = {
  intradayMomentum: 0.12,
  discountFromHigh: 0.18,
  distanceFromLow: 0.15,
  movingAverageCombo: 0.15,
  rsi: 0.12,
  volumePulse: 0.1,
  momentum1m: 0.08,
  gapSignal: 0.1,
};

const FUNDAMENTALS_WEIGHT_SUM = Object.values(FUNDAMENTALS_WEIGHTS).reduce((acc, value) => acc + value, 0);
const OPPORTUNITY_WEIGHT_SUM = Object.values(OPPORTUNITY_WEIGHTS).reduce((acc, value) => acc + value, 0);

const LOW_RSI_THRESHOLD = 20;
const LOW_VOLUME_LOG_THRESHOLD = Math.log1p(1);
const VALUE_TRAP_PENALTY = 0.85;

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
  const values = [metrics.ma20ch, metrics.ma50ch, metrics.ma150ch, metrics.ma200ch].map((value) =>
    toNullableNumber(value),
  );
  const filtered = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (filtered.length === 0) {
    return null;
  }

  return mean(filtered);
}

function computeRiskAdjustedReturn(sharpe: number | null, sortino: number | null): number | null {
  const normalizedSharpe =
    sharpe === null ? null : (Math.min(Math.max(sharpe, -2), 5) + 2) / 7; // map [-2,5] -> [0,1]
  const normalizedSortino =
    sortino === null ? null : (Math.min(Math.max(sortino, -2), 6) + 2) / 8; // map [-2,6] -> [0,1]
  const components = [normalizedSharpe, normalizedSortino].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
}

function computeDividendStability(metrics: RawEtfMetrics): number | null {
  const growthYears = toNullableNumber(metrics.dividendGrowthYears);
  const growthRate = toNullableNumber(metrics.dividendGrowth);

  const normalizedYears = growthYears === null ? null : Math.min(Math.max(growthYears, 0), 25) / 25;
  const normalizedGrowth =
    growthRate === null ? null : (Math.min(Math.max(growthRate, -5), 20) + 5) / 25; // clamp to [-5,20]

  const components = [normalizedYears, normalizedGrowth].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
}

function computeTrackingEfficiency(metrics: RawEtfMetrics): number | null {
  const candidateKeys = [
    "trackingDifference",
    "trackingError",
    "trackingError1y",
    "trackingError3y",
    "trackingError5y",
  ];

  const values = candidateKeys
    .map((key) => toNullableNumber(metrics[key]))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  const absValues = values.map((value) => Math.abs(value));
  return mean(absValues);
}

function computeRiskBalance(betaDeviation: number | null, atrRatio: number | null): number | null {
  const components = [betaDeviation, atrRatio].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
}

function computeGapSignal(
  premarketChangePercent: number | null,
  afterHoursChangePercent: number | null,
): number | null {
  const components = [premarketChangePercent, afterHoursChangePercent].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
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

  const dollarVolumeLog = log10Safely(toNullableNumber(metrics.dollarVolume));
  const volumeLog = log10Safely(toNullableNumber(metrics.volume));
  const relativeVolumeLog = log1pSafely(toNullableNumber(metrics.relativeVolume));
  const atrRatio = computeAtrRatio(metrics);
  const holdings = toNullableNumber(metrics.holdings) ?? toNullableNumber(metrics.holdingsCount);
  const assetsLog = log10Safely(toNullableNumber(metrics.assets));
  const premarketChangePercent = toNullableNumber(metrics.premarketChangePercent);
  const afterHoursChangePercent =
    toNullableNumber(metrics.afterHoursChangePercent) ?? toNullableNumber(metrics.postmarketChangePercent);

  return {
    expenseRatio: toNullableNumber(metrics.expenseRatio),
    liquidityComposite: (() => {
      const parts = [dollarVolumeLog, volumeLog, relativeVolumeLog].filter(
        (value): value is number => value !== null && Number.isFinite(value),
      );
      return parts.length > 0 ? mean(parts) : null;
    })(),
    holdings,
    assetsLog,
    issuerScore: scoreIssuer(metrics.issuer),
    riskAdjustedReturn: computeRiskAdjustedReturn(toNullableNumber(metrics.sharpeRatio), toNullableNumber(metrics.sortinoRatio)),
    dividendYield: toNullableNumber(metrics.dividendYield),
    dividendStability: computeDividendStability(metrics),
    trackingEfficiency: computeTrackingEfficiency(metrics),
    riskBalance: computeRiskBalance(betaDeviation, atrRatio),
    intradayMomentum: toNullableNumber(metrics.ch1d),
    discountFromHigh: toNullableNumber(metrics.high52ch),
    distanceFromLow: toNullableNumber(metrics.low52ch),
    movingAverageCombo: computeMovingAverageCombo(metrics),
    rsi: toNullableNumber(metrics.rsi),
    volumePulse: relativeVolumeLog,
    momentum1m: toNullableNumber(metrics.tr1m),
    gapSignal: computeGapSignal(premarketChangePercent, afterHoursChangePercent),
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
  if (score === undefined || Number.isNaN(score)) {
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

      const fundamentalsScore =
        Object.values(fundamentalsComponents).reduce((acc, value) => acc + value, 0) / FUNDAMENTALS_WEIGHT_SUM;

      Object.entries(OPPORTUNITY_WEIGHTS).forEach(([key, weight]) => {
        opportunityComponents[key] = pickScaledScore(normalized, index, key as keyof FeatureSet) * weight;
      });

      let opportunityScore =
        Object.values(opportunityComponents).reduce((acc, value) => acc + value, 0) / OPPORTUNITY_WEIGHT_SUM;

      const features = featureSets[index];
      if (
        features.rsi !== null &&
        features.rsi < LOW_RSI_THRESHOLD &&
        (features.volumePulse === null || features.volumePulse < LOW_VOLUME_LOG_THRESHOLD)
      ) {
        opportunityScore *= VALUE_TRAP_PENALTY;
        Object.keys(opportunityComponents).forEach((key) => {
          opportunityComponents[key] *= VALUE_TRAP_PENALTY;
        });
      }

      const finalScore = 0.55 * fundamentalsScore + 0.45 * opportunityScore;

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

export async function fetchRankedEtfs(): Promise<RankedEtf[]> {
  return fetchWithCache(RANKING_CACHE_KEY, RANKING_CACHE_TTL_MS, async () => {
    const response = await fetchMarketData();
    const entries = buildEtfEntries(response.data?.data ?? {});
    return scoreEtfs(entries);
  });
}
