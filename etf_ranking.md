# Sistema de Pontuação e Ranking de ETFs

Greg, especialista em ETFs americanos para brasileiros com mais de 20 anos de mercado, recomenda o framework abaixo para comparar qualquer ETF — independentemente da classe declarada pelo emissor. A metodologia combina **Fundamentos (60%)** e **Oportunidade (40%)**, utilizando métricas normalizadas e penalizações contextuais para evitar armadilhas de liquidez ou momentum.

---

## 1. Indicadores monitorados

Os campos são obtidos via StockAnalysis; quando um dado não existe, aplicamos nota neutra (50) após a normalização.

### Fundamentos

| Componente                | Campo (JSON) / Derivação                                                  | Nota                                  |
|---------------------------|---------------------------------------------------------------------------|---------------------------------------|
| Custo total               | `expenseRatio`                                                            | menor = melhor                        |
| Liquidez composta         | média de `log10(dollarVolume)`, `log10(volume)` e `log1p(relativeVolume)` | ampla e resiliente                    |
| Diversificação            | `holdings` ou `holdingsCount`                                             | carteiras concentradas perdem pontos  |
| Patrimônio sob gestão     | `log10(assets)`                                                           | fundos muito pequenos são penalizados |
| Qualidade do emissor      | mapa curado (Vanguard, BlackRock etc.)                                    | emissores novos recebem score neutro  |
| Risco/Retorno             | Sharpe & Sortino normalizados                                             | consistência de performance           |
| Dividendos – Yield        | `dividendYield`                                                           | valor absoluto                        |
| Dividendos – Estabilidade | combinação de `dividendGrowthYears` e `dividendGrowth`                    | normalizados 0–1                      |
| Tracking efficiency (abs) | média do valor absoluto de `trackingDifference` / `trackingError*`        | menor = melhor                        |
| Risco balanceado          | média de `                                                                | beta - 1                              |` e `ATR/preço`                     | volatilidade estrutural |

### Oportunidade

| Componente             | Campo (JSON) / Derivação                                      | Nota                               |
|------------------------|---------------------------------------------------------------|------------------------------------|
| Momentum intradiário   | `ch1d`                                                        | aponta direção diária              |
| Desconto vs. topo 52s  | `high52ch`                                                    | valores negativos indicam desconto |
| Distância do fundo 52s | `low52ch`                                                     | proximidade de suportes            |
| Médias móveis          | média de `ma20ch`, `ma50ch`, `ma150ch`, `ma200ch`             | convergência de tendências         |
| RSI                    | `rsi`                                                         | sobrevendido / comprado            |
| Pulso de volume        | `log1p(relativeVolume)`                                       | interesse recente                  |
| Momentum 1 mês         | `tr1m`                                                        | confirma tendência média           |
| Gap pré/pós-market     | média de `premarketChangePercent` e `afterHoursChangePercent` | sinais fora do pregão              |

> *Se `tracking*` não estiver disponível, o ETF recebe nota neutra nesse componente.

---

## 2. Pré-processamento

1. **Conversão segura**: valores são convertidos para número (`float`), descartando `NaN`.
2. **Transformações**:
   - Liquidez → `log10` ou `log1p` para reduzir amplitude.
   - Risco/retorno → Sharpe e Sortino são limitados a intervalos realistas.
   - Dividendos → crescimento e anos são normalizados para [0, 1].
3. **Tracking**: média do valor absoluto de todas as métricas de tracking disponíveis.
4. **Composites**:
   - Liquidez composta = média dos logs de volume em dólar, volume em cotas e volume relativo.
   - Risco balanceado = média de `|beta - 1|` e `ATR/preço`.
   - Gap pré/pós-market = média simples de pré e pós-mercado.

Dados ausentes permanecem como `null` e recebem nota 50 após a normalização.

---

## 3. Normalização

Cada vetor de métricas é:

1. **Winsorizado** nos percentis 2% e 98%, reduzindo outliers.
2. **Transformado** para o intervalo 0–100 via min–max. Métricas onde “menor = melhor” são invertidas antes do min–max.
3. Valores ausentes recebem 50 (neutro).

---

## 4. Fundamentos (60%)

| Indicador                        | Símbolo           | Peso |
|----------------------------------|-------------------|------|
| Custo total                      | `S_custo`         | 12%  |
| Liquidez composta                | `S_liq_comp`      | 12%  |
| Diversificação (holdings)        | `S_holdings`      | 8%   |
| Patrimônio sob gestão            | `S_assets`        | 6%   |
| Qualidade do emissor             | `S_emissor`       | 8%   |
| Risco/Retorno (Sharpe + Sortino) | `S_risk_adj`      | 18%  |
| Dividend Yield                   | `S_yield`         | 7%   |
| Estabilidade de dividendos       | `S_div_stability` | 7%   |
| Tracking efficiency              | `S_tracking`      | 10%  |
| Risco balanceado (beta + ATR)    | `S_risk_balance`  | 12%  |

```
FundamentalsScore = Σ(peso_i * score_i) / Σ(peso_i)
```

---

## 5. Oportunidade (40%)

| Indicador            | Símbolo       | Peso |
|----------------------|---------------|------|
| Momentum intradiário | `S_ch1d`      | 12%  |
| Desconto topo 52s    | `S_top52`     | 18%  |
| Distância fundo 52s  | `S_bottom52`  | 15%  |
| Médias móveis        | `S_ma_combo`  | 15%  |
| RSI                  | `S_rsi`       | 12%  |
| Pulso de volume      | `S_vol_pulse` | 10%  |
| Momentum 1m          | `S_tr1m`      | 8%   |
| Gap pré/pós-market   | `S_gap`       | 10%  |

```
OpportunityScore = Σ(peso_i * score_i) / Σ(peso_i)
```

### Filtro anti value-trap

Após o cálculo, aplicamos penalização de 15% no `OpportunityScore` se:

- `RSI < 20`, **e**
- `log1p(relativeVolume) < log1p(1)` (baixa confirmação de volume).

Essa regra evita ranquear ativos com “queda sem fluxo” apenas porque estão baratos.

---

## 6. Nota final e ordenação

```
FinalScore = 0.60 * FundamentalsScore + 0.40 * OpportunityScore
```

Empates são resolvidos por:

1. Maior `FundamentalsScore`.
2. Ordem alfabética do ticker.

O ranking é recalculado a cada atualização da API e cacheado por 60 segundos.

---

## 7. Pipeline resumido

1. Carregar dados crus da API.
2. Derivar métricas compostas (liquidez, tracking, risco, momentum).
3. Winsorizar e normalizar para 0–100.
4. Calcular scores de Fundamentos e Oportunidade com pesos acima.
5. Aplicar filtros/penalizações (value trap).
6. Combinar em `FinalScore` e ordenar.
7. Expor componentes e métricas para auditoria na UI.

---

## 8. Boas práticas

- **Cobertura de dados**: monitore indicadores sempre nulos (via `findEmptyIndicators`) para acionar fallback ou remover métricas pouco confiáveis.
- **Classes especiais**: ETFs alavancados ou inversos continuam no ranking, mas o risco balanceado tende a penalizá-los. Se desejar destacá-los, utilize filtros na UI.
- **Atualização do emissor**: mantenha o mapa de scores com curadoria contínua (histórico de fechamentos, tracking, tamanho da prateleira).
- **Backtests**: reavalie pesos comparando periodicamente o top-N com benchmarks (ex.: S&P 500, BOVA11) para verificar aderência.

---

## 9. Pseudocódigo

```pseudo
for each etf in universe:
  expense = etf.expenseRatio
  liq_comp = mean([log10(dollarVolume), log10(volume), log1p(relativeVolume)])
  holdings = holdings or holdingsCount
  assets_log = log10(assets)
  issuer = issuerScoreMap(issuer)

  sharpe = clamp(sharpeRatio, [-2, 5])
  sortino = clamp(sortinoRatio, [-2, 6])
  risk_adj = mean(normalize(sharpe), normalize(sortino))

  div_stability = mean(normalize(dividendGrowthYears), normalize(dividendGrowth))
  tracking = mean(abs(tracking metrics))
  risk_balance = mean(abs(beta - 1), ATR / price)

  opportunity_signals = {
    intraday: ch1d,
    discount: high52ch,
    floor: low52ch,
    ma_combo: mean(moving average changes),
    rsi: rsi,
    volume: log1p(relativeVolume),
    momentum1m: tr1m,
    gap: mean(premarketChangePercent, afterHoursChangePercent)
  }

  fundamentalsScore = weightedAverage(fundamentals)
  opportunityScore = weightedAverage(opportunity_signals)

  if rsi < 20 and log1p(relativeVolume) < log1p(1):
    opportunityScore *= 0.85

  finalScore = 0.6 * fundamentalsScore + 0.4 * opportunityScore
```

---

## 10. Interface (resumo)

- **Ranking**: opções de visualização em cards ou datagrid, paginação de 12 itens, busca e botões de copiar página completa ou a página atual.
- **Detalhes**: seções de identificação, liquidez, risco/tracking, preços, dividendos, total return e históricos, refletindo os novos componentes.
- **Sobre**: explica os benefícios da dolarização com ETFs e a metodologia atualizada (fundamentos vs. oportunidade) com linguagem acessível.

---

Com esses ajustes, o ranking prioriza ETFs com custo competitivo, liquidez real, execução consistente do índice, dividendos sustentáveis e momentum validado — tudo com filtros para evitar quedas sem fluxo. Greg recomenda revisitar pesos trimestralmente e acompanhar o comportamento pós-implantação para refinar ainda mais o modelo.
