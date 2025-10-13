import RankingView from "@/components/RankingView";
import { fetchRankedEtfs } from "@/lib/ranking/scoring";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function getPageNumber(rawPage: string | string[] | undefined): number {
  if (!rawPage) {
    return 1;
  }

  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function Home({ searchParams }: PageProps) {
  const rankedEtfs = await fetchRankedEtfs();

  const totalItems = rankedEtfs.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 1;
  const currentPage = Math.min(getPageNumber(searchParams?.page), totalPages);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);

  const items = rankedEtfs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <RankingView
      items={items}
      totalItems={totalItems}
      currentPage={currentPage}
      totalPages={totalPages}
      startIndex={startIndex}
      endIndex={endIndex}
    />
  );
}
