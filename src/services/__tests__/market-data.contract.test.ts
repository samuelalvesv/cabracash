import { describe, expect, it } from "vitest";

import { DETAIL_SECTIONS } from "@/features/ranking/server/detailSections";
import {
  DATA_POINTS_IDS,
  fetchMarketData,
  MARKET_DATA_FIELDS,
} from "@/services/market-data";

describe("Integração de Contrato com a API de Mercado (Live)", () => {
  it(
    "conecta com sucesso aos endpoints e valida 100% dos 110 campos do contrato da API",
    { timeout: 25000 },
    async () => {
      const mergedResponse = await fetchMarketData();
      expect(mergedResponse.status).toBe(200);

      const allEtfs = mergedResponse.data?.data ?? {};
      const tickersCount = Object.keys(allEtfs).length;
      expect(
        tickersCount,
        "A API combinada deve retornar pelo menos 1.000 ETFs cadastrados",
      ).toBeGreaterThan(1000);

      const expectedKeys = [...MARKET_DATA_FIELDS].sort();
      const benchmarkSymbols = ["SPY", "VOO", "SCHD"];

      for (const symbol of benchmarkSymbols) {
        const etf = allEtfs[symbol];
        expect(
          etf,
          `O ETF de referência ${symbol} deve existir nos dados retornados pela API`,
        ).toBeDefined();

        expect(typeof etf.name).toBe("string");
        expect(typeof etf.price).toBe("number");
        expect(etf.price).toBeGreaterThan(0);

        const actualKeys = Object.keys(etf).sort();
        expect(
          actualKeys,
          `O contrato de campos do ETF ${symbol} deve conter exatamente os ${MARKET_DATA_FIELDS.length} campos mapeados`,
        ).toEqual(expectedKeys);
      }

      const criticalFields: Array<(typeof DATA_POINTS_IDS)[number]> = [
        "peRatio",
        "dividendYield",
        "expenseRatio",
        "beta",
        "rsi",
        "sharpeRatio",
        "sortinoRatio",
      ];

      for (const field of criticalFields) {
        const hasPopulatedValue = benchmarkSymbols.some((sym) => {
          const val = allEtfs[sym]?.[field];
          return val !== null && val !== undefined && typeof val === "number";
        });

        expect(
          hasPopulatedValue,
          `O contrato divergiu: o campo crítico '${field}' veio nulo ou ausente em todos os ETFs de referência`,
        ).toBe(true);
      }

      const detailSectionKeys = new Set(
        DETAIL_SECTIONS.flatMap((section) => section.items.map((item) => item.key)),
      );
      for (const field of MARKET_DATA_FIELDS) {
        expect(
          detailSectionKeys.has(field),
          `O campo '${field}' da API deve estar mapeado em DETAIL_SECTIONS`,
        ).toBe(true);
      }
    },
  );
});

