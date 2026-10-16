"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Unhandled runtime error captured by error boundary:", error);
  }, [error]);

  const isConnectionError =
    error?.name === "MarketDataConnectionError" ||
    error?.message?.toLowerCase().includes("conexão") ||
    error?.message?.toLowerCase().includes("servidor") ||
    error?.message?.toLowerCase().includes("mercado") ||
    error?.message?.toLowerCase().includes("fetch");

  const title = isConnectionError
    ? "Serviço temporariamente indisponível"
    : "Ops, algo deu errado";

  const description = isConnectionError
    ? "Não foi possível estabelecer conexão com o servidor de dados de mercado para carregar as cotações e o ranking de ETFs. Por favor, tente novamente em instantes."
    : "Não foi possível carregar as informações neste momento. Tente recarregar a página ou voltar ao início.";

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          borderRadius: 2,
          p: { xs: 3, md: 6 },
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: "text.primary",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            maxWidth: 560,
            mb: 4,
          }}
        >
          {description}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "center",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button variant="contained" color="primary" onClick={() => reset()}>
            Tentar novamente
          </Button>

          <Button variant="outlined" component={Link} href="/">
            Voltar ao início
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
