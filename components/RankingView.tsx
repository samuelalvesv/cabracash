"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardActionArea,
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
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";

import type { RankedEtf } from "@/lib/ranking/types";
import { formatMetric, formatScore } from "@/lib/formatters";
import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/lib/ranking/metricDefinitions";
import { useColorMode } from "@/hooks/useColorMode";

interface RankingViewProps {
  items: RankedEtf[];
  pageSize: number;
  initialPage: number;
  initialSearch?: string;
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
                  <CardActionArea
                    component={Link}
                    href={`/etf/${item.symbol}`}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      alignItems: "stretch",
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
                            {FUNDAMENTAL_DEFINITIONS.map(({ key, label, getter, format }) => (
                              <TableRow key={key}>
                                <TableCell sx={{ border: 0 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {label}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ border: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatMetric(getter(item), format)}
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
                            {OPPORTUNITY_DEFINITIONS.map(({ key, label, getter, format }) => (
                              <TableRow key={key}>
                                <TableCell sx={{ border: 0 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {label}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ border: 0 }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatMetric(getter(item), format)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Stack>

                  </CardContent>
                </CardActionArea>
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
