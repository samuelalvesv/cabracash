"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type SnackbarCloseReason,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridColumnVisibilityModel, type GridRenderCellParams } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Link from "next/link";

import type { RankedEtf } from "@/lib/ranking/types";
import { formatMetric, formatScore } from "@/lib/formatters";
import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/lib/ranking/metricDefinitions";
import { DETAIL_SECTIONS, formatDetailValue, type DetailItemConfig, type DetailValue } from "@/lib/ranking/detailSections";

type ViewMode = "cards" | "grid";

type DetailColumnConfig = DetailItemConfig & {
  sectionId: string;
  sectionTitle: string;
};

type RankingGridRow = {
  id: string;
  position: number;
} & Record<string, DetailValue>;

const DETAIL_COLUMN_CONFIGS: DetailColumnConfig[] = DETAIL_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    sectionId: section.id,
    sectionTitle: section.title,
  })),
);

const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = DETAIL_COLUMN_CONFIGS.reduce<Record<string, boolean>>(
  (acc, item) => {
    acc[item.key] = item.defaultVisible ?? true;
    return acc;
  },
  {},
);

const GRID_ROW_HEIGHT = 52;
const GRID_HEADER_HEIGHT = 56;

const clampScore = (value: number): number => Math.min(Math.max(value, 0), 100);

const parseThresholdInput = (value: string): number => {
  if (!value) {
    return 0;
  }

  const sanitized = value.replace(",", ".");
  const numeric = Number.parseFloat(sanitized);
  if (Number.isNaN(numeric)) {
    return 0;
  }

  return clampScore(numeric);
};

const sanitizeThresholdInput = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const normalized = parseThresholdInput(trimmed);
  return normalized > 0 ? normalized.toString() : "";
};

interface RankingViewProps {
  items: RankedEtf[];
  pageSize: number;
  initialPage: number;
  initialSearch?: string;
  initialMinFundamentals?: number;
  initialMinOpportunity?: number;
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

export function RankingView({
  items,
  pageSize,
  initialPage,
  initialSearch = "",
  initialMinFundamentals = 0,
  initialMinOpportunity = 0,
}: RankingViewProps) {


  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => ({
    ...DEFAULT_COLUMN_VISIBILITY,
  }));
  const [copyFeedback, setCopyFeedback] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const [searchValue, setSearchValue] = useState(initialSearch);
  const trimmedInitial = initialSearch.trim();
  const [debouncedValue, setDebouncedValue] = useState(trimmedInitial);
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedInitial.toLowerCase());
  const [page, setPage] = useState(initialPage);
  const previousSearchRef = useRef(trimmedInitial);
  const pathnameRef = useRef<string>("");

  const normalizedInitialFundamentals = clampScore(initialMinFundamentals);
  const normalizedInitialOpportunity = clampScore(initialMinOpportunity);
  const [minFundamentalsInput, setMinFundamentalsInput] = useState(
    normalizedInitialFundamentals > 0 ? normalizedInitialFundamentals.toString() : "",
  );
  const [minOpportunityInput, setMinOpportunityInput] = useState(
    normalizedInitialOpportunity > 0 ? normalizedInitialOpportunity.toString() : "",
  );

  const minFundamentals = useMemo(() => parseThresholdInput(minFundamentalsInput), [minFundamentalsInput]);
  const minOpportunity = useMemo(() => parseThresholdInput(minOpportunityInput), [minOpportunityInput]);
  const thresholdsActive = minFundamentals > 0 || minOpportunity > 0;
  const previousThresholdsRef = useRef({ fundamentals: normalizedInitialFundamentals, opportunity: normalizedInitialOpportunity });

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

      const nextFundamentals = parseThresholdInput(params.get("minFundamentals") ?? "");
      const nextOpportunity = parseThresholdInput(params.get("minOpportunity") ?? "");
      setMinFundamentalsInput(nextFundamentals > 0 ? nextFundamentals.toString() : "");
      setMinOpportunityInput(nextOpportunity > 0 ? nextOpportunity.toString() : "");
      previousThresholdsRef.current = { fundamentals: nextFundamentals, opportunity: nextOpportunity };
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

  const updateUrl = useCallback(
    (overrides?: Partial<{ page: number; search: string; fundamentals: number; opportunity: number }>) => {
      if (typeof window === "undefined") {
        return;
      }

      const params = new URLSearchParams(window.location.search);

      const nextPage = overrides?.page ?? page;
      if (nextPage > 1) {
        params.set("page", nextPage.toString());
      } else {
        params.delete("page");
      }

      const nextSearch = (overrides?.search ?? debouncedValue).trim();
      if (nextSearch.length > 0) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      const fundamentalsValue = overrides?.fundamentals ?? minFundamentals;
      if (fundamentalsValue > 0) {
        params.set("minFundamentals", fundamentalsValue.toString());
      } else {
        params.delete("minFundamentals");
      }

      const opportunityValue = overrides?.opportunity ?? minOpportunity;
      if (opportunityValue > 0) {
        params.set("minOpportunity", opportunityValue.toString());
      } else {
        params.delete("minOpportunity");
      }

      const nextQuery = params.toString();
      const basePath = pathnameRef.current || window.location.pathname;
      const nextUrl = nextQuery.length > 0 ? `${basePath}?${nextQuery}` : basePath;

      window.history.replaceState(null, "", nextUrl);
    },
    [page, debouncedValue, minFundamentals, minOpportunity],
  );

  // Reset page when search changes and update URL
  useEffect(() => {
    if (previousSearchRef.current !== debouncedValue) {
      previousSearchRef.current = debouncedValue;
      setPage(1);
      updateUrl({ page: 1, search: debouncedValue });
    }
  }, [debouncedValue, updateUrl]);

  useEffect(() => {
    const previous = previousThresholdsRef.current;
    if (previous.fundamentals !== minFundamentals || previous.opportunity !== minOpportunity) {
      previousThresholdsRef.current = { fundamentals: minFundamentals, opportunity: minOpportunity };
      setPage(1);
      updateUrl({ page: 1, fundamentals: minFundamentals, opportunity: minOpportunity });
    }
  }, [minFundamentals, minOpportunity, updateUrl]);

  const thresholdFilteredItems = useMemo(() => {
    return items.filter(
      (item) => item.scores.fundamentals >= minFundamentals && item.scores.opportunity >= minOpportunity,
    );
  }, [items, minFundamentals, minOpportunity]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) {
      return thresholdFilteredItems;
    }
    return thresholdFilteredItems.filter((item) => {
      const text = buildSearchText(item);
      return text.includes(debouncedQuery);
    });
  }, [thresholdFilteredItems, debouncedQuery]);

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
      updateUrl({ page: newPage });
    },
    [updateUrl],
  );

  const helperText = useMemo(() => {
    if (totalItems === 0) {
      if (debouncedValue && thresholdsActive) {
        return `Nenhum ETF atende aos filtros para "${debouncedValue}".`;
      }
      if (debouncedValue) {
        return `Nenhum ETF encontrado para "${debouncedValue}".`;
      }
      if (thresholdsActive) {
        return "Nenhum ETF atende aos filtros mínimos definidos.";
      }
      return "Nenhum ETF encontrado para compor o ranking.";
    }

    const totalFormat = new Intl.NumberFormat("pt-BR").format(totalItems);
    return `Mostrando ${startIndex}–${endIndex} de ${totalFormat} ETFs ranqueados.`;
  }, [debouncedValue, endIndex, startIndex, totalItems, thresholdsActive]);

  const handleFundamentalsBlur = useCallback(() => {
    setMinFundamentalsInput((current) => sanitizeThresholdInput(current));
  }, []);

  const handleOpportunityBlur = useCallback(() => {
    setMinOpportunityInput((current) => sanitizeThresholdInput(current));
  }, []);

  const dataGridColumns = useMemo<GridColDef<RankingGridRow>[]>(() => {
    const baseColumns: GridColDef<RankingGridRow>[] = [
      {
        field: "position",
        headerName: "Posição",
        headerAlign: "center",
        align: "center",
        sortable: false,
        width: 110,
      },
    ];

    const detailColumns: GridColDef<RankingGridRow>[] = DETAIL_COLUMN_CONFIGS.map((column) => ({
      field: column.key,
      headerName: column.label,
      minWidth: 140,
      flex: 1,
      sortable: true,
      renderCell: (params: GridRenderCellParams<RankingGridRow, DetailValue>) =>
        formatDetailValue(params.value as DetailValue, column.format),
    }));

    return [...baseColumns, ...detailColumns];
  }, []);

  const gridRows = useMemo<RankingGridRow[]>(() => {
    return pageItems.map((item, idx) => {
      const rowValues: Record<string, DetailValue> = {};
      DETAIL_COLUMN_CONFIGS.forEach((column) => {
        rowValues[column.key] = column.getValue(item);
      });

      return {
        id: item.symbol,
        position: startIndex + idx,
        ...rowValues,
      };
    });
  }, [pageItems, startIndex]);

  const gridHeight = useMemo(() => {
    const rowCount = gridRows.length || 1;
    return GRID_HEADER_HEIGHT + rowCount * GRID_ROW_HEIGHT;
  }, [gridRows.length]);

  const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, nextView: ViewMode | null) => {
    if (nextView) {
      setViewMode(nextView);
    }
  }, []);

  const handleCopyAllGrid = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyFeedback({ severity: "error", message: "Funcionalidade de copiar indisponível neste ambiente." });
      return;
    }

    const headers = ["Posição", ...DETAIL_COLUMN_CONFIGS.map((column) => column.label)];
    const rows = filteredItems.map((item, index) => {
      const columnValues = DETAIL_COLUMN_CONFIGS.map((column) => formatDetailValue(column.getValue(item), column.format));
      return [`${index + 1}`, ...columnValues].join("\t");
    });

    const tableText = [headers.join("\t"), ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(tableText);
      setCopyFeedback({ severity: "success", message: "Tabela copiada para a área de transferência." });
    } catch {
      setCopyFeedback({ severity: "error", message: "Não foi possível copiar a tabela." });
    }
  }, [filteredItems]);

  const handleCopyVisibleGrid = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyFeedback({ severity: "error", message: "Funcionalidade de copiar indisponível neste ambiente." });
      return;
    }

    const visibleDetailColumns = DETAIL_COLUMN_CONFIGS.filter((column) => columnVisibilityModel[column.key]);
    const headers = ["Posição", ...visibleDetailColumns.map((column) => column.label)];
    const rows = gridRows.map((row) => {
      const columnValues = visibleDetailColumns.map((column) =>
        formatDetailValue(row[column.key], column.format),
      );
      return [row.position.toString(), ...columnValues].join("\t");
    });

    const tableText = [headers.join("\t"), ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(tableText);
      setCopyFeedback({ severity: "success", message: "Página atual copiada para a área de transferência." });
    } catch {
      setCopyFeedback({ severity: "error", message: "Não foi possível copiar a página atual." });
    }
  }, [gridRows, columnVisibilityModel]);

  const handleCloseCopyFeedback = useCallback(
    (_: unknown, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      setCopyFeedback(null);
    },
    [],
  );

  const snackbarContent = copyFeedback ? (
    <Alert onClose={handleCloseCopyFeedback} severity={copyFeedback.severity} sx={{ width: "100%" }}>
      {copyFeedback.message}
    </Alert>
  ) : undefined;

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
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ fontSize: { xs: "1.8rem", md: "2.2rem" } }}
            >
              Ranking de ETFs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fundamentos e oportunidade de compra analisados de forma independente da categoria declarada.
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent={{ xs: "flex-start", sm: "flex-end" }}
            flexWrap="wrap"
          >
            <ToggleButtonGroup color="primary" size="small" exclusive value={viewMode} onChange={handleViewModeChange}>
              <ToggleButton value="cards" aria-label="Mostrar cards">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Mostrar tabela">
                <TableChartIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Chip label={`Total: ${totalItems}`} color="primary" variant="outlined" />
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-start" }} sx={{ width: "100%" }}>
          <TextField
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Pesquisar por nome, código ou categoria"
            sx={{ width: { xs: "100%", md: "100%" }, flexGrow: { md: 1 }, minWidth: { md: 260 } }}
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ flexGrow: { md: 1.2 }, minWidth: { md: 380 }, width: "100%" }}
          >
            <TextField
              label="Fundamentos mín."
              value={minFundamentalsInput}
              onChange={(event) => setMinFundamentalsInput(event.target.value)}
              onBlur={handleFundamentalsBlur}
              placeholder="0"
              type="number"
              sx={{ width: { xs: "100%", sm: "100%" }, flexGrow: 1 }}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: {
                    inputMode: "decimal",
                    min: 0,
                    max: 100,
                  },
                },
              }}
            />
            <TextField
              label="Oportunidade mín."
              value={minOpportunityInput}
              onChange={(event) => setMinOpportunityInput(event.target.value)}
              onBlur={handleOpportunityBlur}
              placeholder="0"
              type="number"
              sx={{ width: { xs: "100%", sm: "100%" }, flexGrow: 1 }}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: {
                    inputMode: "decimal",
                    min: 0,
                    max: 100,
                  },
                },
              }}
            />
          </Stack>
        </Stack>

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

        {viewMode === "cards" ? (
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
                            label={
                              typeof raw?.etfCategory === "string" && raw.etfCategory.length > 0
                                ? raw.etfCategory
                                : "Categoria indefinida"
                            }
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
        ) : (
          <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden", border: "none" }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={handleCopyVisibleGrid}
                disabled={gridRows.length === 0}
              >
                Copiar página
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={handleCopyAllGrid}
                disabled={filteredItems.length === 0}
              >
                Copiar tudo
              </Button>
            </Stack>
            <DataGrid
              rows={gridRows}
              columns={dataGridColumns}
              hideFooter
              disableRowSelectionOnClick
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={setColumnVisibilityModel}
              rowHeight={GRID_ROW_HEIGHT}
              columnHeaderHeight={GRID_HEADER_HEIGHT}
              sx={{
                height: gridHeight,
                "& .MuiDataGrid-columnHeaders": {
                  whiteSpace: "nowrap",
                },
              }}
            />
          </Paper>
        )}

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
      <Snackbar
        open={copyFeedback !== null}
        autoHideDuration={4000}
        onClose={handleCloseCopyFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbarContent}
      </Snackbar>
    </Container>
  );
}

export default RankingView;
