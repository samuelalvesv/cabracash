# Sistema de Pontuação e Ranking de ETFs (independente de categoria)

Mark (especialista em ETFs dos EUA) propõe a seguir um método unificado para comparar qualquer ETF com base apenas em **Fundamentos** e **Oportunidade de compra**, sem depender da categoria informada pelo emissor. A estratégia se apoia em métricas de custo, eficiência, liquidez, risco e preço — todas normalizadas para que equities, renda fixa, commodities, buffer funds e produtos táticos possam ser avaliados na mesma escala.

---

## 1. Indicadores utilizados (PT-BR ⇄ JSON ⇄ Notas)

| Indicador (PT-BR)                     | Campo no JSON                         | Observação para a pontuação                                    |
| ------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| Custo total anual                     | `expenseRatio`                        | Menor é melhor (invertido)                                     |
| Liquidez diária (US$)                 | `dollarVolume`                        | Escala log10 para reduzir outliers                             |
| Qualidade do emissor                  | `issuer`                              | Nota pré-definida por emissor (cartilha ajustável)             |
| Eficiência de retorno                 | `sharpeRatio`, `sortinoRatio`         | Maior é melhor                                                 |
| Perfil de renda                       | `dividendYield`, `dividendGrowthYears`| Yield e consistência de crescimento                            |
| Beta vs mercado                       | `beta`                                | Quanto mais próximo de 1, melhor (menor desvio)                |
| Volatilidade diária normalizada       | `atr` / `close`                       | Menor = melhor (estabilidade de preço)                         |
| Distância ao topo de 52 semanas       | `high52ch`                            | Valores negativos indicam desconto; invertido                  |
| Distância ao fundo de 52 semanas      | `low52ch`                             | Valores pequenos indicam proximidade do piso; invertido        |
| Desvio das médias móveis              | `ma20ch`, `ma50ch`, `ma200ch`         | Média dos três; valores muito positivos indicam sobrecompra    |
| RSI diário                            | `rsi`                                 | RSI baixo = sobrevendido; invertido                            |
| Fluxo anormal de volume               | `relativeVolume`                      | Usamos `log1p(relativeVolume)`                                 |
| Momentum recente                      | `tr1m`                                | Total return 1 mês; maior é melhor                             |
| Variação intradiária                  | `changeFromOpen`                      | Captura reação do mercado no dia                               |

> Se algum campo não estiver presente para um ETF, atribuímos uma nota neutra (50) após a normalização para não distorcer o ranking.

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

| Componente                          | Símbolo         | Peso | Observação |
| ----------------------------------- | --------------- | ---- | ---------- |
| Eficiência de custo                 | `S_custo`       | 20%  | `expenseRatio` invertido             |
| Profundidade de liquidez            | `S_liq`         | 15%  | `log10(dollarVolume)`               |
| Qualidade do emissor                | `S_emissor`     | 10%  | Nota cartorial + normalização       |
| Sharpe ratio                        | `S_sharpe`      | 20%  | Retorno por unidade de risco        |
| Sortino ratio                       | `S_sortino`     | 10%  | Penaliza downside                   |
| Yield corrente                      | `S_yield`       | 10%  | `dividendYield`                     |
| Consistência de dividendos          | `S_divyears`    | 5%   | `dividendGrowthYears`               |
| Beta balanceado                     | `S_beta`        | 5%   | Inverte `beta_dev` (quanto mais próximo de 1, melhor) |
| Volatilidade controlada             | `S_atr`         | 5%   | Inverte `atr_ratio`                 |
| Estabilidade de distribuição        | `S_divgrowth`   | 5%   | `dividendGrowth` (se disponível)    |

```
FundamentalsScore =
  0.20*S_custo +
  0.15*S_liq +
  0.10*S_emissor +
  0.20*S_sharpe +
  0.10*S_sortino +
  0.10*S_yield +
  0.05*S_divyears +
  0.05*S_beta +
  0.05*S_atr +
  0.05*S_divgrowth
```

---

## 5. Oportunidade (OpportunityScore)

**Peso total: 100.**

| Componente                      | Símbolo      | Peso | Observação |
| ------------------------------- | ------------ | ---- | ---------- |
| Desconto vs topo de 52 semanas  | `S_top52`    | 20%  | `high52ch` invertido                 |
| Proximidade ao piso de 52 semanas| `S_bottom52` | 20%  | `low52ch` invertido                  |
| Deslocamento das médias móveis  | `S_ma`       | 20%  | Inverte a média de `ma20ch/50/200`   |
| RSI diário                      | `S_rsi`      | 15%  | Invertido                             |
| Fluxo relativo de volume        | `S_relvol`   | 10%  | `log1p(relativeVolume)`              |
| Momentum curto (1 mês)          | `S_tr1m`     | 10%  | `tr1m`                                 |
| Movimento intradiário           | `S_intraday` | 5%   | `changeFromOpen`                      |

```
OpportunityScore =
  0.20*S_top52 +
  0.20*S_bottom52 +
  0.20*S_ma +
  0.15*S_rsi +
  0.10*S_relvol +
  0.10*S_tr1m +
  0.05*S_intraday
```

> Usamos tanto `high52ch` quanto `low52ch` para capturar onde o preço está ancorado dentro da faixa anual; ETFs perto do piso ganham pontos, enquanto os que já encostaram no topo perdem oportunidade.

---

## 6. Pontuação final e ranking

Mantemos o balanço **50% Fundamentos / 50% Oportunidade** para que produtos estáveis mas caros não passem na frente de alvos descontados com risco elevado e vice-versa.

```
FinalScore = 0.50 * FundamentalsScore + 0.50 * OpportunityScore
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
  liq_log    = log10(max(etf.dollarVolume, 1))
  rel_vol    = log1p(max(etf.relativeVolume ?? 0, 0))
  atr_ratio  = (etf.atr ?? 0) / max(etf.close ?? etf.open ?? 1, 1)
  beta_dev   = abs((etf.beta ?? 1) - 1)
  ma_combo   = mean(filter_not_null([etf.ma20ch, etf.ma50ch, etf.ma200ch]))

  features = {
    "custo": -etf.expenseRatio,
    "liq": liq_log,
    "emissor": mapIssuer(etf.issuer),
    "sharpe": etf.sharpeRatio,
    "sortino": etf.sortinoRatio,
    "yield": etf.dividendYield,
    "divyears": etf.dividendGrowthYears,
    "divgrowth": etf.dividendGrowth,
    "beta": -beta_dev,
    "atr": -atr_ratio,
    "top52": -etf.high52ch,
    "bottom52": -etf.low52ch,
    "ma": -ma_combo,
    "rsi": -etf.rsi,
    "relvol": rel_vol,
    "tr1m": etf.tr1m,
    "intraday": etf.changeFromOpen
  }

// winsorizar cada feature entre p2 e p98, depois aplicar min–max 0..100
scores = normalize_features(features)

Fundamentals =
    0.20*scores["custo"] +
    0.15*scores["liq"] +
    0.10*scores["emissor"] +
    0.20*scores["sharpe"] +
    0.10*scores["sortino"] +
    0.10*scores["yield"] +
    0.05*scores["divyears"] +
    0.05*scores["beta"] +
    0.05*scores["atr"] +
    0.05*scores["divgrowth"]

Opportunity =
    0.20*scores["top52"] +
    0.20*scores["bottom52"] +
    0.20*scores["ma"] +
    0.15*scores["rsi"] +
    0.10*scores["relvol"] +
    0.10*scores["tr1m"] +
    0.05*scores["intraday"]

FinalScore = 0.50*Fundamentals + 0.50*Opportunity
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
