const DEFAULT_NEUTRAL_SCORE = 50;

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function mean(values: Array<number | null | undefined>): number {
  const filtered = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (filtered.length === 0) {
    return 0;
  }

  const total = filtered.reduce((acc, value) => acc + value, 0);
  return total / filtered.length;
}

export function winsorize(values: number[], lowerPercentile: number, upperPercentile: number): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length < 6) {
    return [...values];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const lowerIndex = Math.floor((lowerPercentile / 100) * (sorted.length - 1));
  const upperIndex = Math.ceil((upperPercentile / 100) * (sorted.length - 1));
  const lowerValue = sorted[lowerIndex];
  const upperValue = sorted[upperIndex];

  return values.map((value) => {
    if (value < lowerValue) {
      return lowerValue;
    }
    if (value > upperValue) {
      return upperValue;
    }
    return value;
  });
}

export function minMaxScale(values: number[], neutralValue = DEFAULT_NEUTRAL_SCORE): number[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    return values.map(() => neutralValue);
  }

  return values.map((value) => ((value - min) / (max - min)) * 100);
}

export function toScore(value: number | undefined | null): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_NEUTRAL_SCORE;
  }

  return Math.max(0, Math.min(100, value));
}
