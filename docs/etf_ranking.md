# Metodologia de Pontuação e Ranking de ETFs

O CabraCash avalia e classifica ETFs combinando duas dimensões analíticas: **Fundamentos (55%)** e **Oportunidade (45%)**. A metodologia utiliza métricas normalizadas e penalizações contextuais para entregar uma ordenação comparável entre ativos.

---

## 1. Indicadores Utilizados

Os dados brutos são obtidos da API de mercado via agregação dos endpoints `initial` e `data-points`. Quando um dado numérico não está disponível, o indicador recebe nota neutra (50) após a etapa de normalização.

### Fundamentos (55%)

| Indicador | Código / Origem | Direção |
| :--- | :--- | :--- |
| Custo Total | `expenseRatio` | Menor é melhor |
| Liquidez Composta | Média de `log10(dollarVolume)`, `log10(volume)` e `log1p(relativeVolume)` | Maior é melhor |
| Diversificação | `holdings` | Maior é melhor |
| Patrimônio sob Gestão | `log10(assets)` | Maior é melhor |
| Qualidade do Emissor | Mapeamento de confiabilidade da gestora (Vanguard, BlackRock, etc.) | Maior é melhor |
| Risco/Retorno Ajustado | Média normalizada de `sharpeRatio` e `sortinoRatio` | Maior é melhor |
| Dividend Yield | `dividendYield` | Maior é melhor |
| Estabilidade de Dividendos | Combinação normalizada de `dividendGrowthYears` e `dividendGrowth` | Maior é melhor |
| Risco Balanceado | Média de `|beta - 1|` e `ATR / preço base` | Menor é melhor |

### Oportunidade (45%)

| Indicador | Código / Origem | Direção |
| :--- | :--- | :--- |
| Momentum Intradiário | `ch1d` | Maior é melhor |
| Desconto vs. Topo 52 Semanas | `high52ch` | Menor é melhor (valores negativos indicam desconto) |
| Distância do Fundo 52 Semanas | `low52ch` | Maior é melhor |
| Tendência de Médias Móveis | Média de `ma20ch`, `ma50ch`, `ma150ch` e `ma200ch` | Maior é melhor |
| RSI (Índice de Força Relativa) | `rsi` | Maior é melhor |
| Pulso de Volume | `log1p(relativeVolume)` | Maior é melhor |
| Momentum 1 Mês | `tr1m` | Maior é melhor |
| Sinal de Gap | Média de `premarketChangePercent` e `postmarketChangePercent` | Maior é melhor |

---

## 2. Pré-processamento e Transformações

1. **Conversão Segura**: Valores numéricos são validados, descartando representações inválidas (`NaN`).
2. **Escala Logarítmica**: Indicadores com alta dispersão de magnitude (`assets`, `volume`, `dollarVolume`, `relativeVolume`) são convertidos para base logarítmica (`log10` ou `log1p`).
3. **Limitação de Risco/Retorno**: Índices Sharpe e Sortino são limitados a intervalos consistentes antes da normalização.
4. **Composição de Liquidez**: Agregação linear dos logs de volume financeiro, cotas negociadas e volume relativo.
5. **Composição de Risco Balanceado**: Combina o desvio de beta em relação ao mercado (`|beta - 1|`) com a volatilidade relativa (`ATR / preço base`).
6. **Composição de Gap**: Média aritmética simples das variações registradas no pré-mercado e no pós-mercado.

---

## 3. Normalização

Para cada indicador no universo de ETFs:

1. **Winsorização**: Os limites extremos são aparados nos percentis 2% e 98%, prevenindo distorções provocadas por outliers anômalos.
2. **Min-Max (0 a 100)**: Os valores resultantes são mapeados para a escala linear de 0 a 100.
3. **Inversão de Polaridade**: Em métricas onde valores menores representam melhor desempenho (`expenseRatio`, `high52ch`, `riskBalance`), o score é invertido antes da atribuição final (`100 - score`).
4. **Valores Ausentes**: ETFs sem registros para determinada métrica recebem a nota neutra padrão de 50.

---

## 4. Ponderação de Fundamentos (55%)

| Indicador | Símbolo | Peso |
| :--- | :--- | :--- |
| Custo Total | `S_custo` | 14% |
| Liquidez Composta | `S_liq_comp` | 14% |
| Diversificação (`holdings`) | `S_holdings` | 8% |
| Patrimônio (`assets`) | `S_assets` | 8% |
| Qualidade do Emissor | `S_emissor` | 8% |
| Risco/Retorno (`sharpeRatio` + `sortinoRatio`) | `S_risk_adj` | 20% |
| Dividend Yield | `S_yield` | 7% |
| Estabilidade de Dividendos | `S_div_stability` | 7% |
| Risco Balanceado (`beta` + `ATR`) | `S_risk_balance` | 14% |

```
FundamentalsScore = Σ (peso_i * score_i) / Σ (peso_i)
```

---

## 5. Ponderação de Oportunidade (45%)

| Indicador | Símbolo | Peso |
| :--- | :--- | :--- |
| Momentum Intradiário | `S_ch1d` | 12% |
| Desconto vs. Topo 52 Semanas | `S_top52` | 18% |
| Distância do Fundo 52 Semanas | `S_bottom52` | 15% |
| Tendência de Médias Móveis | `S_ma_combo` | 15% |
| RSI | `S_rsi` | 12% |
| Pulso de Volume | `S_vol_pulse` | 10% |
| Momentum 1 Mês | `S_tr1m` | 8% |
| Sinal de Gap | `S_gap` | 10% |

```
OpportunityScore = Σ (peso_i * score_i) / Σ (peso_i)
```

### Filtro de Proteção contra Queda sem Volume (Value Trap)

Aplica-se uma penalização de 15% sobre o `OpportunityScore` quando o ativo cumpre simultaneamente:
- `rsi < 20`
- `relativeVolume < 1` (volume inferior à média histórica)

Essa regra impede que fundos em forte tendência de desvalorização sem interesse de compra recebam pontuação artificialmente inflada apenas pelo critério de desconto.

---

## 6. Score Final e Critérios de Ordenação

O score consolidado é calculado pela ponderação direta:

```
FinalScore = 0.55 * FundamentalsScore + 0.45 * OpportunityScore
```

A listagem é ordenada em ordem decrescente de `FinalScore`. Os empates são resolvidos sequencialmente por:
1. Maior `FundamentalsScore`.
2. Ordem alfabética do código (`symbol`).

---

## 7. Pseudocódigo do Algoritmo

```pseudo
for each etf in market_universe:
  expense = etf.expenseRatio
  liq_comp = mean([log10(dollarVolume), log10(volume), log1p(relativeVolume)])
  holdings = etf.holdings
  assets_log = log10(assets)
  issuer = issuerScoreMap(etf.issuer)

  sharpe = clamp(etf.sharpeRatio, [-2, 5])
  sortino = clamp(etf.sortinoRatio, [-2, 6])
  risk_adj = mean(normalize(sharpe), normalize(sortino))

  div_stability = mean(normalize(dividendGrowthYears), normalize(dividendGrowth))
  risk_balance = mean(abs(beta - 1), atr / base_price)

  opportunity_signals = {
    intraday: etf.ch1d,
    discount: etf.high52ch,
    floor: etf.low52ch,
    ma_combo: mean([ma20ch, ma50ch, ma150ch, ma200ch]),
    rsi: etf.rsi,
    volume: log1p(relativeVolume),
    momentum1m: etf.tr1m,
    gap: mean([premarketChangePercent, postmarketChangePercent])
  }

  fundamentalsScore = weightedSum(fundamentals, FUNDAMENTALS_WEIGHTS)
  opportunityScore = weightedSum(opportunity_signals, OPPORTUNITY_WEIGHTS)

  if rsi < 20 and relativeVolume < 1:
    opportunityScore = opportunityScore * 0.85

  finalScore = 0.55 * fundamentalsScore + 0.45 * opportunityScore
```

---

## 8. Conformidade do Contrato e Cache

- A integridade de todos os 110 atributos providos pela API de mercado é validada pelo teste de contrato ao vivo (`src/services/__tests__/market-data.contract.test.ts`).
- O ranking calculado é retido em cache de memória com tempo de vida de 15 minutos (`RANKING_CACHE_TTL_MS`), compartilhando os resultados entre requisições simultâneas.
