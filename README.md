# CabraCash

CabraCash é uma plataforma analítica em Next.js que calcula e exibe um ranking objetivo de ETFs negociados no mercado americano. A avaliação combina indicadores de Fundamentos (55%) e Oportunidade (45%), consolidando mais de 5.700 fundos em uma interface comparável e interativa.

## Stack Tecnológica

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router com Turbopack)
- **UI & Estilização**: [Material UI 9](https://mui.com/) com `@emotion/styled` e `@mui/material-nextjs`
- **Linguagem**: [TypeScript 5.9](https://www.typescriptlang.org/) (target `ES2024`)
- **Testes**: [Vitest 5](https://vitest.dev/) com [Testing Library](https://testing-library.com/)
- **Linter**: [ESLint 9](https://eslint.org/) (Flat Config nativo)
- **Runtime**: Node.js 26
- **CI/CD**: GitHub Actions

## Instalação e Execução

Instale as dependências com:

```bash
npm install
```

Comandos disponíveis:

```bash
npm run dev     # Servidor de desenvolvimento com Turbopack
npm run build   # Build de produção otimizado com Turbopack
npm run start   # Inicia o servidor em modo de produção
npm run lint    # Verificação estática com ESLint 9
npm run test    # Suíte de testes com Vitest
```

## Estrutura do Projeto

```
src/
├── app/                   # Rotas da aplicação (App Router)
│   ├── about/             # Apresentação do projeto e tese de investimento
│   ├── api/               # Endpoints REST (/api/market e /api/market/ranking)
│   ├── etf/[symbol]/      # Página detalhada do ETF
│   ├── layout.tsx         # Shell global (ThemeRegistry, Header e Footer)
│   └── page.tsx           # Página inicial com o ranking completo
├── features/
│   └── ranking/
│       ├── components/    # Componentes de interface do ranking e hooks de estado
│       └── server/        # Domínio: cálculo de scores, definições de métricas e cache
├── components/ui/         # Componentes compartilhados de interface (Header, Footer)
├── services/              # Integração e validação de contrato com a API de mercado
├── shared/                # Utilitários de formatação e hooks de tema
└── theme/                 # Definições de tema Material UI e suporte a claro/escuro
```

## Arquitetura e Fluxo de Dados

1. **Coleta de Mercado**: `src/services/market-data.ts` realiza o consumo paralelo dos endpoints `initial` e `data-points`, unificando os 110 atributos do contrato da API (7 cadastrais base e 103 métricas quantitativas). Falhas de conectividade ou payloads inválidos acionam `MarketDataConnectionError` de forma imediata (Fail-First).
2. **Scoring e Cache**: `src/features/ranking/server/scoring.ts` normaliza as métricas (winsorização entre percentis 2% e 98%, conversão min-max para escala 0–100) e calcula os scores ponderados de Fundamentos e Oportunidade. O resultado é armazenado em memória por 15 minutos em `src/features/ranking/server/cache.ts`.
3. **Navegação e Estado**: A listagem principal sincroniza filtros (busca por texto, score mínimo de fundamentos e de oportunidade) e paginação diretamente na URL (`searchParams`), mantendo compatibilidade com navegação no histórico e compartilhamento de links.

## Páginas

- **Ranking (`/`)**: Exibe os ETFs ranqueados em modo de visualização por **Cards** (painel analítico com barras de progresso e métricas resumidas) ou **Tabela DataGrid** (todas as colunas customizáveis, ordenação e exportação/cópia de dados tabulares).
- **Detalhes (`/etf/[symbol]`)**: Visão aprofundada de um ETF selecionado, com detalhamento dos componentes de score, métricas brutas organizadas por categoria (identificação, liquidez, volatilidade, dividendos, retornos) e navegação de retorno preservando filtros ativos.
- **Sobre (`/about`)**: Explicação conceitual da metodologia de pontuação e das vantagens da diversificação internacional via ETFs.

## Testes

A suíte de testes com Vitest valida a aplicação em múltiplas camadas:

- **Contrato ao Vivo** (`src/services/__tests__/market-data.contract.test.ts`): Conecta à API real de mercado e valida a integridade dos 110 campos contratados e o mapeamento das seções de detalhes.
- **Serviço de Mercado** (`src/services/__tests__/market-data.test.ts`): Testa casos de sucesso, falhas de rede e rejeição imediata de payloads vazios.
- **Algoritmo de Ranking** (`src/features/ranking/server/__tests__/scoring.test.ts`): Verifica a ordenação por score final, tratamento de dados ausentes e critérios de desempate alfabético.
- **Cache In-Memory** (`src/features/ranking/server/__tests__/cache.test.ts` e `fetchRankedEtfs.test.ts`): Testa TTL de 15 minutos e deduplicação de requisições concorrentes.
- **Interface e Componentes** (`src/features/ranking/components/__tests__` e `src/components/ui/__tests__`): Valida renderização, filtros, paginação e persistência de tema.
