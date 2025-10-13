"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Breadcrumbs,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { formatDate, formatMetric, formatScore, type MetricFormat } from "@/lib/formatters";
import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/lib/ranking/metricDefinitions";
import type { RankedEtf } from "@/lib/ranking/types";

type DetailFormat = MetricFormat | "date" | "list" | "raw";

interface DetailItem {
  label: string;
  value: number | string | string[] | null | undefined;
  format?: DetailFormat;
}

interface DetailSection {
  title: string;
  items: DetailItem[];
}

interface EtfDetailsViewProps {
  etf: RankedEtf;
}

function renderDetailValue(item: DetailItem): string {
  const { value, format } = item;

  if (format === "list") {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "—";
    }
    return typeof value === "string" && value.length > 0 ? value : "—";
  }

  if (format === "date") {
    return formatDate(typeof value === "string" ? value : null);
  }

  if (format === "raw") {
    if (value === null || value === undefined) {
      return "—";
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  }

  return formatMetric(value as number | string | null | undefined, format);
}

function buildDetailSections(etf: RankedEtf): DetailSection[] {
  const raw = etf.raw;

  return [
    {
      title: "Identificação",
      items: [
        { label: "Símbolo", value: etf.symbol, format: "raw" },
        { label: "Nome", value: raw.name, format: "raw" },
        { label: "Classe de Ativo", value: raw.assetClass, format: "raw" },
        { label: "Categoria", value: raw.etfCategory, format: "raw" },
        { label: "Emissor", value: raw.issuer, format: "raw" },
        { label: "Índice", value: raw.etfIndex, format: "raw" },
        { label: "Bolsa", value: raw.exchange, format: "raw" },
        { label: "Região", value: raw.etfRegion, format: "raw" },
        { label: "País", value: raw.etfCountry, format: "raw" },
        { label: "Alavancagem", value: raw.etfLeverage, format: "raw" },
        { label: "Opções disponíveis", value: raw.optionable, format: "raw" },
        { label: "Início", value: raw.inceptionDate, format: "date" },
        { label: "CUSIP", value: raw.cusip, format: "raw" },
        { label: "ISIN", value: raw.isin, format: "raw" },
        { label: "Tags", value: Array.isArray(raw.tags) ? raw.tags : [], format: "list" },
      ],
    },
    {
      title: "Ativos e Holdings",
      items: [
        { label: "Assets", value: raw.assets, format: "compact" },
        { label: "Holdings", value: raw.holdings ?? raw.holdingsCount, format: "number" },
      ],
    },
    {
      title: "Preços e Mercado",
      items: [
        { label: "Preço atual", value: raw.price ?? raw.close },
        { label: "Abertura", value: raw.open },
        { label: "Máxima", value: raw.high },
        { label: "Mínima", value: raw.low },
        { label: "Fechamento", value: raw.close },
        { label: "Fechamento anterior", value: raw.preClose },
        { label: "Premarket Close", value: raw.premarketClose ?? raw.preClose },
        { label: "Pré-market preço", value: raw.premarketPrice },
        { label: "Pré-market %", value: raw.premarketChangePercent, format: "percent" },
        { label: "Pré-market volume", value: raw.premarketVolume, format: "compact" },
        { label: "After-hours preço", value: raw.afterHoursPrice ?? raw.postmarketPrice },
        { label: "After-hours %", value: raw.afterHoursChangePercent ?? raw.postmarketChangePercent, format: "percent" },
        { label: "After-hours close", value: raw.afterHoursClose ?? raw.postClose },
        { label: "Movimento intradiário", value: raw.changeFromOpen, format: "percent" },
        { label: "Gap diário", value: raw.daysGap, format: "percent" },
        { label: "Volume", value: raw.volume, format: "compact" },
      ],
    },
    {
      title: "Liquidez e Volume",
      items: [
        { label: "Volume financeiro", value: raw.dollarVolume, format: "compact" },
        { label: "Volume médio", value: raw.averageVolume, format: "compact" },
        { label: "Volume relativo", value: raw.relativeVolume },
        { label: "Ações em circulação", value: raw.sharesOut, format: "compact" },
      ],
    },
    {
      title: "Indicadores Técnicos",
      items: [
        { label: "RSI", value: raw.rsi },
        { label: "RSI semanal", value: raw.rsiWeekly },
        { label: "RSI mensal", value: raw.rsiMonthly },
        { label: "ATR", value: raw.atr },
        { label: "Sharpe", value: raw.sharpeRatio },
        { label: "Sortino", value: raw.sortinoRatio },
        { label: "Média 20", value: raw.ma20 },
        { label: "Média 50", value: raw.ma50 },
        { label: "Média 150", value: raw.ma150 },
        { label: "Média 200", value: raw.ma200 },
        { label: "MA20 var %", value: raw.ma20ch },
        { label: "MA50 var %", value: raw.ma50ch },
        { label: "MA150 var %", value: raw.ma150ch },
        { label: "MA200 var %", value: raw.ma200ch },
        { label: "Beta (5Y)", value: raw.beta },
        { label: "P/L", value: raw.peRatio },
      ],
    },
    {
      title: "Variação Percentual",
      items: [
        { label: "1D", value: raw.ch1d, format: "percent" },
        { label: "1M", value: raw.ch1m, format: "percent" },
        { label: "3M", value: raw.ch3m, format: "percent" },
        { label: "6M", value: raw.ch6m, format: "percent" },
        { label: "YTD", value: raw.chYTD, format: "percent" },
        { label: "1A", value: raw.ch1y, format: "percent" },
        { label: "3A", value: raw.ch3y, format: "percent" },
        { label: "5A", value: raw.ch5y, format: "percent" },
        { label: "10A", value: raw.ch10y, format: "percent" },
        { label: "15A", value: raw.ch15y, format: "percent" },
        { label: "20A", value: raw.ch20y, format: "percent" },
      ],
    },
    {
      title: "Total Return",
      items: [
        { label: "TR 1M", value: raw.tr1m, format: "percent" },
        { label: "TR 3M", value: raw.tr3m, format: "percent" },
        { label: "TR 6M", value: raw.tr6m, format: "percent" },
        { label: "TR YTD", value: raw.trYTD, format: "percent" },
        { label: "TR 1A", value: raw.tr1y, format: "percent" },
        { label: "TR 3A", value: raw.tr3y, format: "percent" },
        { label: "TR 5A", value: raw.tr5y, format: "percent" },
        { label: "TR 10A", value: raw.tr10y, format: "percent" },
        { label: "TR 15A", value: raw.tr15y, format: "percent" },
        { label: "TR 20A", value: raw.tr20y, format: "percent" },
      ],
    },
    {
      title: "CAGR",
      items: [
        { label: "CAGR 1A", value: raw.cagr1y, format: "percent" },
        { label: "CAGR 3A", value: raw.cagr3y, format: "percent" },
        { label: "CAGR 5A", value: raw.cagr5y, format: "percent" },
        { label: "CAGR 10A", value: raw.cagr10y, format: "percent" },
        { label: "CAGR 15A", value: raw.cagr15y, format: "percent" },
        { label: "CAGR 20A", value: raw.cagr20y, format: "percent" },
      ],
    },
    {
      title: "Dividendos",
      items: [
        { label: "Dividend Per Share", value: raw.dps },
        { label: "Último dividendo", value: raw.lastDividend },
        { label: "Dividend Yield", value: raw.dividendYield, format: "percent" },
        { label: "Crescimento de dividendos", value: raw.dividendGrowth },
        { label: "Anos de crescimento", value: raw.dividendGrowthYears, format: "number" },
        { label: "Dividend Growth (3Y)", value: raw.divCAGR3 },
        { label: "Dividend Growth (5Y)", value: raw.divCAGR5 },
        { label: "Dividend Growth (10Y)", value: raw.divCAGR10 },
        { label: "Payout", value: raw.payoutRatio },
        { label: "Frequência de pagamento", value: raw.payoutFrequency, format: "raw" },
        { label: "Ex-dividend", value: raw.exDivDate, format: "date" },
        { label: "Pagamento", value: raw.paymentDate, format: "date" },
      ],
    },
    {
      title: "Extremos e Histórico",
      items: [
        { label: "Mínimo 52S", value: raw.low52 },
        { label: "Máximo 52S", value: raw.high52 },
        { label: "Variação vs. mín. 52S", value: raw.low52ch },
        { label: "Variação vs. máx. 52S", value: raw.high52ch },
        { label: "Máxima histórica", value: raw.allTimeHigh },
        { label: "Variação da máxima (%)", value: raw.allTimeHighChange, format: "percent" },
        { label: "Data da máxima", value: raw.allTimeHighDate, format: "date" },
        { label: "Mínima histórica", value: raw.allTimeLow },
        { label: "Variação da mínima (%)", value: raw.allTimeLowChange, format: "percent" },
        { label: "Data da mínima", value: raw.allTimeLowDate, format: "date" },
      ],
    },
  ];
}

export function EtfDetailsView({ etf }: EtfDetailsViewProps) {
  const theme = useTheme();

  const detailSections = useMemo(() => buildDetailSections(etf), [etf]);

  const fundamentalsBreakdown = useMemo(() => {
    return FUNDAMENTAL_DEFINITIONS.map((def) => {
      const weight = def.weight ?? 0;
      const weightedScore = etf.scores.fundamentalsComponents[def.key] ?? 0;
      const normalizedScore = weight > 0 ? weightedScore / weight : 0;
      return {
        key: def.key,
        label: def.label,
        value: def.getter(etf),
        format: def.format,
        weight,
        score: Math.max(0, Math.min(100, normalizedScore)),
      };
    });
  }, [etf]);

  const opportunityBreakdown = useMemo(() => {
    return OPPORTUNITY_DEFINITIONS.map((def) => {
      const weight = def.weight ?? 0;
      const weightedScore = etf.scores.opportunityComponents[def.key] ?? 0;
      const normalizedScore = weight > 0 ? weightedScore / weight : 0;
      return {
        key: def.key,
        label: def.label,
        value: def.getter(etf),
        format: def.format,
        weight,
        score: Math.max(0, Math.min(100, normalizedScore)),
      };
    });
  }, [etf]);

  const rawJson = useMemo(() => JSON.stringify(etf.raw, null, 2), [etf.raw]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.secondary">Ranking</Typography>
          </Link>
          <Typography color="text.primary">{etf.symbol}</Typography>
        </Breadcrumbs>

        <Stack spacing={2}>
          <Typography variant="h3" fontWeight={700}>
            {etf.symbol}
          </Typography>
          <Typography variant="h5" fontWeight={600}>
            {etf.raw.name ?? "Nome indisponível"}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Categoria: ${etf.raw.etfCategory ?? "Não informada"}`} color="primary" variant="outlined" />
            {etf.raw.issuer && <Chip label={`Emissor: ${etf.raw.issuer}`} variant="outlined" />}
            {etf.raw.exchange && <Chip label={etf.raw.exchange} variant="outlined" />}
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Score Final
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {formatScore(etf.scores.final)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Média ponderada de Fundamentos e Oportunidade.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fundamentos
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {formatScore(etf.scores.fundamentals)}
              </Typography>
              <LinearProgress variant="determinate" value={etf.scores.fundamentals} sx={{ mt: 2 }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Oportunidade
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {formatScore(etf.scores.opportunity)}
              </Typography>
              <LinearProgress color="secondary" variant="determinate" value={etf.scores.opportunity} sx={{ mt: 2 }} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Componentes de Fundamentos
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Indicador</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="right">Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fundamentalsBreakdown.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align="right">{renderDetailValue({ label: item.label, value: item.value, format: item.format })}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={`Peso ${item.weight ?? 0}`}>
                            <Typography variant="body2" fontWeight={600} component="span">
                              {formatScore(item.score)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Componentes de Oportunidade
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Indicador</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="right">Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {opportunityBreakdown.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align="right">{renderDetailValue({ label: item.label, value: item.value, format: item.format })}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={`Peso ${item.weight ?? 0}`}>
                            <Typography variant="body2" fontWeight={600} component="span">
                              {formatScore(item.score)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {detailSections.map((section) => (
          <Accordion key={section.title} defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{section.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableBody>
                  {section.items.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell sx={{ border: 0, width: "40%" }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 0 }} align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {renderDetailValue(item)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))}

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Ver dados brutos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                bgcolor: theme.palette.mode === "dark" ? "#0f172a" : "grey.900",
                color: "grey.100",
                p: 2,
                borderRadius: 2,
                overflowX: "auto",
                fontSize: 12,
              }}
            >
              {rawJson}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Container>
  );
}

export default EtfDetailsView;
