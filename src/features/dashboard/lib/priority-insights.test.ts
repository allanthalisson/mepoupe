import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SuggestedCategoryBudget } from "@/features/budgets/lib/suggested-budgets";
import type { CategoryExpenseBreakdown } from "@/shared/lib/financial-analysis/category-breakdown";
import { buildPriorityInsights } from "./priority-insights";

function breakdown(
	overrides: Partial<CategoryExpenseBreakdown>,
): CategoryExpenseBreakdown {
	return {
		categoryId: "cat",
		categoryName: "Categoria",
		amount: 100,
		percentage: 10,
		historicalAverage: 50,
		difference: 50,
		...overrides,
	};
}

function suggestion(
	overrides: Partial<SuggestedCategoryBudget>,
): SuggestedCategoryBudget {
	return {
		categoryId: "cat",
		categoryName: "Categoria",
		monthsOfHistory: 6,
		historicalMedian: 100,
		historicalAverage: 100,
		historicalMin: 80,
		historicalMax: 120,
		currentMonthSpent: null,
		trend: "stable",
		classification: "flexivel",
		suggestedBudget: 90,
		suggestedReductionPercent: 10,
		potentialMonthlySavings: 10,
		potentialAnnualSavings: 120,
		confidence: "high",
		reason: "",
		...overrides,
	};
}

describe("buildPriorityInsights", () => {
	it("prioriza os maiores desvios de gasto, na frente da economia potencial", () => {
		const insights = buildPriorityInsights(
			[
				breakdown({
					categoryId: "alimentacao",
					categoryName: "Alimentação",
					historicalAverage: 1000,
					difference: 260,
				}),
				breakdown({
					categoryId: "delivery",
					categoryName: "Delivery",
					historicalAverage: 200,
					difference: 64, // 32% de aumento
				}),
			],
			[],
		);

		assert.equal(insights.length, 2);
		assert.match(
			insights[0] ?? "",
			/Alimentação está R\$\s?260,00 acima do seu padrão/,
		);
		assert.match(insights[1] ?? "", /Delivery aumentou 32% em relação à média/);
	});

	it("sem desvios, usa a economia potencial das metas sugeridas", () => {
		const insights = buildPriorityInsights(
			[],
			[
				suggestion({
					categoryId: "lazer",
					categoryName: "Lazer",
					potentialMonthlySavings: 100,
				}),
				suggestion({
					categoryId: "compras",
					categoryName: "Compras",
					potentialMonthlySavings: 170,
				}),
			],
		);

		assert.equal(insights.length, 1);
		assert.match(insights[0] ?? "", /Reduzindo Compras e Lazer/);
		assert.match(insights[0] ?? "", /R\$\s?270,00/);
	});

	it("nunca devolve mais que 3 linhas, mesmo com muitas categorias", () => {
		const manyDeviations = Array.from({ length: 5 }, (_, i) =>
			breakdown({
				categoryId: `cat-${i}`,
				categoryName: `Categoria ${i}`,
				historicalAverage: 100,
				difference: 100 - i,
			}),
		);
		const manySavings = Array.from({ length: 5 }, (_, i) =>
			suggestion({
				categoryId: `sav-${i}`,
				categoryName: `Poupança ${i}`,
				potentialMonthlySavings: 50 - i,
			}),
		);

		const insights = buildPriorityInsights(manyDeviations, manySavings);

		assert.ok(insights.length <= 3);
	});

	it("categoria sem base histórica (ruído) não vira insight de desvio", () => {
		const insights = buildPriorityInsights(
			[
				breakdown({
					categoryId: "nova",
					categoryName: "Categoria Nova",
					historicalAverage: 0,
					difference: 500,
				}),
			],
			[],
		);

		assert.equal(insights.length, 0);
	});

	it("sem desvios e sem economia potencial não gera nenhum insight", () => {
		const insights = buildPriorityInsights([], []);

		assert.deepEqual(insights, []);
	});
});
