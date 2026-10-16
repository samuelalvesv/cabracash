export const RANKING_FILTERS_EVENT = "ranking:filters-updated";

export interface RankingFilterSnapshot {
  page: number;
  search: string;
  minFundamentals: number;
  minOpportunity: number;
}

const STORAGE_KEY = "ranking:filters";

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 100);
}

export function parseThresholdInput(value: string | undefined | null): number {
  if (!value) {
    return 0;
  }

  const sanitized = value.replace(",", ".");
  const numeric = Number.parseFloat(sanitized);
  if (Number.isNaN(numeric)) {
    return 0;
  }

  return clampScore(numeric);
}

export function sanitizeThresholdInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const normalized = parseThresholdInput(trimmed);
  return normalized > 0 ? normalized.toString() : "";
}

export function normalizePage(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 1 ? Math.round(value) : 1;
  }
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function extractParam(value: string | string[] | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export function parseRankingSearchParams(
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined> | null,
): RankingFilterSnapshot {
  if (!searchParams) {
    return { page: 1, search: "", minFundamentals: 0, minOpportunity: 0 };
  }

  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    return extractParam(searchParams[key]);
  };

  return {
    page: normalizePage(get("page")),
    search: (get("search") ?? "").trim(),
    minFundamentals: parseThresholdInput(get("minFundamentals")),
    minOpportunity: parseThresholdInput(get("minOpportunity")),
  };
}

export function saveRankingFilters(snapshot: RankingFilterSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const data = JSON.stringify(snapshot);
    window.sessionStorage.setItem(STORAGE_KEY, data);
    window.dispatchEvent(new CustomEvent(RANKING_FILTERS_EVENT, { detail: snapshot }));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

export function loadRankingFilters(): RankingFilterSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<RankingFilterSnapshot>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.page !== "number" ||
      typeof parsed.search !== "string" ||
      typeof parsed.minFundamentals !== "number" ||
      typeof parsed.minOpportunity !== "number"
    ) {
      return null;
    }

    return {
      page: normalizePage(parsed.page),
      search: parsed.search.trim(),
      minFundamentals: clampScore(parsed.minFundamentals),
      minOpportunity: clampScore(parsed.minOpportunity),
    };
  } catch {
    return null;
  }
}

export function buildRankingQueryString(snapshot: Partial<RankingFilterSnapshot>): string {
  const params = new URLSearchParams();
  const trimmedSearch = (snapshot.search ?? "").trim();
  if (trimmedSearch.length > 0) {
    params.set("search", trimmedSearch);
  }
  const fundamentals = clampScore(snapshot.minFundamentals ?? 0);
  if (fundamentals > 0) {
    params.set("minFundamentals", fundamentals.toString());
  }
  const opportunity = clampScore(snapshot.minOpportunity ?? 0);
  if (opportunity > 0) {
    params.set("minOpportunity", opportunity.toString());
  }
  const page = normalizePage(snapshot.page);
  if (page > 1) {
    params.set("page", page.toString());
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}
