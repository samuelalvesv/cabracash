import RankingView from "@/features/ranking/components/RankingView";
import { parseRankingSearchParams } from "@/features/ranking/components/rankingFilterStorage";
import { fetchRankedEtfs } from "@/features/ranking/server/scoring";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 12;

export default async function Home(props: PageProps) {
  const [rankedEtfs, searchParams] = await Promise.all([
    fetchRankedEtfs(),
    props.searchParams,
  ]);
  const filters = parseRankingSearchParams(searchParams);

  return (
    <RankingView
      items={rankedEtfs}
      pageSize={PAGE_SIZE}
      initialPage={filters.page}
      initialSearch={filters.search}
      initialMinFundamentals={filters.minFundamentals}
      initialMinOpportunity={filters.minOpportunity}
    />
  );
}
