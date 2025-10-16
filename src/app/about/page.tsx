"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Button, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import BarChartIcon from "@mui/icons-material/BarChart";
import PublicIcon from "@mui/icons-material/Public";
import SavingsIcon from "@mui/icons-material/Savings";
import SecurityIcon from "@mui/icons-material/Security";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TimelineIcon from "@mui/icons-material/Timeline";

interface ContentSection {
  title: string;
  description: string;
  points: string[];
  icon?: ReactNode;
}

type BenefitDetail = {
  title: string;
  icon: ReactNode;
  description: string;
};

const BENEFIT_DETAILS: BenefitDetail[] = [
  {
    title: "Defesa cambial",
    icon: <SavingsIcon color="primary" />,
    description: "Manter parte do patrimônio em dólar ajuda a blindar a carteira quando o real perde força.",
  },
  {
    title: "Diversificação global",
    icon: <PublicIcon color="secondary" />,
    description: "Você passa a participar de economias e setores que não existem na Bolsa brasileira.",
  },
  {
    title: "Eficiência operacional",
    icon: <BarChartIcon color="action" />,
    description: "Um ETF junta dezenas de ativos em um ticker só, com custo baixo e rebalanceamento automático.",
  },
  {
    title: "Liquidez em dólar",
    icon: <TimelineIcon color="secondary" />,
    description: "A negociação em dólar facilita aportes e resgates rápidos diretamente no mercado americano.",
  },
];

const RANKING_OVERVIEW: ContentSection[] = [
  {
    title: "Fundamentos fortes (55%)",
    description: "A maior parte da nota privilegia ETFs grandes, baratos e bem administrados.",
    icon: <SecurityIcon fontSize="large" color="primary" />,
    points: [
      "Taxa de administração baixa e gestor reconhecido.",
      "ETF com muitos ativos e volume alto para negociar sem aperto.",
      "Histórico estável de dividendos e risco controlado.",
      "Índice bem seguido, sem grandes desvios do desempenho esperado.",
    ],
  },
  {
    title: "Momento de compra (45%)",
    description: "O restante da nota mostra se o preço atual parece convidativo para entrar.",
    icon: <TimelineIcon fontSize="large" color="secondary" />,
    points: [
      "Preço em leve desconto versus as máximas recentes.",
      "Indicadores como RSI sugerem força compradora saudável.",
      "Volume maior que o normal confirma interesse real do mercado.",
    ],
  },
  {
    title: "Score final transparente",
    description: "Transformamos todos os números em notas de 0 a 100, sem segredos.",
    icon: <QueryStatsIcon fontSize="large" color="action" />,
    points: [
      "Cada métrica é normalizada para facilitar a comparação.",
      "A nota final é 55% fundamentos + 45% oportunidade.",
      "Se faltar um dado, o ETF recebe nota neutra naquele item.",
      "Empates são resolvidos pela melhor nota de fundamentos.",
    ],
  },
];

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={6}>
        <Box>
          <Typography
            variant="h3"
            fontWeight={700}
            gutterBottom
            sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            Por que dolarizar com ETFs faz diferença
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
          >
            Levar parte da carteira para ETFs americanos protege o poder de compra e dá acesso a mercados e tecnologias que não
            existem no Brasil — tudo sem ter que garimpar ação por ação.
          </Typography>
        </Box>

        <Divider />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
            <Stack spacing={3} sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                O que você ganha ao dolarizar
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, height: "100%", display: "flex" }}>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  {BENEFIT_DETAILS.map(({ title, icon, description }) => (
                    <Stack direction="row" spacing={2} alignItems="flex-start" key={title}>
                      <Box sx={{ mt: 0.5, display: "flex" }}>{icon}</Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
            <Typography variant="subtitle2" color="primary">
              Como o CabraCash ajuda nisso?
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              Como o ranking funciona
            </Typography>
            <Typography variant="body1" color="text.secondary">
              O CabraCash transforma dezenas de números em duas notas fáceis de entender: quão sólido é o ETF e se o preço
              atual parece um bom momento de compra. Assim você compara rapidamente, sem planilhas.
            </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SecurityIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Fundamentos: 55%
                  </Typography>
                </Stack>
              <Typography variant="body2" color="text.secondary">
                Olhamos para taxa do fundo, tamanho e histórico do emissor, além de dividendos e estabilidade da carteira.
              </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimelineIcon color="secondary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Oportunidade: 45%
                  </Typography>
                </Stack>
              <Typography variant="body2" color="text.secondary">
                Avaliamos desconto recente, volume acima do normal e força compradora para evitar quedas sem suporte.
              </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            A nota final é a soma ponderada desses dois blocos (55% + 45%) e se atualiza automaticamente sempre que chegam dados
            novos.
          </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider />

        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Metodologia em 3 passos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Veja o caminho que cada ETF percorre até aparecer no topo da lista:
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {RANKING_OVERVIEW.map((section) => (
              <Grid key={section.title} size={{ xs: 12, md: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {section.icon && (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>{section.icon}</Box>
                  )}
                  <Typography variant="h6" fontWeight={700}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                  <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                    {section.points.map((point) => (
                      <Typography key={point} component="li" variant="body2" color="text.secondary">
                        {point}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>

        <Divider />

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "#111827" : "background.paper"),
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={700}>
                Pronto para explorar o ranking?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compare ETFs, filtre por categoria e aprofunde-se nas métricas para montar sua carteira dolarizada com confiança.
              </Typography>
            </Stack>
            <Button
              component={Link}
              href="/"
              variant="contained"
              color="primary"
              startIcon={<BarChartIcon />}
              sx={{ alignSelf: "center" }}
            >
              Ver ranking
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
