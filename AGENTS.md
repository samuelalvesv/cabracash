# Guia para Agentes de IA

Este documento resume a arquitetura do projeto CabraCash e referencia os pontos críticos para agentes de IA que precisam navegar, responder dúvidas ou ajustar o sistema.

## Visão geral

- **Objetivo**: calcular, cachear e expor um ranking de ETFs com base em métricas de fundamentos (55%) e oportunidade (45%).
- **Frontend**: Next.js (App Router) + Material UI.
- **Organização**: estilo “feature-first” em `src/`, isolando domínio (`features/`), compartilhados (`shared/`, `services/`, `theme/`) e interface (`components/ui/`).
- **Documentação de negócio**: `docs/etf_ranking.md` descreve a metodologia de pontuação e deve ser consultado antes de alterar pesos, métricas ou regras de ranking.

## Estrutura relevante

```
src/
├── app/                   # Rotas Next.js (páginas e APIs)
│   ├── api/               # Endpoints backend (market, ranking)
│   ├── etf/[symbol]/      # Página dinâmica de detalhes de ETF
│   ├── layout.tsx         # Layout global com ThemeRegistry + Header
│   └── page.tsx           # Página principal (lista ranqueada)
├── features/
│   └── ranking/
│       ├── components/    # UI específica (RankingView, EtfDetailsView, skeletons)
│       └── server/        # Casos de uso, cache, métricas, tipos e testes
├── components/ui/         # Componentes compartilhados (Header)
├── services/              # Integrações externas (fetch de dados de mercado)
├── shared/                # Hooks e utilidades reutilizáveis
└── theme/                 # Tema MUI e ThemeRegistry
```

Alias `@/` aponta para `src/`.

## Pontos de atenção

1. **Ranking**:
   - Lógica principal em `src/features/ranking/server/scoring.ts`.
   - Cache in-memory (`fetchWithCache`) em `src/features/ranking/server/cache.ts` com TTL de 15 minutos.
   - Validar mudanças consultando `docs/etf_ranking.md` para manter a coerência da metodologia.

2. **APIs**:
   - `/api/market`: proxy para dados brutos (`src/app/api/market/route.ts`).
   - `/api/market/ranking`: retorna o ranking pronto (`src/app/api/market/ranking/route.ts`).
   - Testes em `src/app/api/**/__tests__/`.

3. **Frontend**:
   - `src/app/page.tsx` consome `fetchRankedEtfs` e renderiza `RankingView`.
   - `src/app/etf/[symbol]/page.tsx` usa a mesma fonte de dados para mostrar detalhes (`EtfDetailsView`).
   - Componentes client-side estão na pasta da feature (`features/ranking/components`).

4. **Tema e contexto**:
   - `src/theme/ThemeRegistry.tsx` encapsula `ThemeProvider`, persistência de modo claro/escuro e contexto (`ColorModeContext`).
   - Hook `useColorMode` em `src/shared/hooks/useColorMode.ts`.

5. **Serviços externos**:
   - `src/services/market-data.ts` faz o fetch da StockAnalysis (ver endpoint hardcoded).

6. **Testes**:
   - Cobertura principal em `src/features/ranking/server/__tests__/`, `src/features/ranking/components/__tests__/`, `src/components/ui/__tests__/` e `src/theme/__tests__/`.
   - Utilizam Vitest + Testing Library (`npm run test`).
   - Mantenha mocks como `tests/styleMock.ts` (referenciado no `vitest.config.ts`).

## Fluxo típico para alterações

1. Verificar se a mudança impacta a metodologia (consultar `docs/etf_ranking.md`).
2. Atualizar o domínio em `features/ranking/server/` e, se necessário, a UI em `features/ranking/components/`.
3. Ajustar integrações ou serviços em `services/`.
4. Atualizar testes correlatos.
5. Rodar `npm run lint` e `npm run test`.

## Contato com documentação de negócio

- **`docs/etf_ranking.md`**: detalha pesos, métricas, tratamentos de dados ausentes e penalidades (ex.: value trap). Use como fonte primária para responder perguntas sobre a metodologia.

## Convenções adicionais

- Preferir imports absolutos com `@/`.
- Manter componentes e testes próximos ao domínio responsável.
- Documentar mudanças significativas na metodologia ou APIs no `README.md` e em `docs/etf_ranking.md`.
