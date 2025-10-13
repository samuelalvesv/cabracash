This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. A página já usa [MUI](https://mui.com/) com um `ThemeProvider` configurado em `app/layout.tsx` e exibe o ranking paginado calculado no backend.

## APIs internas

- `GET /api/market`: proxy para o endpoint da StockAnalysis que retorna o payload completo de ETFs no formato:
  ```json
  {
    "status": 200,
    "data": {
      "data": {
        "AOK": { "...": "..." },
        "SPY": { "...": "..." }
      }
    }
  }
  ```
- `GET /api/market/ranking`: processa os dados brutos, aplica a metodologia descrita em `etf_ranking.md` (winsorização 2–98%, normalização 0–100, pesos de Fundamentos e Oportunidade) e devolve a lista ordenada por `FinalScore`.

## Scripts úteis

```bash
npm run dev    # servidor Next.js (Turbopack)
npm run lint   # ESLint
npm run test   # Vitest (pipeline de ranking)
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
