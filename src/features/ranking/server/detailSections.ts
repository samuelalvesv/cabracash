import type { RankedEtf } from "@/features/ranking/server/types";
import { formatDate, formatMetric, type MetricFormat } from "@/shared/utils/formatters";

export type DetailFormat = MetricFormat | "date" | "list";

export type DetailValue = number | string | string[] | null | undefined;

export interface DetailItemConfig {
  key: string;
  label: string;
  getValue: (etf: RankedEtf) => DetailValue;
  format?: DetailFormat;
  defaultVisible?: boolean;
}

export interface DetailSectionConfig {
  id: string;
  title: string;
  items: DetailItemConfig[];
}

export interface ResolvedDetailItem {
  key: string;
  label: string;
  format?: DetailFormat;
  value: DetailValue;
}

export interface ResolvedDetailSection {
  id: string;
  title: string;
  items: ResolvedDetailItem[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const detailSectionsConfig: DetailSectionConfig[] = [
  {
    id: "identification",
    title: "Identificação",
    items: [
      { key: "symbol", label: "Símbolo", format: "raw", defaultVisible: true, getValue: (etf) => etf.symbol },
      { key: "name", label: "Nome", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.name },
      { key: "assetClass", label: "Classe de Ativo", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.assetClass },
      { key: "etfCategory", label: "Categoria", format: "raw", defaultVisible: true, getValue: (etf) => etf.raw.etfCategory },
      { key: "issuer", label: "Emissor", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.issuer },
      { key: "etfIndex", label: "Índice", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.etfIndex },
      { key: "exchange", label: "Bolsa", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.exchange },
      { key: "etfRegion", label: "Região", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.etfRegion },
      { key: "etfCountry", label: "País", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.etfCountry },
      { key: "etfLeverage", label: "Alavancagem", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.etfLeverage },
      { key: "optionable", label: "Opções disponíveis", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.optionable },
      { key: "inceptionDate", label: "Início", format: "date", defaultVisible: false, getValue: (etf) => etf.raw.inceptionDate },
      { key: "cusip", label: "CUSIP", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.cusip },
      { key: "isin", label: "ISIN", format: "raw", defaultVisible: false, getValue: (etf) => etf.raw.isin },
      {
        key: "tags",
        label: "Tags",
        defaultVisible: false,
        format: "list",
        getValue: (etf) => {
          const tags = etf.raw.tags;
          if (Array.isArray(tags)) {
            return tags;
          }
          return [];
        },
      },
    ],
  },
  {
    id: "assetsHoldings",
    title: "Ativos e Holdings",
    items: [
      { key: "assets", label: "Assets", format: "compact", getValue: (etf) => etf.raw.assets },
      { key: "holdings", label: "Holdings", format: "number", getValue: (etf) => etf.raw.holdings ?? etf.raw.holdingsCount },
    ],
  },
  {
    id: "pricesMarket",
    title: "Preços e Mercado",
    items: [
      { key: "price", label: "Preço atual", getValue: (etf) => etf.raw.price ?? etf.raw.close },
      { key: "open", label: "Abertura", getValue: (etf) => etf.raw.open },
      { key: "high", label: "Máxima", getValue: (etf) => etf.raw.high },
      { key: "low", label: "Mínima", getValue: (etf) => etf.raw.low },
      { key: "close", label: "Fechamento", getValue: (etf) => etf.raw.close },
      { key: "preClose", label: "Fechamento anterior", getValue: (etf) => etf.raw.preClose },
      { key: "premarketClose", label: "Premarket Close", getValue: (etf) => etf.raw.premarketClose ?? etf.raw.preClose },
      { key: "premarketPrice", label: "Pré-market preço", getValue: (etf) => etf.raw.premarketPrice },
      { key: "premarketChangePercent", label: "Pré-market %", format: "percent", getValue: (etf) => etf.raw.premarketChangePercent },
      { key: "premarketVolume", label: "Pré-market volume", format: "compact", getValue: (etf) => etf.raw.premarketVolume },
      { key: "afterHoursPrice", label: "After-hours preço", getValue: (etf) => etf.raw.afterHoursPrice ?? etf.raw.postmarketPrice },
      {
        key: "afterHoursChangePercent",
        label: "After-hours %",
        format: "percent",
        getValue: (etf) => etf.raw.afterHoursChangePercent ?? etf.raw.postmarketChangePercent,
      },
      { key: "afterHoursClose", label: "After-hours close", getValue: (etf) => etf.raw.afterHoursClose ?? etf.raw.postClose },
      { key: "changeFromOpen", label: "Movimento intradiário", format: "percent", getValue: (etf) => etf.raw.changeFromOpen },
      { key: "daysGap", label: "Gap diário", format: "percent", getValue: (etf) => etf.raw.daysGap },
      { key: "volume", label: "Volume", format: "compact", getValue: (etf) => etf.raw.volume },
    ],
  },
  {
    id: "liquidityVolume",
    title: "Liquidez e Volume",
    items: [
      { key: "liquidityComposite", label: "Liquidez composta (score)", format: "decimal", getValue: (etf) => etf.features.liquidityComposite },
      { key: "dollarVolume", label: "Volume financeiro", format: "compact", getValue: (etf) => etf.raw.dollarVolume },
      { key: "averageVolume", label: "Volume médio", format: "compact", getValue: (etf) => etf.raw.averageVolume },
      { key: "relativeVolume", label: "Volume relativo", getValue: (etf) => etf.raw.relativeVolume },
      { key: "sharesOut", label: "Ações em circulação", format: "compact", getValue: (etf) => etf.raw.sharesOut },
    ],
  },
  {
    id: "riskTracking",
    title: "Risco e Tracking",
    items: [
      { key: "riskAdjustedReturn", label: "Score risco/retorno", format: "decimal", getValue: (etf) => etf.features.riskAdjustedReturn },
      { key: "riskBalance", label: "Risco balanceado", format: "decimal", getValue: (etf) => etf.features.riskBalance },
      { key: "trackingEfficiency", label: "Tracking (abs)", format: "decimal", getValue: (etf) => etf.features.trackingEfficiency },
      { key: "beta", label: "Beta (5Y)", getValue: (etf) => etf.raw.beta },
      {
        key: "atrRatio",
        label: "ATR/Preço",
        format: "decimal",
        getValue: (etf) => {
          const atr = toNumber(etf.raw.atr);
          const base = [etf.raw.close, etf.raw.price, etf.raw.preClose, etf.raw.open]
            .map(toNumber)
            .find((value) => value !== null && value > 0);
          if (atr === null || base === undefined || base === null) {
            return null;
          }
          return atr / Math.max(base, 1);
        },
      },
    ],
  },
  {
    id: "technicalIndicators",
    title: "Indicadores Técnicos",
    items: [
      { key: "rsi", label: "RSI", getValue: (etf) => etf.raw.rsi },
      { key: "rsiWeekly", label: "RSI semanal", getValue: (etf) => etf.raw.rsiWeekly },
      { key: "rsiMonthly", label: "RSI mensal", getValue: (etf) => etf.raw.rsiMonthly },
      { key: "atr", label: "ATR", getValue: (etf) => etf.raw.atr },
      { key: "ma20", label: "Média 20", getValue: (etf) => etf.raw.ma20 },
      { key: "ma50", label: "Média 50", getValue: (etf) => etf.raw.ma50 },
      { key: "ma150", label: "Média 150", getValue: (etf) => etf.raw.ma150 },
      { key: "ma200", label: "Média 200", getValue: (etf) => etf.raw.ma200 },
      { key: "ma20ch", label: "MA20 var %", getValue: (etf) => etf.raw.ma20ch },
      { key: "ma50ch", label: "MA50 var %", getValue: (etf) => etf.raw.ma50ch },
      { key: "ma150ch", label: "MA150 var %", getValue: (etf) => etf.raw.ma150ch },
      { key: "ma200ch", label: "MA200 var %", getValue: (etf) => etf.raw.ma200ch },
      { key: "peRatio", label: "P/L", getValue: (etf) => etf.raw.peRatio },
      { key: "gapSignal", label: "Gap pré/pós-market", format: "percent", getValue: (etf) => etf.features.gapSignal },
    ],
  },
  {
    id: "percentChange",
    title: "Variação Percentual",
    items: [
      { key: "ch1d", label: "1D", format: "percent", getValue: (etf) => etf.raw.ch1d },
      { key: "ch1m", label: "1M", format: "percent", getValue: (etf) => etf.raw.ch1m },
      { key: "ch3m", label: "3M", format: "percent", getValue: (etf) => etf.raw.ch3m },
      { key: "ch6m", label: "6M", format: "percent", getValue: (etf) => etf.raw.ch6m },
      { key: "chYTD", label: "YTD", format: "percent", getValue: (etf) => etf.raw.chYTD },
      { key: "ch1y", label: "1A", format: "percent", getValue: (etf) => etf.raw.ch1y },
      { key: "ch3y", label: "3A", format: "percent", getValue: (etf) => etf.raw.ch3y },
      { key: "ch5y", label: "5A", format: "percent", getValue: (etf) => etf.raw.ch5y },
      { key: "ch10y", label: "10A", format: "percent", getValue: (etf) => etf.raw.ch10y },
      { key: "ch15y", label: "15A", format: "percent", getValue: (etf) => etf.raw.ch15y },
      { key: "ch20y", label: "20A", format: "percent", getValue: (etf) => etf.raw.ch20y },
    ],
  },
  {
    id: "totalReturn",
    title: "Total Return",
    items: [
      { key: "tr1m", label: "TR 1M", format: "percent", getValue: (etf) => etf.raw.tr1m },
      { key: "tr3m", label: "TR 3M", format: "percent", getValue: (etf) => etf.raw.tr3m },
      { key: "tr6m", label: "TR 6M", format: "percent", getValue: (etf) => etf.raw.tr6m },
      { key: "trYTD", label: "TR YTD", format: "percent", getValue: (etf) => etf.raw.trYTD },
      { key: "tr1y", label: "TR 1A", format: "percent", getValue: (etf) => etf.raw.tr1y },
      { key: "tr3y", label: "TR 3A", format: "percent", getValue: (etf) => etf.raw.tr3y },
      { key: "tr5y", label: "TR 5A", format: "percent", getValue: (etf) => etf.raw.tr5y },
      { key: "tr10y", label: "TR 10A", format: "percent", getValue: (etf) => etf.raw.tr10y },
      { key: "tr15y", label: "TR 15A", format: "percent", getValue: (etf) => etf.raw.tr15y },
      { key: "tr20y", label: "TR 20A", format: "percent", getValue: (etf) => etf.raw.tr20y },
    ],
  },
  {
    id: "cagr",
    title: "CAGR",
    items: [
      { key: "cagr1y", label: "CAGR 1A", format: "percent", getValue: (etf) => etf.raw.cagr1y },
      { key: "cagr3y", label: "CAGR 3A", format: "percent", getValue: (etf) => etf.raw.cagr3y },
      { key: "cagr5y", label: "CAGR 5A", format: "percent", getValue: (etf) => etf.raw.cagr5y },
      { key: "cagr10y", label: "CAGR 10A", format: "percent", getValue: (etf) => etf.raw.cagr10y },
      { key: "cagr15y", label: "CAGR 15A", format: "percent", getValue: (etf) => etf.raw.cagr15y },
      { key: "cagr20y", label: "CAGR 20A", format: "percent", getValue: (etf) => etf.raw.cagr20y },
    ],
  },
  {
    id: "dividends",
    title: "Dividendos",
    items: [
      { key: "dps", label: "Dividend Per Share", getValue: (etf) => etf.raw.dps },
      { key: "lastDividend", label: "Último dividendo", getValue: (etf) => etf.raw.lastDividend },
      { key: "dividendYield", label: "Dividend Yield", format: "percent", getValue: (etf) => etf.raw.dividendYield },
      { key: "dividendGrowth", label: "Crescimento de dividendos", getValue: (etf) => etf.raw.dividendGrowth },
      { key: "dividendGrowthYears", label: "Anos de crescimento", format: "number", getValue: (etf) => etf.raw.dividendGrowthYears },
      { key: "dividendStability", label: "Estabilidade (score)", format: "decimal", getValue: (etf) => etf.features.dividendStability },
      { key: "divCAGR3", label: "Dividend Growth (3Y)", getValue: (etf) => etf.raw.divCAGR3 },
      { key: "divCAGR5", label: "Dividend Growth (5Y)", getValue: (etf) => etf.raw.divCAGR5 },
      { key: "divCAGR10", label: "Dividend Growth (10Y)", getValue: (etf) => etf.raw.divCAGR10 },
      { key: "payoutRatio", label: "Payout", getValue: (etf) => etf.raw.payoutRatio },
      { key: "payoutFrequency", label: "Frequência de pagamento", format: "raw", getValue: (etf) => etf.raw.payoutFrequency },
      { key: "exDivDate", label: "Ex-dividend", format: "date", getValue: (etf) => etf.raw.exDivDate },
      { key: "paymentDate", label: "Pagamento", format: "date", getValue: (etf) => etf.raw.paymentDate },
    ],
  },
  {
    id: "extremesHistory",
    title: "Extremos e Histórico",
    items: [
      { key: "low52", label: "Mínimo 52S", getValue: (etf) => etf.raw.low52 },
      { key: "high52", label: "Máximo 52S", getValue: (etf) => etf.raw.high52 },
      { key: "low52ch", label: "Variação vs. mín. 52S", getValue: (etf) => etf.raw.low52ch },
      { key: "high52ch", label: "Variação vs. máx. 52S", getValue: (etf) => etf.raw.high52ch },
      { key: "allTimeHigh", label: "Máxima histórica", getValue: (etf) => etf.raw.allTimeHigh },
      { key: "allTimeHighChange", label: "Variação da máxima (%)", format: "percent", getValue: (etf) => etf.raw.allTimeHighChange },
      { key: "allTimeHighDate", label: "Data da máxima", format: "date", getValue: (etf) => etf.raw.allTimeHighDate },
      { key: "allTimeLow", label: "Mínima histórica", getValue: (etf) => etf.raw.allTimeLow },
      { key: "allTimeLowChange", label: "Variação da mínima (%)", format: "percent", getValue: (etf) => etf.raw.allTimeLowChange },
      { key: "allTimeLowDate", label: "Data da mínima", format: "date", getValue: (etf) => etf.raw.allTimeLowDate },
    ],
  },
];

export const DETAIL_SECTIONS: readonly DetailSectionConfig[] = detailSectionsConfig;

export function buildDetailSections(etf: RankedEtf): ResolvedDetailSection[] {
  return detailSectionsConfig.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => ({
      key: item.key,
      label: item.label,
      format: item.format,
      value: item.getValue(etf),
    })),
  }));
}

export function formatDetailValue(value: DetailValue, format?: DetailFormat): string {
  if (format === "list") {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "—";
    }
    if (typeof value === "string") {
      return value.length > 0 ? value : "—";
    }
    return "—";
  }

  if (format === "date") {
    return formatDate(typeof value === "string" ? value : null);
  }

  const metricFormat = (format ?? "decimal") as MetricFormat;
  return formatMetric(value as number | string | null | undefined, metricFormat);
}
