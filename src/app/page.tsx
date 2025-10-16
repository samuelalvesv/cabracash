import RankingView from "@/features/ranking/components/RankingView";
import { fetchRankedEtfs } from "@/features/ranking/server/scoring";

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function extractParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | undefined): number {
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function normalizeScoreThreshold(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const sanitized = value.replace(",", ".");
  const parsed = Number.parseFloat(sanitized);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.min(Math.max(parsed, 0), 100);
}

const PAGE_SIZE = 12;

export default async function Home({ searchParams }: PageProps) {
  const rankedEtfs = await fetchRankedEtfs();
  const initialPage = normalizePage(extractParam(searchParams?.page));
  const initialSearch = extractParam(searchParams?.search) ?? "";
  const initialMinFundamentals = normalizeScoreThreshold(extractParam(searchParams?.minFundamentals));
  const initialMinOpportunity = normalizeScoreThreshold(extractParam(searchParams?.minOpportunity));

  return (
    <RankingView
      items={rankedEtfs}
      pageSize={PAGE_SIZE}
      initialPage={initialPage}
      initialSearch={initialSearch}
      initialMinFundamentals={initialMinFundamentals}
      initialMinOpportunity={initialMinOpportunity}
    />
  );
}
