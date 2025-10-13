"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SearchIcon from "@mui/icons-material/Search";

import type { RankedEtf } from "@/lib/ranking/types";
import { useColorMode } from "@/hooks/useColorMode";

interface RankingViewProps {
  items: RankedEtf[];
  pageSize: number;
  initialPage: number;
  initialSearch?: string;
}

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

type MetricFormat = "percent" | "number" | "decimal";

function formatMetricValue(value: number | string | null | undefined, format: MetricFormat = "decimal") {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Number.isNaN(value)) {
    return "—";
  }

  switch (format) {
    case "percent":
      return `${percentFormatter.format(value)}%`;
    case "number":
      return numberFormatter.format(value);
    default:
      return decimalFormatter.format(value);
  }
}

function formatScore(score: number) {
  return decimalFormatter.format(score);
}

function buildSearchText(item: RankedEtf): string {
  const strings: string[] = [item.symbol];
  const raw = item.raw;

  const candidateKeys = [
    "fundName",
    "name",
    "etfCategory",
    "issuer",
    "etfIndex",
    "tags",
  ];

  candidateKeys.forEach((key) => {
    const value = raw?.[key];
    if (typeof value === "string") {
      strings.push(value);
    }
  });

  return strings.join(" ").toLowerCase();
}

export function RankingView({ items, pageSize, initialPage, initialSearch = "" }: RankingViewProps) {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

  const [searchValue, setSearchValue] = useState(initialSearch);
  const trimmedInitial = initialSearch.trim();
  const [debouncedValue, setDebouncedValue] = useState(trimmedInitial);
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedInitial.toLowerCase());
  const [page, setPage] = useState(initialPage);
  const previousSearchRef = useRef(trimmedInitial);
  const pathnameRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    pathnameRef.current = window.location.pathname;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextSearch = (params.get("search") ?? "").trim();
      setSearchValue(nextSearch);
      setDebouncedValue(nextSearch);
      setDebouncedQuery(nextSearch.toLowerCase());
      previousSearchRef.current = nextSearch;

      const nextPage = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10));
      setPage(nextPage);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchValue.trim();
      setDebouncedValue(trimmed);
      setDebouncedQuery(trimmed.toLowerCase());
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  const updateUrl = useCallback((nextPage: number, nextSearch: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (nextPage > 1) {
      params.set("page", nextPage.toString());
    } else {
      params.delete("page");
    }

    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch.length > 0) {
      params.set("search", trimmedSearch);
    } else {
      params.delete("search");
    }

    const nextQuery = params.toString();
    const basePath = pathnameRef.current || window.location.pathname;
    const nextUrl = nextQuery.length > 0 ? `${basePath}?${nextQuery}` : basePath;

    window.history.replaceState(null, "", nextUrl);
  }, []);

  // Reset page when search changes and update URL
  useEffect(() => {
    if (previousSearchRef.current !== debouncedValue) {
      previousSearchRef.current = debouncedValue;
      setPage(1);
      updateUrl(1, debouncedValue);
    }
  }, [debouncedValue, updateUrl]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) {
      return items;
    }
    return items.filter((item) => {
      const text = buildSearchText(item);
      return text.includes(debouncedQuery);
    });
  }, [items, debouncedQuery]);

  const totalItems = filteredItems.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredItems, safePage, pageSize],
  );

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage);
      updateUrl(newPage, debouncedValue);
    },
    [updateUrl, debouncedValue],
  );

  const helperText = useMemo(() => {
    if (totalItems === 0) {
      return debouncedValue
        ? `Nenhum ETF encontrado para "${debouncedValue}".`
        : "Nenhum ETF encontrado para compor o ranking.";
    }

    const totalFormat = new Intl.NumberFormat("pt-BR").format(totalItems);
    return `Mostrando ${startIndex}–${endIndex} de ${totalFormat} ETFs ranqueados.`;
  }, [debouncedValue, endIndex, startIndex, totalItems]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h3" fontWeight={700}>
              Ranking unificado de ETFs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fundamentos e oportunidade de compra analisados de forma independente da categoria declarada.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title={`Alternar para modo ${mode === "dark" ? "claro" : "escuro"}`} arrow>
              <Paper
                variant="outlined"
                sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, borderRadius: 999, backdropFilter: "blur(8px)" }}
              >
                <IconButton color="primary" onClick={toggleColorMode} aria-label="Alternar tema" size="small">
                  {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Paper>
            </Tooltip>
            <Chip label={`Total: ${totalItems}`} color="primary" variant="outlined" />
          </Stack>
        </Stack>

        <TextField
          fullWidth
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Pesquisar por nome, código ou categoria"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 999 },
            },
          }}
        />

        <Alert severity={totalItems === 0 ? "warning" : "info"}>{helperText}</Alert>

        {totalPages > 1 && (
          <Stack alignItems="center">
            <Pagination
              page={safePage}
              count={totalPages}
              color="primary"
              variant="outlined"
              onChange={handlePageChange}
              size="medium"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}

        <Box
          sx={{
            display: "grid",
            gap: 3,
            justifyContent: "center",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: `repeat(2, minmax(0, 320px))`,
              lg: `repeat(3, minmax(0, 340px))`,
            },
          }}
        >
          {pageItems.map((item, idx) => {
            const position = startIndex + idx;
            const { scores, raw } = item;
            const rawJson = JSON.stringify(raw, null, 2);

            return (
              <Box key={item.symbol} sx={{ display: "flex", width: "100%" }}>
                <Card
                  variant="outlined"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      flexGrow: 1,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5" fontWeight={700}>
                        #{position} • {item.symbol}
                      </Typography>
                      <Chip label={`Score ${formatScore(scores.final)}`} color="primary" size="medium" />
                    </Stack>

                    <Typography variant="subtitle1" fontWeight={600}>
                      {typeof raw?.name === "string" && raw.name.length > 0 ? raw.name : "Nome indisponível"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={typeof raw?.etfCategory === "string" && raw.etfCategory.length > 0 ? raw.etfCategory : "Categoria indefinida"}
                        color="secondary"
                        variant="outlined"
                      />
                      {typeof raw?.issuer === "string" && raw.issuer.length > 0 && (
                        <Chip size="small" label={raw.issuer} variant="outlined" />
                      )}
                    </Stack>

                    <Stack spacing={2} flexGrow={1}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Fundamentos
                        </Typography>
                        <LinearProgress variant="determinate" value={scores.fundamentals} sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          {formatScore(scores.fundamentals)}
                        </Typography>
                        <Table size="small">
                          <TableBody>
                            {FUNDAMENTAL_CONFIG.map(({ key, label, getValue, format }) => (
                              <TableRow key={key}>
                                <TableCell sx={{ border: 0 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {label}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ border: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatMetricValue(getValue(item), format)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                      <Divider />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Oportunidade
                        </Typography>
                        <LinearProgress color="secondary" variant="determinate" value={scores.opportunity} sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          {formatScore(scores.opportunity)}
                        </Typography>
                        <Table size="small">
                          <TableBody>
                            {OPPORTUNITY_CONFIG.map(({ key, label, getValue, format }) => (
                              <TableRow key={key}>
                                <TableCell sx={{ border: 0 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {label}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ border: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatMetricValue(getValue(item), format)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Stack>

                    <Accordion elevation={0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Ver dados brutos
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
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
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {totalItems > 0 && totalPages > 1 && (
          <Stack alignItems="center" spacing={2}>
            <Pagination
              page={safePage}
              count={totalPages}
              color="primary"
              variant="outlined"
              onChange={handlePageChange}
              size="large"
              showFirstButton
              showLastButton
            />
            <Typography variant="caption" color="text.secondary">
              Página {safePage} de {totalPages}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default RankingView;
type MetricConfig = {
  key: string;
  label: string;
  format?: MetricFormat;
  getValue: (item: RankedEtf) => number | string | null | undefined;
};

const FUNDAMENTAL_CONFIG: MetricConfig[] = [
  { key: "expenseRatio", label: "Custo", format: "percent", getValue: (item) => item.raw.expenseRatio as number | null | undefined },
  { key: "dollarVolume", label: "Liquidez (log)", getValue: (item) => item.features.dollarVolume },
  { key: "issuerScore", label: "Emissor (score)", getValue: (item) => item.features.issuerScore },
  { key: "sharpeRatio", label: "Sharpe", getValue: (item) => item.raw.sharpeRatio as number | null | undefined },
  { key: "sortinoRatio", label: "Sortino", getValue: (item) => item.raw.sortinoRatio as number | null | undefined },
  { key: "dividendYield", label: "Yield", format: "percent", getValue: (item) => item.raw.dividendYield as number | null | undefined },
  { key: "dividendGrowthYears", label: "Dividendos (anos)", format: "number", getValue: (item) => item.raw.dividendGrowthYears as number | null | undefined },
  { key: "dividendGrowth", label: "Crescimento Div.", getValue: (item) => item.raw.dividendGrowth as number | null | undefined },
  { key: "betaDeviation", label: "Beta (desvio)", getValue: (item) => item.features.betaDeviation },
  { key: "atrRatio", label: "ATR/Preço", getValue: (item) => item.features.atrRatio },
];

const OPPORTUNITY_CONFIG: MetricConfig[] = [
  { key: "top52Distance", label: "Dist. Topo 52", getValue: (item) => item.features.top52Distance },
  { key: "bottom52Distance", label: "Dist. Fundo 52", getValue: (item) => item.features.bottom52Distance },
  { key: "movingAverageCombo", label: "Médias Móveis", getValue: (item) => item.features.movingAverageCombo },
  { key: "rsi", label: "RSI", getValue: (item) => item.raw.rsi as number | null | undefined, format: "decimal" },
  { key: "relativeVolume", label: "Volume Rel.", getValue: (item) => item.raw.relativeVolume as number | null | undefined },
  { key: "totalReturn1m", label: "Retorno 1m", getValue: (item) => item.raw.tr1m as number | null | undefined },
  { key: "intradayChange", label: "Mov. Intradiário", getValue: (item) => item.raw.changeFromOpen as number | null | undefined },
];
