"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { FUNDAMENTAL_DEFINITIONS, OPPORTUNITY_DEFINITIONS } from "@/features/ranking/server/metricDefinitions";
import type { RankedEtf } from "@/features/ranking/server/types";
import { buildDetailSections, formatDetailValue } from "@/features/ranking/server/detailSections";
import { formatScore } from "@/shared/utils/formatters";

interface EtfDetailsViewProps {
  etf: RankedEtf;
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
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ fontSize: { xs: "1.8rem", md: "2.2rem" } }}
            >
              {etf.symbol}
            </Typography>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon fontSize="small" />}
              sx={{ flexShrink: 0, borderRadius: 999 }}
            >
              Voltar
            </Button>
          </Stack>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
          >
            {etf.raw.name ?? "Nome indisponível"}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Categoria: ${etf.raw.etfCategory ?? "Não informada"}`} color="primary" variant="outlined" />
            {etf.raw.issuer && <Chip label={`Emissor: ${etf.raw.issuer}`} variant="outlined" />}
            {etf.raw.exchange && <Chip label={etf.raw.exchange} variant="outlined" />}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
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
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Fundamentos
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {formatScore(etf.scores.fundamentals)}
            </Typography>
            <LinearProgress variant="determinate" value={etf.scores.fundamentals} sx={{ mt: 2 }} />
          </Paper>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Oportunidade
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {formatScore(etf.scores.opportunity)}
            </Typography>
            <LinearProgress color="secondary" variant="determinate" value={etf.scores.opportunity} sx={{ mt: 2 }} />
          </Paper>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
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
                      <TableCell align="right">{formatDetailValue(item.value, item.format)}</TableCell>
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
                      <TableCell align="right">{formatDetailValue(item.value, item.format)}</TableCell>
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
        </Box>

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
                          {formatDetailValue(item.value, item.format)}
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
