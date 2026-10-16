import { fetchMarketData } from "@/services/market-data";

import { mean, minMaxScale, toNullableNumber, winsorize } from "./utils";
import type {
  EtfEntry,
  FeatureKey,
  FeatureSet,
  FundamentalFeatureKey,
  OpportunityFeatureKey,
  RankedEtf,
  RawEtfMetrics,
} from "./types";
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
  FeatureKey,
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

export const FUNDAMENTALS_WEIGHTS: Record<FundamentalFeatureKey, number> = {
  expenseRatio: 0.14,
  liquidityComposite: 0.14,
  holdings: 0.08,
  assetsLog: 0.08,
  issuerScore: 0.08,
  riskAdjustedReturn: 0.2,
  dividendYield: 0.07,
  dividendStability: 0.07,
  riskBalance: 0.14,
};

export const OPPORTUNITY_WEIGHTS: Record<OpportunityFeatureKey, number> = {
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

export function computeAtrRatio(metrics: RawEtfMetrics): number | null {
  const atr = toNullableNumber(metrics.atr);
  const basePrice = [metrics.price, metrics.close, metrics.open, metrics.preClose]
    .map(toNullableNumber)
    .find((value): value is number => value !== null && value > 0);

  if (atr === null || basePrice === undefined) {
    return null;
  }

  return atr / basePrice;
}

function computeMovingAverageCombo(metrics: RawEtfMetrics): number | null {
  const values = [metrics.ma20ch, metrics.ma50ch, metrics.ma150ch, metrics.ma200ch].map(toNullableNumber);
  const filtered = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (filtered.length === 0) {
    return null;
  }

  return mean(filtered);
}

function computeRiskAdjustedReturn(sharpe: number | null, sortino: number | null): number | null {
  const normalizedSharpe =
    sharpe === null ? null : (Math.min(Math.max(sharpe, -2), 5) + 2) / 7;
  const normalizedSortino =
    sortino === null ? null : (Math.min(Math.max(sortino, -2), 6) + 2) / 8;
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
    growthRate === null ? null : (Math.min(Math.max(growthRate, -5), 20) + 5) / 25;

  const components = [normalizedYears, normalizedGrowth].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
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
  postmarketChangePercent: number | null,
): number | null {
  const components = [premarketChangePercent, postmarketChangePercent].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  if (components.length === 0) {
    return null;
  }
  return mean(components);
}

function getFeatureSet(entry: EtfEntry): FeatureSet {
  const { metrics } = entry;

  const beta = toNullableNumber(metrics.beta);
  const betaDeviation = beta === null ? null : Math.abs(beta - 1);

  const dollarVolumeLog = log10Safely(toNullableNumber(metrics.dollarVolume));
  const volumeLog = log10Safely(toNullableNumber(metrics.volume));
  const relativeVolumeLog = log1pSafely(toNullableNumber(metrics.relativeVolume));
  const atrRatio = computeAtrRatio(metrics);
  const holdings = toNullableNumber(metrics.holdings);
  const assetsLog = log10Safely(toNullableNumber(metrics.assets));
  const premarketChangePercent = toNullableNumber(metrics.premarketChangePercent);
  const postmarketChangePercent = toNullableNumber(metrics.postmarketChangePercent);

  const liquidityParts = [dollarVolumeLog, volumeLog, relativeVolumeLog].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

  return {
    expenseRatio: toNullableNumber(metrics.expenseRatio),
    liquidityComposite: liquidityParts.length > 0 ? mean(liquidityParts) : null,
    holdings,
    assetsLog,
    issuerScore: scoreIssuer(metrics.issuer),
    riskAdjustedReturn: computeRiskAdjustedReturn(
      toNullableNumber(metrics.sharpeRatio),
      toNullableNumber(metrics.sortinoRatio),
    ),
    dividendYield: toNullableNumber(metrics.dividendYield),
    dividendStability: computeDividendStability(metrics),
    riskBalance: computeRiskBalance(betaDeviation, atrRatio),
    intradayMomentum: toNullableNumber(metrics.ch1d),
    discountFromHigh: toNullableNumber(metrics.high52ch),
    distanceFromLow: toNullableNumber(metrics.low52ch),
    movingAverageCombo: computeMovingAverageCombo(metrics),
    rsi: toNullableNumber(metrics.rsi),
    volumePulse: relativeVolumeLog,
    momentum1m: toNullableNumber(metrics.tr1m),
    gapSignal: computeGapSignal(premarketChangePercent, postmarketChangePercent),
  };
}

function compileFeatureMatrix(featureSets: FeatureSet[]): Record<FeatureKey, number[]> {
  const matrix = {} as Record<FeatureKey, number[]>;

  (Object.keys(FEATURE_CONFIG) as FeatureKey[]).forEach((key) => {
    matrix[key] = featureSets.map((features) => {
      const value = features[key];
      if (value === null || Number.isNaN(value)) {
        return Number.NaN;
      }

      const config = FEATURE_CONFIG[key];
      const transformed = config.pretransform ? config.pretransform(value) : value;
      return config.invert ? -transformed : transformed;
    });
  });

  return matrix;
}

function normalizeFeatureMatrix(matrix: Record<FeatureKey, number[]>): Record<FeatureKey, number[]> {
  const normalized = {} as Record<FeatureKey, number[]>;

  (Object.keys(matrix) as FeatureKey[]).forEach((key) => {
    const values = matrix[key];
    const availableValues = values.filter((value) => Number.isFinite(value));

    if (availableValues.length === 0) {
      normalized[key] = values.map(() => 50);
      return;
    }

    const winsorized = winsorize(availableValues, 2, 98);
    const minMax = minMaxScale(winsorized);

    let index = 0;
    normalized[key] = values.map((value) => {
      if (!Number.isFinite(value)) {
        return 50;
      }

      const score = minMax[index] ?? 50;
      index += 1;
      return score;
    });
  });

  return normalized;
}

function pickScaledScore(
  normalized: Record<FeatureKey, number[]>,
  index: number,
  key: FeatureKey,
): number {
  const score = normalized[key]?.[index];
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
      const fundamentalsComponents = {} as Record<FundamentalFeatureKey, number>;
      const opportunityComponents = {} as Record<OpportunityFeatureKey, number>;

      (Object.entries(FUNDAMENTALS_WEIGHTS) as Array<[FundamentalFeatureKey, number]>).forEach(([key, weight]) => {
        fundamentalsComponents[key] = pickScaledScore(normalized, index, key) * weight;
      });

      const fundamentalsScore =
        Object.values(fundamentalsComponents).reduce((acc, value) => acc + value, 0) / FUNDAMENTALS_WEIGHT_SUM;

      (Object.entries(OPPORTUNITY_WEIGHTS) as Array<[OpportunityFeatureKey, number]>).forEach(([key, weight]) => {
        opportunityComponents[key] = pickScaledScore(normalized, index, key) * weight;
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
        (Object.keys(opportunityComponents) as OpportunityFeatureKey[]).forEach((key) => {
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
    .sort(
      (a, b) =>
        b.scores.final - a.scores.final ||
        b.scores.fundamentals - a.scores.fundamentals ||
        a.symbol.localeCompare(b.symbol),
    );
}

export async function fetchRankedEtfs(): Promise<RankedEtf[]> {
  return fetchWithCache(RANKING_CACHE_KEY, RANKING_CACHE_TTL_MS, async () => {
    const response = await fetchMarketData();
    const entries = buildEtfEntries(response.data.data);
    return scoreEtfs(entries);
  });
}
