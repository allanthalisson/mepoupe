import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFinancialDiagnosis } from "./diagnostics";

describe("buildFinancialDiagnosis", () => {
	it("calcula fluxo, taxa de poupança e compromissos", () => {
		const result = buildFinancialDiagnosis(
			[
				{
					name: "Salário",
					period: "2026-01",
					amount: 5000,
					transactionType: "Receita",
					condition: "À vista",
					categoryName: "Salário",
				},
				{
					name: "Aluguel",
					period: "2026-01",
					amount: -1500,
					transactionType: "Despesa",
					condition: "Recorrente",
					categoryName: "Moradia",
				},
			],
			["2026-01"],
		);

		assert.equal(result.averageIncome, 5000);
		assert.equal(result.averageExpenses, 1500);
		assert.equal(result.averageSavingsRate, 70);
		assert.equal(result.monthlyCommitments, 1500);
		assert.equal(result.status, "healthy");
	});

	it("sinaliza aumento relevante de um estabelecimento", () => {
		const transactions = ["2026-01", "2026-02", "2026-03"].map(
			(period, index) => ({
				name: "Delivery",
				period,
				amount: index === 2 ? -450 : -100,
				transactionType: "Despesa",
				condition: "À vista",
				categoryName: "Alimentação",
			}),
		);
		const result = buildFinancialDiagnosis(transactions, [
			"2026-01",
			"2026-02",
			"2026-03",
		]);

		assert.equal(result.reviewOpportunities[0]?.name, "Delivery");
		assert.equal(result.reviewOpportunities[0]?.reason, "increase");
		assert.equal(result.reviewOpportunities[0]?.increasePercentage, 350);
	});

	it("classifica fluxo negativo como crítico", () => {
		const result = buildFinancialDiagnosis(
			[
				{
					name: "Salário",
					period: "2026-01",
					amount: 2000,
					transactionType: "Receita",
					condition: "À vista",
					categoryName: null,
				},
				{
					name: "Despesas",
					period: "2026-01",
					amount: -2500,
					transactionType: "Despesa",
					condition: "À vista",
					categoryName: null,
				},
			],
			["2026-01"],
		);

		assert.equal(result.status, "critical");
		assert.ok(result.suggestions[0]?.includes("superam"));
	});
});
