import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFinancialSummary } from "./financial-summary";

describe("buildFinancialSummary", () => {
	it("calcula saldo e taxa de poupança a partir de receita e despesa", () => {
		const summary = buildFinancialSummary("2026-03", 5000, 4000);

		assert.equal(summary.income, 5000);
		assert.equal(summary.expenses, 4000);
		assert.equal(summary.balance, 1000);
		assert.equal(summary.savingsRate, 20);
	});

	it("despesa maior que receita gera saldo e taxa negativos", () => {
		const summary = buildFinancialSummary("2026-03", 3000, 4200);

		assert.equal(summary.balance, -1200);
		assert.ok((summary.savingsRate ?? 0) < 0);
	});

	it("mês sem receita não calcula taxa de poupança (evita divisão por zero)", () => {
		const summary = buildFinancialSummary("2026-03", 0, 1500);

		assert.equal(summary.savingsRate, null);
		assert.equal(summary.balance, -1500);
	});

	it("mantém o rótulo de período recebido", () => {
		const summary = buildFinancialSummary("2026-01:2026-03", 1000, 800);

		assert.equal(summary.period, "2026-01:2026-03");
	});
});
