import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function EtfNotFound() {
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
          <Button component={Link} href="/" variant="contained">
            Voltar para o ranking
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
