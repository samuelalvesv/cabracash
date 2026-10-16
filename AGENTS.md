# Guia para Agentes de IA

Este documento define a arquitetura, os princípios de engenharia e os pontos operacionais do CabraCash. Todos os agentes e desenvolvedores devem seguir estas diretrizes rigorosamente.

## Princípios de Desenvolvimento

1. **Stack Moderna Nativa**:
   - TypeScript 5.9 configurado com target `ES2024` e checagens estritas (`noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`).
   - Next.js 16 (App Router + Turbopack).
   - React 19 nativo (compatível com React Compiler).
   - Material UI 9.
   - ESLint 9 Flat Config nativo (sem `FlatCompat`).
   - Node.js 26.

2. **Contratos Fortemente Tipados e Rígidos**:
   - Mapeamento estrito e literal derivado de Single Source of Truth (`MARKET_DATA_FIELDS`, `FundamentalFeatureKey`, `OpportunityFeatureKey`, `MarketDataRecord`).
   - Proibido o uso de tipos soltos (`any`, `Record<string, unknown>`) ou campos fantasmas que não existem na API de mercado.

3. **Fonte Única de Verdade (SSOT)**:
   - Pesos (`FUNDAMENTALS_WEIGHTS`, `OPPORTUNITY_WEIGHTS`), definições de métricas, lista de campos da API e tratamento de parâmetros de busca derivam de um único local no código e guiam o domínio, os testes e a interface.

4. **MUI First**:
   - Utilização prioritária dos componentes, sistema de temas e tokens (`background.paper`, `background.default`, `action.hover`, `divider`, `text.secondary`) do Material UI.
   - Proibido o uso de cores hex arbitrárias com ternários manuais para temas ou resets CSS manuais.
   - **Regra do MUI 9**: Propriedades do System (`alignItems`, `justifyContent`, `flexWrap`, `flexGrow`, `fontWeight`, `lineHeight`, `display`) devem ser aplicadas exclusivamente via prop `sx={{ ... }}` em `<Typography>`, `<Stack>` e `<Box>`.

5. **Server-First & URL como Estado Primário**:
   - Componentes são Server Components por padrão. Apenas marque com `"use client"` componentes que exigem interatividade, hooks de eventos ou APIs do navegador.
   - O estado de filtros e paginação reside na URL (`searchParams`). A sincronização client-side é feita via `useSyncExternalStore` (`useRankingHref`), evitando cascading renders e hydration mismatches.

6. **Fazer Mais com Menos (Lean / YAGNI)**:
   - Menor quantidade de código e estados necessária para atingir os objetivos de negócio com clareza e performance.
   - Elimine estados derivados redundantes e duplicações de código.

7. **Fail First (Fail Fast)**:
   - Validação imediata de contratos e integridade de dados na fronteira do sistema (`fetchMarketData`). Respostas inválidas, com status divergente ou coleções vazias disparam `MarketDataConnectionError` imediatamente, impedindo a contaminação do cache de ranking.

8. **Documentação no Presente (Evergreen Docs)**:
   - A documentação descreve estritamente o estado real e ativo da aplicação. Não faz menção ao passado, funcionalidades removidas, migrações anteriores ou ao que o sistema não faz.

9. **Uso Máximo dos Recursos de `.agents`**:
   - Sempre utilize os recursos configurados no ecossistema `.agents`:
     - **MCP Servers** (`.agents/mcp_config.json`): utilize `next-devtools` para inspeção e testes do Next.js, `mui-mcp` para consulta e geração de padrões do Material UI e `vercel` para infraestrutura e deploys.
     - **Skills e Plugins** (`.agents/plugins.json`): utilize `ponytail` para revisões enxutas e auditoria de qualidade, `react-best-practices` para validações de código React e as ferramentas da Vercel para verificação end-to-end.

---

## Estrutura da Aplicação

```
src/
├── app/                   # Rotas Next.js (App Router)
│   ├── about/             # Página institucional sobre a metodologia
│   ├── api/               # Endpoints REST (market, ranking)
│   ├── etf/[symbol]/      # Detalhes dinâmicos do ETF
│   ├── layout.tsx         # Layout global com ThemeRegistry + Header + Footer
│   └── page.tsx           # Página principal com o ranking
├── features/
│   └── ranking/
│       ├── components/    # Interface do ranking (RankingView, EtfDetailsView, skeletons, hooks)
│       └── server/        # Casos de uso, cache in-memory, métricas, tipos e scoring
├── components/ui/         # Componentes globais de interface (Header, Footer)
├── services/              # Integração de dados de mercado e validação de contrato
├── shared/                # Hooks e utilitários compartilhados
└── theme/                 # Configuração do tema MUI e ThemeRegistry
```

Alias `@/` aponta diretamente para `src/`.

---

## Pontos Críticos de Implementação

1. **Ranking e Domínio**:
   - Algoritmo de pontuação em `src/features/ranking/server/scoring.ts` combina Fundamentos (55%, 9 indicadores) e Oportunidade (45%, 8 indicadores).
   - Cache in-memory com TTL de 15 minutos (`RANKING_CACHE_TTL_MS`) em `src/features/ranking/server/cache.ts`.
   - Empates são resolvidos por maior nota de fundamentos e, subsequentemente, por ordem alfabética do ticker.

2. **Integração de Mercado e API**:
   - `src/services/market-data.ts` consome os endpoints `initial` e `data-points`, consolidando exatamente os 110 campos da API (7 cadastrais base + 103 data points).
   - Erros de conexão ou payloads inválidos retornam HTTP 503 com mensagem amigável nas rotas `/api/market` e `/api/market/ranking`.
   - `src/app/error.tsx` atua como Error Boundary da interface, oferecendo botão de retry.

3. **Tema e Modo Escuro**:
   - `src/theme/ThemeRegistry.tsx` e `src/shared/hooks/useColorMode.ts` gerenciam a alternância de tema via `useSyncExternalStore` persistido em `localStorage`.

4. **Linter e Qualidade**:
   - `eslint.config.mjs` utiliza as configurações nativas de Flat Config de `eslint-config-next`.
   - Proibido o uso de comentários de supressão (`eslint-disable`).

5. **Execução de Comandos**:
   - Comandos de terminal devem ser executados com o prefixo **`rtk`** (ex.: `rtk npm test`, `rtk npm run lint`, `rtk npm run build`).
