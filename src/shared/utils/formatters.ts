const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export type MetricFormat = "percent" | "number" | "decimal" | "compact" | "raw";

export function formatScore(value: number): string {
  return decimalFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR");
}

export function formatMetric(value: number | string | null | undefined, format: MetricFormat = "decimal"): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value.length > 0 ? value : "—";
  }

  if (Number.isNaN(value)) {
    return "—";
  }

  switch (format) {
    case "percent":
      return `${percentFormatter.format(value)}%`;
    case "number":
      return numberFormatter.format(value);
    case "compact":
      return compactFormatter.format(value);
    case "raw":
      return String(value);
    default:
      return decimalFormatter.format(value);
  }
}
