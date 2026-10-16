"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useRankingHref } from "@/features/ranking/components/useRankingHref";

export default function EtfNotFound() {
  const searchParams = useSearchParams();
  const rankingHref = useRankingHref(searchParams);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700 }}>
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
