# Documentação do Sistema de Pontuação e Ranking de ETFs

Este guia descreve com precisão como calculamos as pontuações de **Fundamentos**, **Oportunidade** e a **Pontuação Final** a partir dos campos presentes no JSON de entrada. O objetivo é permitir comparação direta entre ETFs heterogêneos (ações, renda fixa, commodities) de forma transparente e reproduzível.

---

## 1. Insumos: indicadores usados (PT-BR ⇄ JSON)

| Indicador (PT-BR)                | Campo no JSON       | Como interpretamos                                                                           | Usado em      |
| -------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- | ------------- |
| Custo total anual                | `expenseRatio`      | Menor é melhor                                                                                | Fundamentos   |
| Liquidez diária (US$)            | `dollarVolume`      | Maior é melhor (aplicamos `log10`)                                                            | Fundamentos   |
| Emissor                          | `issuer`            | Mapeado para nota qualitativa                                                                 | Fundamentos   |
| Índice de Sharpe                 | `sharpeRatio`       | Maior é melhor                                                                                | Fundamentos   |
| Índice de Sortino                | `sortinoRatio`      | Maior é melhor                                                                                | Fundamentos   |
| Anos de crescimento de dividendos| `dividendGrowthYears`| Maior é melhor (consistência)                                                                 | Fundamentos   |
| Distância ao topo de 52 semanas  | `high52ch`          | Valores negativos = abaixo do topo (mais barato); invertido na pontuação                      | Oportunidade  |
| Distância ao fundo de 52 semanas | `low52ch`           | Valores menores = mais perto do fundo (mais barato); invertido na pontuação                   | Oportunidade  |
| RSI diário                       | `rsi`               | Menor = mais barato (sobrevendido)                                                            | Oportunidade  |
| Variação vs MMs (20/50/200)      | `ma20ch`, `ma50ch`, `ma200ch` | Média das três; mais negativo = mais barato                                         | Oportunidade  |

> Campos propositalmente não usados nesta versão: `peRatio` (só existe para VT), `relativeVolume`, `averageVolume` e métricas específicas de bonds/commodities (SEC yield, YTM, contango/backwardation), pois não aparecem no JSON de todos os tickers.

---

## 2. Pré-processamento

1. **Conversão de tipos:** todos os campos numéricos são tratados como `float`.
2. **Liquidez com escala log:** para `dollarVolume`, usamos `log10` antes da normalização, evitando que um campeão de volume distorça a escala.
3. **Inversão de sinal:** para métricas em que valores menores são melhores (custo, RSI, distâncias aos extremos, médias móveis), multiplicamos por `-1` antes da normalização, de modo que notas maiores indiquem situações mais atrativas.

---

## 3. Normalização (0–100)

Cada componente vira uma nota entre 0 e 100 usando min–max scaling sob a amostra atual (os ETFs comparados):

```
score(x) = 100 * (x' - min(x')) / (max(x') - min(x'))
```

- `x' = log10(x)` para `dollarVolume`.
- `x' = -x` quando “menor é melhor”.
- Se `max == min` em um componente (todos iguais), atribuímos 50 para todos — componente neutro.

---

## 4. Pontuação de Fundamentos

### 4.1 Componentes e pesos

- **Custo (25%)**: `expenseRatio` invertido.
- **Liquidez (20%)**: `log10(dollarVolume)`.
- **Emissor (15%)**: nota qualitativa mapeada e normalizada.
- **Sharpe (20%)**: `sharpeRatio`.
- **Sortino (10%)**: `sortinoRatio`.
- **Estabilidade de dividendos (10%)**: `dividendGrowthYears`.

```
FundamentalsScore =
  0.25 * S_custo +
  0.20 * S_liquidez +
  0.15 * S_emissor +
  0.20 * S_sharpe +
  0.10 * S_sortino +
  0.10 * S_dividendos
```

### 4.2 Mapa de emissor (configurável)

| Emissor                         | Nota base |
| ------------------------------- | --------- |
| Vanguard                       | 100       |
| BlackRock                      | 95        |
| American Century Investments   | 75        |
| GraniteShares                  | 70        |

A nota base passa por min–max com o restante dos ETFs para manter proporcionalidade mesmo quando novos emissores forem adicionados.

---

## 5. Pontuação de Oportunidade

### 5.1 Componentes e pesos

- **Abaixo do topo de 52 semanas (30%)**: `high52ch` (invertido).
- **Perto do fundo de 52 semanas (20%)**: `low52ch` (invertido).
- **Tendência pelas MMs (30%)**: média de `ma20ch`, `ma50ch`, `ma200ch` (invertido).
- **RSI (20%)**: `rsi` (invertido).

```
OpportunityScore =
  0.30 * S_topo52_inv +
  0.20 * S_fundo52_inv +
  0.30 * S_mms_inv +
  0.20 * S_rsi_inv
```

Observações:
- `high52ch` já é negativo quando o preço está abaixo do topo; a inversão transforma valores mais negativos em notas maiores.
- A média das três variações de MMs funciona como um termômetro simples da tendência em múltiplos horizontes.

---

## 6. Pontuação Final e Ranking

- **Pontuação Final (0–100)**: média ponderada entre Fundamentos e Oportunidade (padrão 50% / 50%).

```
FinalScore = 0.5 * FundamentalsScore + 0.5 * OpportunityScore
```

- **Ranking**: ordenar os ETFs por `FinalScore` em ordem decrescente.
- Em caso de empate, manter ordem alfabética do ticker ou usar critérios secundários (ex.: maior `FundamentalsScore`).

---

## 7. Passo a passo resumido (pipeline)

1. Carregar o JSON dos ETFs.
2. Extrair os campos listados na seção 1.
3. Aplicar transformações: `log10` (liquidez) e inversões de sinal.
4. Normalizar cada componente com min–max (0–100).
5. Calcular `FundamentalsScore` com os pesos da seção 4.
6. Calcular `OpportunityScore` com os pesos da seção 5.
7. Combinar em `FinalScore` (50/50 por padrão).
8. Ordenar por `FinalScore` para gerar o ranking.

---

## 8. Regras de contorno e decisões de design

- **Amostra-dependente:** min–max depende dos ETFs considerados; remover ou adicionar ativos reescala as notas.
- **Componentes constantes:** se todos tiverem o mesmo valor em um componente, cada ETF recebe nota 50 nesse componente.
- **Dados ausentes:** a versão atual assume campos presentes; se faltar, recomenda-se imputar 50 (neutro) ou a mediana para evitar viés.
- **Grupos distintos:** o modelo é genérico; crie rankings por categoria se quiser evitar misturar equities, renda fixa e commodities.
- **Pesos ajustáveis:** altere a ponderação para priorizar qualidade (ex.: 60/40) ou timing (ex.: 30/70) sem mudar o restante do fluxo.

---

## 9. Pesos padrão (resumo)

- **Fundamentos (100%)**: Custo 25%, Liquidez 20%, Emissor 15%, Sharpe 20%, Sortino 10%, Dividendos (anos) 10%.
- **Oportunidade (100%)**: Abaixo do topo 30%, Perto do fundo 20%, Médias móveis 30%, RSI 20%.
- **Final**: 50% Fundamentos + 50% Oportunidade.

---

## 10. Pseudocódigo (opcional)

```pseudo
input: etfs[]  // cada ETF com os campos do JSON listados

for each etf in etfs:
  liq_raw = log10(etf.dollarVolume)
  ma_avg_raw = mean([etf.ma20ch, etf.ma50ch, etf.ma200ch])

// normalizar cada componente separadamente (min–max 0..100)
S_custo  = minmax(-etf.expenseRatio)
S_liq    = minmax(liq_raw)
S_emiss  = minmax(mapIssuer(etf.issuer))  // Vanguard=100, BlackRock=95, etc.
S_sharpe = minmax(etf.sharpeRatio)
S_sort   = minmax(etf.sortinoRatio)
S_divyrs = minmax(etf.dividendGrowthYears)

S_hi52   = minmax(-etf.high52ch)   // abaixo do topo = melhor
S_lo52   = minmax(-etf.low52ch)    // mais perto do fundo = melhor
S_ma     = minmax(-ma_avg_raw)     // abaixo das MMs = melhor
S_rsi    = minmax(-etf.rsi)        // RSI baixo = melhor

Fundamentals =
  0.25 * S_custo +
  0.20 * S_liq +
  0.15 * S_emiss +
  0.20 * S_sharpe +
  0.10 * S_sort +
  0.10 * S_divyrs

Opportunity =
  0.30 * S_hi52 +
  0.20 * S_lo52 +
  0.30 * S_ma +
  0.20 * S_rsi

FinalScore = 0.50 * Fundamentals + 0.50 * Opportunity

rank = sort_by(FinalScore desc)
```

---

## 11. Exemplo prático (dados reais)

Aplicando o método ao conjunto `{VT, SDSI, COMB, IBIK}` com os pesos padrão:

| Ticker | FinalScore (aprox.) |
| ------ | ------------------- |
| IBIK   | 71,7                |
| VT     | 57,9                |
| SDSI   | 39,5                |
| COMB   | 30,7                |

Os valores vêm da aplicação direta do pipeline: componentes normalizados → pesos → `FinalScore`.

---

## 12. Como personalizar

- Trocar pesos (ex.: 60% Fundamentos / 40% Oportunidade).
- Ajustar o mapa de emissores conforme a sua curadoria.
- Incluir métricas extras quando disponíveis (ex.: `peRatio` para equities, SEC yield/YTM para bonds, contango/backwardation para commodities) adicionando novos componentes com pesos próprios, seguindo o mesmo pipeline de normalização e soma ponderada.
