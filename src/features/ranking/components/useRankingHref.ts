"use client";

import { useSyncExternalStore } from "react";
import {
  buildRankingQueryString,
  loadRankingFilters,
  parseRankingSearchParams,
  RANKING_FILTERS_EVENT,
} from "./rankingFilterStorage";

function subscribeRankingFilters(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(RANKING_FILTERS_EVENT, callback);
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(RANKING_FILTERS_EVENT, callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("focus", callback);
  };
}

function getStoredQuerySnapshot(): string {
  const stored = loadRankingFilters();
  return stored ? buildRankingQueryString(stored) : "";
}

function getServerQuerySnapshot(): string {
  return "";
}

export function useRankingHref(searchParams?: URLSearchParams | null): string {
  const storedQuery = useSyncExternalStore(
    subscribeRankingFilters,
    getStoredQuerySnapshot,
    getServerQuerySnapshot,
  );

  if (searchParams) {
    const fromUrl = buildRankingQueryString(parseRankingSearchParams(searchParams));
    if (fromUrl.length > 0) {
      return `/${fromUrl}`;
    }
  }

  return `/${storedQuery}`;
}
