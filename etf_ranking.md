# Sistema de Pontuação e Ranking de ETFs (independente de categoria)

Mark (especialista em ETFs dos EUA) propõe a seguir um método unificado para comparar qualquer ETF com base apenas em **Fundamentos** e **Oportunidade de compra**, sem depender da categoria informada pelo emissor. A estratégia se apoia em métricas de custo, eficiência, liquidez, risco e preço — todas normalizadas para que equities, renda fixa, commodities, buffer funds e produtos táticos possam ser avaliados na mesma escala.

---

## 1. Indicadores utilizados (PT-BR ⇄ JSON ⇄ Notas)

Os campos abaixo vêm direto do endpoint da StockAnalysis. Alguns são usados no ranking; os demais aparecem na página de detalhes para contexto.

### Fundamentos (utilizados na pontuação)

| Indicador (PT-BR)          | Campo no JSON            | Observação |
| -------------------------- | ------------------------ | ---------- |
| Custo total anual          | `expenseRatio`           | Menor é melhor (invertido) |
| Liquidez financeira        | `dollarVolume`           | Escala log10; profundidade em dólares |
| Liquidez em cotas          | `volume`                 | Escala log10; facilidade para ordens |
| Diversificação (holdings)  | `holdings` / `holdingsCount` | Mais holdings ⇒ carteira menos concentrada |
| Patrimônio sob gestão      | `assets`                 | Escala log10; ETFs muito pequenos recebem penalização |
| Qualidade do emissor       | `issuer`                 | Nota qualitativa, depois normalizada |
| Sharpe / Sortino           | `sharpeRatio`, `sortinoRatio` | Eficiência de retorno |
| Perfil de renda            | `dividendYield`, `dividendGrowthYears`, `dividendGrowth` | Yield e consistência |
| Beta vs mercado            | `beta`                   | Desvio em relação a 1 |
| Volatilidade relativa      | `atr` + `close`          | ATR proporcional ao preço |

### Oportunidade (utilizados na pontuação)

| Indicador (PT-BR)          | Campo no JSON                         | Observação |
| -------------------------- | ------------------------------------- | ---------- |
| Variação diária            | `ch1d`                                | Capta momentum intradiário |
| Distância ao topo 52s     | `high52ch`                            | Valores negativos ⇒ desconto (invertido) |
| Distância ao fundo 52s    | `low52ch`                             | Valores pequenos ⇒ perto do piso (invertido) |
| Médias móveis             | `ma20ch`, `ma50ch`, `ma150ch`, `ma200ch` | Média das quatro curvas |
| RSI diário                | `rsi`                                 | RSI baixo ⇒ sobrevendido |
| Volume relativo           | `relativeVolume`                      | `log1p(relativeVolume)` |
| Retorno 1m                | `tr1m`                                | Total return curto |
| Pré-market                | `premarketChangePercent`              | Expectativa antes da abertura |
| After-hours               | `afterHoursChangePercent` / `postmarketChangePercent` | Movimento pós-fechamento |

> Métricas ausentes recebem nota neutra (50) após a normalização para não distorcer a pontuação.

---

## 2. Pré-processamento e derivação de métricas

1. **Conversão de tipos:** todos os campos numéricos são tratados como `float`.
2. **Liquidez logarítmica:** `liq_log = log10(max(dollarVolume, 1))`.
3. **Fluxo logarítmico:** `rel_vol = log1p(max(relativeVolume, 0))`.
4. **Volatilidade proporcional:** `atr_ratio = atr / max(close, 1)`.
5. **Beta neutro:** `beta_dev = abs(beta ?? 1 - 1)`; métricas menores indicam comportamento mais “core”.
6. **Média das médias móveis:** `ma_combo = mean([ma20ch, ma50ch, ma200ch])`.
7. **Tratamento de valores ausentes:** quando o emissor não está no mapa ou a métrica é `null`, mantemos o valor como `null`. Na etapa de normalização ele recebe a nota neutra (50), evitando premiar ou punir o ETF pela falta de dado.

---

## 3. Normalização robusta (0–100)

Para cada métrica calculamos `score(x)` com min–max formado após **winsorizar** os dados entre os percentis 2% e 98%, evitando distorções de outliers.

```
x' = transform(x)  // log, inversão de sinal, etc.
score(x) = 100 * (x' - min_trimmed) / (max_trimmed - min_trimmed)
```

- Métricas onde “menor = melhor” recebem inversão (`x' = -transform(x)`).
- Se `max_trimmed == min_trimmed`, todos recebem 50 (neutro).
- O mapa de emissores continua aplicando min–max para manter proporcionalidade quando novos players entram.

---

## 4. Fundamentos (FundamentalsScore)

**Peso total: 100.**

| Componente                      | Símbolo           | Peso | Observação |
| ------------------------------- | ----------------- | ---- | ---------- |
| Eficiência de custo             | `S_custo`         | 15%  | `expenseRatio` invertido |
| Liquidez financeira             | `S_liq_dollar`    | 12%  | `log10(dollarVolume)` |
| Liquidez em cotas               | `S_liq_volume`    | 8%   | `log10(volume)` |
| Diversificação (holdings)       | `S_holdings`      | 10%  | `holdings` / `holdingsCount` |
| Patrimônio sob gestão           | `S_assets`        | 5%   | `log10(assets)` |
| Qualidade do emissor            | `S_emissor`       | 10%  | Nota qualitativa (IssuerScore) |
| Sharpe ratio                    | `S_sharpe`        | 15%  | Retorno ajustado ao risco |
| Sortino ratio                   | `S_sortino`       | 5%   | Penaliza downside |
| Dividend Yield                  | `S_yield`         | 8%   | `dividendYield` |
| Anos de crescimento de dividendos | `S_divyears`    | 4%   | `dividendGrowthYears` |
| Crescimento de dividendos       | `S_divgrowth`     | 4%   | `dividendGrowth` |
| Beta balanceado                 | `S_beta`          | 2%   | Inverte `|beta - 1|` |
| Volatilidade controlada         | `S_atr`           | 2%   | Inverte `atr / close` |

```
FundamentalsScore =
  0.15*S_custo +
  0.12*S_liq_dollar +
  0.08*S_liq_volume +
  0.10*S_holdings +
  0.05*S_assets +
  0.10*S_emissor +
  0.15*S_sharpe +
  0.05*S_sortino +
  0.08*S_yield +
  0.04*S_divyears +
  0.04*S_divgrowth +
  0.02*S_beta +
  0.02*S_atr
```

---

## 5. Oportunidade (OpportunityScore)

**Peso total: 100.**

| Componente                      | Símbolo      | Peso | Observação |
| ------------------------------- | ------------ | ---- | ---------- |
| Variação diária                 | `S_ch1d`     | 12%  | `ch1d` |
| Distância ao topo de 52 semanas | `S_top52`    | 18%  | `high52ch` invertido |
| Distância ao fundo de 52 semanas| `S_bottom52` | 18%  | `low52ch` invertido |
| Deslocamento das médias móveis  | `S_ma`       | 15%  | Média de `ma20ch`, `ma50ch`, `ma150ch`, `ma200ch` (invertido) |
| RSI diário                      | `S_rsi`      | 10%  | RSI baixo ⇒ sobrevendido |
| Fluxo relativo de volume        | `S_relvol`   | 8%   | `log1p(relativeVolume)` |
| Momentum 1 mês                  | `S_tr1m`     | 8%   | `tr1m` |
| Pré-market                      | `S_pre`      | 5%   | `premarketChangePercent` |
| After-hours                     | `S_after`    | 6%   | `afterHoursChangePercent` (fallback `postmarketChangePercent`) |

```
OpportunityScore =
  0.12*S_ch1d +
  0.18*S_top52 +
  0.18*S_bottom52 +
  0.15*S_ma +
  0.10*S_rsi +
  0.08*S_relvol +
  0.08*S_tr1m +
  0.05*S_pre +
  0.06*S_after
```

> Tanto `high52ch` quanto `low52ch` indicam onde o preço está ancorado na faixa anual; os sinais pré/pós mercado ajudam a identificar gaps que ainda não foram precificados no período regular.

---

## 6. Pontuação final e ranking

Mantemos o balanço **60% Fundamentos / 40% Oportunidade** para privilegiar a qualidade estrutural sem perder o senso de timing.

```
FinalScore = 0.60 * FundamentalsScore + 0.40 * OpportunityScore
```

Ordene os ETFs por `FinalScore` em ordem decrescente. Empates são resolvidos por `FundamentalsScore` maior; persistindo, use ordem alfabética do ticker.

---

## 7. Pipeline resumido

1. Carregar o JSON dos ETFs.
2. Derivar métricas auxiliares (liq_log, atr_ratio, beta_dev, ma_combo, rel_vol).
3. Winsorizar cada métrica nos percentis 2%–98%.
4. Normalizar em notas 0–100 (com inversões quando necessário).
5. Calcular `FundamentalsScore` e `OpportunityScore` com os pesos acima.
6. Combinar as notas em `FinalScore`.
7. Ordenar para gerar o ranking e armazenar as notas intermediárias para auditoria.

---

## 8. Boas práticas e regras de contorno

- **Independência de categoria:** como todas as métricas são risco-ajustadas ou normalizadas contra a amostra, não precisamos de agrupamento por segmento para comparar ETFs radicalmente diferentes.
- **Dados ausentes:** substitua por 50 (neutro) ou pela mediana da amostra; registre o número de campos faltantes por ETF para alertar o usuário.
- **Sensibilidade a outliers:** revise periodicamente os percentis usados na winsorização; em amostras muito pequenas (≤5 ETFs) considere min–max simples para evitar perda de resolução.
- **Mapa de emissores:** mantenha um arquivo de notas para emissores (Vanguard, BlackRock, State Street, etc.) e atualize conforme a sua curadoria.
- **Produtos alavancados/inversos:** se desejar restringir o ranking, aplique uma penalidade automática no `S_beta` ou `S_atr` ao detectar termos como “Ultra”, “-2x”, “Inverse”.

---

## 9. Pseudocódigo

```pseudo
input: etfs[]  // ETFs com os campos do JSON

for each etf in etfs:
  liq_dollar   = log10(max(etf.dollarVolume ?? 0, 1))
  liq_volume   = log10(max(etf.volume ?? 0, 1))
  holdings     = etf.holdings ?? etf.holdingsCount ?? 0
  assets_log   = log10(max(etf.assets ?? 0, 1))
  rel_vol      = log1p(max(etf.relativeVolume ?? 0, 0))
  atr_ratio    = (etf.atr ?? 0) / max(etf.close ?? etf.open ?? 1, 1)
  beta_dev     = abs((etf.beta ?? 1) - 1)
  ma_combo     = mean(filter_not_null([etf.ma20ch, etf.ma50ch, etf.ma150ch, etf.ma200ch]))
  after_change = coalesce(etf.afterHoursChangePercent, etf.postmarketChangePercent, 0)

  features = {
    "custo": -etf.expenseRatio,
    "liq_dollar": liq_dollar,
    "liq_volume": liq_volume,
    "holdings": holdings,
    "assets": assets_log,
    "emissor": mapIssuer(etf.issuer),
    "sharpe": etf.sharpeRatio,
    "sortino": etf.sortinoRatio,
    "yield": etf.dividendYield,
    "divyears": etf.dividendGrowthYears,
    "divgrowth": etf.dividendGrowth,
    "beta": -beta_dev,
    "atr": -atr_ratio,
    "ch1d": etf.ch1d,
    "top52": -etf.high52ch,
    "bottom52": -etf.low52ch,
    "ma": -ma_combo,
    "rsi": -etf.rsi,
    "relvol": rel_vol,
    "tr1m": etf.tr1m,
    "pre": etf.premarketChangePercent,
    "after": after_change
  }

// winsorizar cada feature entre p2 e p98, depois aplicar min–max 0..100
scores = normalize_features(features)

Fundamentals =
    0.15*scores["custo"] +
    0.12*scores["liq_dollar"] +
    0.08*scores["liq_volume"] +
    0.10*scores["holdings"] +
    0.05*scores["assets"] +
    0.10*scores["emissor"] +
    0.15*scores["sharpe"] +
    0.05*scores["sortino"] +
    0.08*scores["yield"] +
    0.04*scores["divyears"] +
    0.04*scores["divgrowth"] +
    0.02*scores["beta"] +
    0.02*scores["atr"]

Opportunity =
    0.12*scores["ch1d"] +
    0.18*scores["top52"] +
    0.18*scores["bottom52"] +
    0.15*scores["ma"] +
    0.10*scores["rsi"] +
    0.08*scores["relvol"] +
    0.08*scores["tr1m"] +
    0.05*scores["pre"] +
    0.06*scores["after"]

FinalScore = 0.60*Fundamentals + 0.40*Opportunity
```

---

## 10. Exemplo resumido

Aplicando o método aos ETFs `{VT, SDSI, COMB, IBIK}` com os dados fornecidos:

| ETF  | Fundamentals | Opportunity | FinalScore (≈) | Observação rápida                                    |
| ---- | ------------ | ----------- | -------------- | ---------------------------------------------------- |
| VT   | 62           | 51          | 56             | Forte em custo/Sharpe, menos atrativo no preço atual |
| IBIK | 58           | 64          | 61             | Bom desconto vs 52s e yield competitivo              |
| SDSI | 54           | 37          | 46             | Perfil defensivo, porém pouco upside no curto prazo  |
| COMB | 48           | 42          | 45             | Commodities estáveis, mas momentum ainda modesto     |

*(valores ilustrativos; recalcular ao rodar a pipeline completa).*  

---

## 11. Como evoluir

- Ajustar pesos conforme o perfil desejado (ex.: 60/40 para foco em fundamento de longo prazo).
- Incluir métricas adicionais (peRatio, duration, contango) ao ampliar o dataset; basta aplicar a mesma lógica de normalização e somar ao conjunto de pesos.
- Registrar a data de cálculo e snapshots das pontuações para monitorar mudanças no tempo.

Com esse framework unificado, a seleção de ETFs fica consistente mesmo que as categorias oficiais sejam inconsistentes ou ausentes. O investidor brasileiro consegue enxergar rapidamente o equilíbrio entre qualidade estrutural e oportunidade de entrada, independentemente de estar olhando para equities globais, bonds ou estratégias estruturadas.***
