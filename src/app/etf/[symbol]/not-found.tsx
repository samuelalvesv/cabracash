"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { buildRankingQueryString, loadRankingFilters } from "@/features/ranking/components/rankingFilterStorage";

export default function EtfNotFound() {
  const searchParams = useSearchParams();

  const rankingHref = useMemo(() => {
    const params = new URLSearchParams();
    const allowedKeys = ["search", "minFundamentals", "minOpportunity", "page"];
    allowedKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    });

    if (params.size > 0) {
      return `/?${params.toString()}`;
    }

    const stored = loadRankingFilters();
    if (stored) {
      const query = buildRankingQueryString(stored);
      return `/${query}`;
    }

    return "/";
  }, [searchParams]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={3} alignItems="center">
        <Typography variant="h4" fontWeight={700} align="center">
          ETF não encontrado
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Não localizamos o ativo solicitado. Ele pode ter sido removido ou não está disponível no ranking atual.
        </Typography>
        <Box>
          <Button component={Link} href={rankingHref} variant="contained">
            Voltar para o ranking
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
