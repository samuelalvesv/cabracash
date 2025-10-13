import Link from "next/link";

import { fetchMarketData, type MarketApiResponse } from "@/lib/marketData";
import styles from "./page.module.css";

const PAGE_SIZE = 12;

const METRIC_FIELDS: Array<{ key: string; label: string }> = [
  { key: "open", label: "Abertura" },
  { key: "close", label: "Fechamento" },
  { key: "high", label: "Alta" },
  { key: "low", label: "Baixa" },
  { key: "premarketPrice", label: "Pré-market" },
  { key: "postmarketPrice", label: "Pós-market" },
  { key: "dollarVolume", label: "Volume ($)" },
  { key: "averageVolume", label: "Volume Médio" },
  { key: "dividendYield", label: "Dividendo (%)" },
  { key: "expenseRatio", label: "Taxa Adm. (%)" },
];

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 2,
});

type MetricValue = MarketApiResponse["data"]["data"][string][string];

function formatValue(value: MetricValue): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    const abs = Math.abs(value);

    if (abs >= 1_000_000) {
      return compactFormatter.format(value);
    }

    if (abs >= 1_000) {
      return integerFormatter.format(value);
    }

    return decimalFormatter.format(value);
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return value;
}

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
  const marketResponse = await fetchMarketData();
  const entries = Object.entries(marketResponse.data?.data ?? {});
  const totalItems = entries.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 1;
  const currentPage = Math.min(getPageNumber(searchParams?.page), totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const visibleEntries = entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Panorama de ETFs</h1>
            <p className={styles.subtitle}>
              Dados obtidos diretamente do endpoint da StockAnalysis e normalizados via API interna.
            </p>
          </div>
          <span className={styles.badge}>Status: {marketResponse.status}</span>
        </header>

        {totalItems > 0 ? (
          <p className={styles.helper}>
            Mostrando {startIndex}–{endIndex} de {totalItems} ativos disponíveis.
          </p>
        ) : (
          <p className={styles.helper}>Nenhum ativo disponível no momento.</p>
        )}

        <div className={styles.grid}>
          {visibleEntries.map(([symbol, metrics]) => (
            <section key={symbol} className={styles.card}>
              <header className={styles.cardHeader}>
                <h2>{symbol}</h2>
                <p>{formatValue(metrics.exchange)}</p>
              </header>

              <ul className={styles.metrics}>
                {METRIC_FIELDS.map(({ key, label }) => (
                  <li key={key} className={styles.metricItem}>
                    <span className={styles.metricLabel}>{label}</span>
                    <span className={styles.metricValue}>{formatValue(metrics[key])}</span>
                  </li>
                ))}
              </ul>

              <ul className={styles.meta}>
                <li>
                  <span className={styles.metaLabel}>Categoria</span>
                  <span>{formatValue(metrics.etfCategory)}</span>
                </li>
                <li>
                  <span className={styles.metaLabel}>Gestora</span>
                  <span>{formatValue(metrics.issuer)}</span>
                </li>
                <li>
                  <span className={styles.metaLabel}>Índice</span>
                  <span>{formatValue(metrics.etfIndex)}</span>
                </li>
              </ul>
            </section>
          ))}
        </div>

        <details className={styles.raw}>
          <summary>Ver resposta bruta</summary>
          <pre>{JSON.stringify(marketResponse, null, 2)}</pre>
        </details>

        {totalItems > 0 && (
          <nav className={styles.pagination} aria-label="Paginação de ETFs">
            <Link
              className={`${styles.paginationButton} ${!hasPrevious ? styles.paginationButtonDisabled : ""}`}
              aria-disabled={!hasPrevious}
              tabIndex={hasPrevious ? undefined : -1}
              href={hasPrevious ? (currentPage - 1 === 1 ? "/" : `?page=${currentPage - 1}`) : "/"}
              prefetch={false}
            >
              Anterior
            </Link>
            <span className={styles.paginationStatus}>
              Página {currentPage} de {totalPages}
            </span>
            <Link
              className={`${styles.paginationButton} ${!hasNext ? styles.paginationButtonDisabled : ""}`}
              aria-disabled={!hasNext}
              tabIndex={hasNext ? undefined : -1}
              href={hasNext ? `?page=${currentPage + 1}` : `/`}
              prefetch={false}
            >
              Próxima
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
