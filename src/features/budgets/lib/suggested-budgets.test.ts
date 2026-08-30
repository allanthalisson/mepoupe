import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildSuggestedCategoryBudgets,
	type CategoryBudgetInput,
} from "./suggested-budgets";

function history(
	amounts: number[],
	startPeriod = "2026-01",
): {
	period: string;
	amount: number;
}[] {
	const [startYear, startMonth] = startPeriod.split("-").map(Number);
	return amounts.map((amount, index) => {
		const date = new Date(startYear, startMonth - 1 + index, 1);
		const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		return { period, amount };
	});
}

describe("buildSuggestedCategoryBudgets", () => {
	it("usa a mediana, não a média, como baseline (resiste a outlier)", () => {
		const input: CategoryBudgetInput = {
			categoryId: "alimentacao",
			categoryName: "Alimentação",
			// 5 meses normais de ~200 + 1 viagem de 2000
			history: history([200, 210, 190, 205, 195, 2000]),
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		// mediana de [190,195,200,205,210,2000] = (200+205)/2 = 202.5
		assert.equal(result.historicalMedian, 202.5);
		assert.ok(result.historicalAverage > result.historicalMedian);
	});

	it("classifica confiança conforme meses de histórico (1 baixo, 2-3 médio, 4-6 alto)", () => {
		const [oneMonth] = buildSuggestedCategoryBudgets([
			{
				categoryId: "a",
				categoryName: "A",
				history: history([100]),
			},
		]);
		const [threeMonths] = buildSuggestedCategoryBudgets([
			{
				categoryId: "b",
				categoryName: "B",
				history: history([100, 110, 105]),
			},
		]);
		const [sixMonths] = buildSuggestedCategoryBudgets([
			{
				categoryId: "c",
				categoryName: "C",
				history: history([100, 110, 105, 95, 102, 98]),
			},
		]);

		assert.equal(oneMonth?.confidence, "low");
		assert.equal(threeMonths?.confidence, "medium");
		assert.equal(sixMonths?.confidence, "high");
	});

	it("não sugere corte para categoria estável ou já abaixo do padrão", () => {
		const input: CategoryBudgetInput = {
			categoryId: "agua",
			categoryName: "Água",
			history: history([100, 102, 98, 101, 99, 100]),
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.equal(result.suggestedReductionPercent, 0);
		assert.equal(result.suggestedBudget, result.historicalMedian);
		assert.equal(result.potentialMonthlySavings, 0);
		assert.match(result.reason, /estável|padrão histórico, sem corte/);
	});

	it("sugere redução maior quando o gasto recente está claramente acima do padrão", () => {
		// gasto instável (discricionária) e último mês bem acima da mediana
		const input: CategoryBudgetInput = {
			categoryId: "lazer",
			categoryName: "Lazer",
			history: history([300, 500, 250, 600, 280, 900]),
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.ok(result.suggestedReductionPercent > 0);
		assert.ok(result.potentialMonthlySavings > 0);
		assert.equal(
			result.potentialAnnualSavings,
			Math.round(result.potentialMonthlySavings * 12 * 100) / 100,
		);
	});

	it("classifica categoria dominada por gasto recorrente e não sugere corte", () => {
		const input: CategoryBudgetInput = {
			categoryId: "assinaturas",
			categoryName: "Assinaturas",
			history: [
				{ period: "2026-01", amount: 150, recurringAmount: 150 },
				{ period: "2026-02", amount: 150, recurringAmount: 150 },
				{ period: "2026-03", amount: 180, recurringAmount: 150 },
				{ period: "2026-04", amount: 150, recurringAmount: 150 },
			],
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.equal(result.classification, "recorrente");
		assert.equal(result.suggestedReductionPercent, 0);
	});

	it("respeita o teto de redução máxima de 20%", () => {
		const input: CategoryBudgetInput = {
			categoryId: "compras",
			categoryName: "Compras",
			history: history([100, 400, 90, 500, 80, 3000]),
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.ok(result.suggestedReductionPercent <= 20);
	});

	it("categoria recém-criada (poucos meses) ainda recebe uma sugestão, com confiança baixa", () => {
		const input: CategoryBudgetInput = {
			categoryId: "nova",
			categoryName: "Categoria Nova",
			history: history([250]),
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.equal(result.monthsOfHistory, 1);
		assert.equal(result.confidence, "low");
		assert.equal(result.historicalMedian, 250);
	});

	it("categoria sem histórico não gera sugestão", () => {
		const input: CategoryBudgetInput = {
			categoryId: "vazia",
			categoryName: "Sem Histórico",
			history: [],
		};

		const results = buildSuggestedCategoryBudgets([input]);

		assert.equal(results.length, 0);
	});

	it("categoria sem gastos no mês atual ainda usa o histórico normalmente", () => {
		const input: CategoryBudgetInput = {
			categoryId: "viagem",
			categoryName: "Viagem",
			history: history([100, 120, 110, 90, 105, 95]),
			currentMonthSpent: 0,
		};

		const [result] = buildSuggestedCategoryBudgets([input]);

		assert.ok(result);
		assert.equal(result.currentMonthSpent, 0);
	});

	it("destaca as categorias com maior potencial de economia entre várias", () => {
		const inputs: CategoryBudgetInput[] = [
			{
				categoryId: "estavel",
				categoryName: "Estável",
				history: history([100, 100, 100, 100]),
			},
			{
				categoryId: "alto-potencial",
				categoryName: "Alto Potencial",
				history: history([300, 900, 280, 950, 260, 1000]),
			},
		];

		const results = buildSuggestedCategoryBudgets(inputs);
		const highPotential = results.find(
			(r) => r.categoryId === "alto-potencial",
		);

		assert.ok(highPotential);
		assert.match(highPotential.reason, /maior potencial de economia/);
	});
});
