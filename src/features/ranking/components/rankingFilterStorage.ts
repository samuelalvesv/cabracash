"use client";

export const RANKING_FILTERS_EVENT = "ranking:filters-updated";

export interface RankingFilterSnapshot {
  page: number;
  search: string;
  minFundamentals: number;
  minOpportunity: number;
}

const STORAGE_KEY = "ranking:filters";

export function saveRankingFilters(snapshot: RankingFilterSnapshot) {
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
      page: parsed.page,
      search: parsed.search,
      minFundamentals: parsed.minFundamentals,
      minOpportunity: parsed.minOpportunity,
    };
  } catch {
    return null;
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 100);
}

export function buildRankingQueryString(snapshot: RankingFilterSnapshot): string {
  const params = new URLSearchParams();
  const trimmedSearch = snapshot.search.trim();
  if (trimmedSearch.length > 0) {
    params.set("search", trimmedSearch);
  }
  const fundamentals = clampScore(snapshot.minFundamentals);
  if (fundamentals > 0) {
    params.set("minFundamentals", fundamentals.toString());
  }
  const opportunity = clampScore(snapshot.minOpportunity);
  if (opportunity > 0) {
    params.set("minOpportunity", opportunity.toString());
  }
  const page = Number.isFinite(snapshot.page) ? Math.max(1, Math.round(snapshot.page)) : 1;
  if (page > 1) {
    params.set("page", page.toString());
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}
