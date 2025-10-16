# CabraCash

CabraCash é um site em Next.js que entrega um ranking imparcial de ETFs americanos. Todos os fundos são avaliados com a mesma metodologia — descrita em `docs/etf_ranking.md` — combinando indicadores de fundamentos (55%) e de oportunidade (45%). Assim, o investidor visualiza em segundos uma lista comparável, sem depender de planilhas em Excel.

## Requisitos

- Node.js 18.18 ou superior
- NPM (o projeto usa `package-lock.json`)

## Instalação

```bash
npm install
```

## Scripts principais

```bash
npm run dev     # servidor de desenvolvimento (Next.js + Turbopack)
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # análise estática (ESLint)
npm run test    # suíte de testes (Vitest + @testing-library)
```

## Estrutura de pastas

```
.
├── docs/
│   └── etf_ranking.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market/
│   │   │   │   ├── route.ts
│   │   │   │   └── __tests__/route.test.ts
│   │   │   └── market/ranking/
│   │   │       ├── route.ts
│   │   │       └── __tests__/route.test.ts
│   │   ├── etf/
│   │   │   └── [symbol]/
│   │   │       ├── loading.tsx
│   │   │       ├── not-found.tsx
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── Header.tsx
│   │       └── __tests__/Header.test.tsx
│   ├── features/
│   │   └── ranking/
│   │       ├── components/
│   │       │   ├── EtfDetailsSkeleton.tsx
│   │       │   ├── EtfDetailsView.tsx
│   │       │   ├── RankingSkeleton.tsx
│   │       │   ├── RankingView.tsx
│   │       │   └── __tests__/
│   │       │       ├── EtfDetailsView.test.tsx
│   │       │       └── RankingView.test.tsx
│   │       └── server/
│   │           ├── cache.ts
│   │           ├── detailSections.ts
│   │           ├── metricDefinitions.ts
│   │           ├── scoring.ts
│   │           ├── types.ts
│   │           ├── utils.ts
│   │           ├── validation.ts
│   │           └── __tests__/
│   │               ├── cache.test.ts
│   │               ├── fetchRankedEtfs.test.ts
│   │               └── scoring.test.ts
│   ├── services/
│   │   ├── market-data.ts
│   │   └── __tests__/market-data.test.ts
│   ├── shared/
│   │   ├── hooks/useColorMode.ts
│   │   └── utils/formatters.ts
│   └── theme/
│       ├── ThemeRegistry.tsx
│       ├── createAppTheme.ts
│       └── __tests__/ThemeRegistry.test.tsx
├── tests/
│   └── styleMock.ts
├── AGENTS.md
├── README.md
└── package.json
```

Importações absolutas usam o alias `@/` apontando para `src/`.

## Fluxo de dados

1. `src/services/market-data.ts` busca o payload bruto de ETFs diretamente da StockAnalysis.
2. `src/features/ranking/server/scoring.ts` processa o payload, normaliza indicadores conforme a metodologia e aplica cache in-memory (TTL de 15 minutos) para evitar refetchs constantes.
3. As rotas de API (`/api/market`, `/api/market/ranking`) e as páginas (`src/app/page.tsx`, `src/app/etf/[symbol]/page.tsx`) consomem o caso de uso para exibir os dados ao usuário.
4. Componentes client-side (`RankingView`, `EtfDetailsView`) trabalham os dados em UI rica: filtros, paginação, DataGrid, breakdowns e skeletons.

## Páginas e navegação

- **Ranking (`/`)**  
  A tela principal oferece duas visualizações:
  - **Cards**: cada ETF aparece com destaque para o ticker, nome, notas de Fundamentos/Oportunidade e principais métricas, facilitando uma leitura rápida estilo “painel”.
  - **Tabela (DataGrid)**: quem prefere trabalhar em modo tabular encontra colunas personalizáveis, filtros por score mínimo e busca livre.
  Ambos os modos compartilham paginação e filtros sincronizados, permitindo alternar sem perder o contexto.

- **Detalhes (`/etf/[symbol]`)**  
  Ao clicar em um ETF, a página de detalhes mostra a decomposição completa do score: indicadores brutos, métricas ponderadas, chips de classificação e uma visão organizada em seções (identificação, liquidez, dividendos, risco, momento, etc.). Há um botão de retorno ao ranking e skeletons para carga suave.

- **Sobre (`/about`)**  
  Explica em linguagem direta por que diversificar com ETFs dolarizados, como o ranking funciona e quais pesos/indicadores são utilizados. Inclui CTA para voltar ao ranking, reforçando a jornada do usuário.

Essas páginas compartilham o `Header` com seleção de tema claro/escuro e navegação responsiva.

## Testes

A suíte roda com Vitest e Testing Library. Abrange:

- Lógica de ranking e cache (`src/features/ranking/server/__tests__`).
- Rotas de API (`src/app/api/**/__tests__`).
- Componentes principais (`src/features/ranking/components/__tests__`, `src/components/ui/__tests__`).
- Tema e persistência de modo (`src/theme/__tests__`).

Execute localmente com:

```bash
npm run test
```

## Contribuições e estilo

- Use `npm run lint` antes de enviar alterações.
- Prefira manter componentes, hooks e testes próximos do domínio (`features/` para regras e UI específicas; `shared/` para blocos reutilizáveis).
- Atualize `docs/etf_ranking.md` quando a metodologia mudar.

## Recursos adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Material UI](https://mui.com/)
- [Vitest](https://vitest.dev/)
