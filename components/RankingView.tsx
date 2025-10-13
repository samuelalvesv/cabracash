"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Grid,
  LinearProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type { RankedEtf } from "@/lib/ranking/types";

interface RankingViewProps {
  items: RankedEtf[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

const KEY_STATS: Array<{
  label: string;
  field: string;
  format: "percent" | "number" | "decimal";
}> = [
  { label: "Expense Ratio", field: "expenseRatio", format: "percent" },
  { label: "Dividend Yield", field: "dividendYield", format: "percent" },
  { label: "Sharpe", field: "sharpeRatio", format: "decimal" },
  { label: "Sortino", field: "sortinoRatio", format: "decimal" },
  { label: "RSI", field: "rsi", format: "number" },
  { label: "Δ Top 52s (%)", field: "high52ch", format: "decimal" },
];

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

function formatField(value: unknown, format: "percent" | "number" | "decimal"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
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

export function RankingView({
  items,
  totalItems,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
}: RankingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, page: number) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }
      const query = params.toString();
      router.push(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const helperText = useMemo(() => {
    if (totalItems === 0) {
      return "Nenhum ETF encontrado para compor o ranking.";
    }

    return `Mostrando ${startIndex}–${endIndex} de ${totalItems} ETFs ranqueados.`;
  }, [startIndex, endIndex, totalItems]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" fontWeight={700}>
              Ranking unificado de ETFs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fundamentos e oportunidade de compra analisados de forma independente da categoria declarada.
            </Typography>
          </Box>
          <Chip label={`Total: ${totalItems}`} color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
        </Stack>

        <Alert severity={totalItems === 0 ? "warning" : "info"}>{helperText}</Alert>

        <Grid container spacing={3}>
          {items.map((item, idx) => {
            const position = startIndex + idx;
            const { scores, raw } = item;

            return (
              <Grid item xs={12} md={6} key={item.symbol}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5" fontWeight={700}>
                        #{position} • {item.symbol}
                      </Typography>
                      <Chip label={`Score ${formatScore(scores.final)}`} color="primary" size="medium" />
                    </Stack>

                    <Stack spacing={2} mt={3}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Fundamentos
                        </Typography>
                        <LinearProgress variant="determinate" value={scores.fundamentals} />
                        <Typography variant="caption" color="text.secondary">
                          {formatScore(scores.fundamentals)}
                        </Typography>
                      </Stack>

                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Oportunidade
                        </Typography>
                        <LinearProgress color="secondary" variant="determinate" value={scores.opportunity} />
                        <Typography variant="caption" color="text.secondary">
                          {formatScore(scores.opportunity)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 3 }} />

                    <Table size="small">
                      <TableBody>
                        {KEY_STATS.map(({ label, field, format }) => (
                          <TableRow key={field}>
                            <TableCell sx={{ border: 0 }}>
                              <Typography variant="body2" color="text.secondary">
                                {label}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ border: 0 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {formatField(raw[field], format)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Accordion elevation={0} sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Ver dados brutos
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        <Box
                          component="pre"
                          sx={{
                            bgcolor: "grey.900",
                            color: "grey.100",
                            p: 2,
                            borderRadius: 2,
                            overflowX: "auto",
                            fontSize: 12,
                          }}
                        >
                          {JSON.stringify(raw, null, 2)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {totalItems > 0 && (
          <Stack alignItems="center" spacing={2}>
            <Pagination
              page={currentPage}
              count={totalPages}
              color="primary"
              onChange={handlePageChange}
              size="large"
            />
            <Typography variant="caption" color="text.secondary">
              Página {currentPage} de {totalPages}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default RankingView;
