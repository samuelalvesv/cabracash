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
    description: "Reduz a exposição exclusiva ao real, criando colchão contra desvalorização cambial.",
  },
  {
    title: "Diversificação global",
    icon: <PublicIcon color="secondary" />,
    description: "Permite acessar economias maduras, setores inovadores e estratégias impossíveis no mercado local.",
  },
  {
    title: "Eficiência operacional",
    icon: <BarChartIcon color="action" />,
    description: "ETFs costumam oferecer taxas menores, transparência diária e rebalanceamentos automatizados.",
  },
  {
    title: "Liquidez em dólar",
    icon: <TimelineIcon color="secondary" />,
    description: "Liquidez global em dólar simplifica aportes recorrentes e saques quando necessário.",
  },
];

const RANKING_OVERVIEW: ContentSection[] = [
  {
    title: "Fundamentos: estrutura sólida (60%)",
    description:
      "Medimos qualidade estrutural do ETF para garantir que a base do investimento é resiliente ao longo prazo.",
    icon: <SecurityIcon fontSize="large" color="primary" />,
    points: [
      "Custos e eficiência do emissor: expense ratio invertido e issuer score.",
      "Liquidez em dólares e em cotas para facilitar entradas e saídas.",
      "Diversificação da carteira, patrimônio sob gestão e consistência de dividendos.",
      "Sharpe, Sortino, beta balanceado e volatilidade (ATR/Close).",
    ],
  },
  {
    title: "Oportunidade: timing e momentum (40%)",
    description:
      "Complementamos fundamentos com sinais de preço e volume para identificar ETFs em pontos de entrada interessantes.",
    icon: <TimelineIcon fontSize="large" color="secondary" />,
    points: [
      "Variações de curto prazo, distância aos extremos de 52 semanas e médias móveis.",
      "RSI diário e volume relativo medem saturação e interesse do mercado.",
      "Retorno de 1 mês e movimentos pré/pós mercado ajudam a capturar gaps.",
    ],
  },
  {
    title: "Processo transparente",
    description:
      "Todos os indicadores, pesos e transformações estão documentados. Métricas ausentes recebem nota neutra para manter justiça.",
    icon: <QueryStatsIcon fontSize="large" color="action" />,
    points: [
      "Winsorização entre 2% e 98% para reduzir ruído de outliers.",
      "Normalização 0–100 com inversões de sinal quando menor = melhor.",
      "Pontuação final = 0,60 * Fundamentos + 0,40 * Oportunidade.",
      "Empates resolvidos por Fundamentos e, em seguida, símbolo do ETF.",
    ],
  },
];

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={6}>
        <Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Porque dolarizar o patrimônio com ETFs pode ser um divisor de águas
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Ao diversificar em ETFs listados nos EUA você protege o poder de compra, amplia horizontes setoriais e aproveita a
            eficiência de fundos automatizados — sem precisar escolher ações individuais.
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
                Ranking transparente de ETFs americanos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aplicamos uma metodologia própria que combina a robustez de fundamentos com sinais de oportunidade.
                Dessa forma, você identifica ETFs que equilibram qualidade e bom ponto de entrada.
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SecurityIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Fundamentos: 60%
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Custos, liquidez composta, força do emissor, risco/retorno (Sharpe + Sortino) e estabilidade de dividendos.
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TimelineIcon color="secondary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Oportunidade: 40%
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Descontos vs. 52 semanas, momentum de 1 dia/1 mês, pulso de volume e gaps pré/pós-market com filtros anti value-trap.
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Pesos, fórmulas e tratamento de dados estão descritos em detalhes na documentação. A média ponderada 60/40 inclui penalizações automáticas para quedas sem fluxo e desempate por fundamentos.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider />

        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Metodologia em 4 passos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Resumimos o pipeline descrito na documentação para que você entenda como transformamos dados brutos em um ranking confiável.
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
