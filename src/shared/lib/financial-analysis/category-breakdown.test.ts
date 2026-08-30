import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCategoryBreakdown } from "./category-breakdown";

describe("buildCategoryBreakdown", () => {
	it("calcula percentual sobre o total e diferença contra a média histórica", () => {
		const result = buildCategoryBreakdown(
			[
				{
					categoryId: "alimentacao",
					categoryName: "Alimentação",
					amount: 1420,
				},
				{ categoryId: "lazer", categoryName: "Lazer", amount: 380 },
			],
			new Map([
				["alimentacao", 1100],
				["lazer", 380],
			]),
		);

		const alimentacao = result.find((r) => r.categoryId === "alimentacao");
		assert.ok(alimentacao);
		assert.equal(alimentacao.percentage, 78.9);
		assert.equal(alimentacao.historicalAverage, 1100);
		assert.equal(alimentacao.difference, 320);
	});

	it("ordena por valor gasto, do maior para o menor", () => {
		const result = buildCategoryBreakdown(
			[
				{ categoryId: "a", categoryName: "A", amount: 100 },
				{ categoryId: "b", categoryName: "B", amount: 500 },
				{ categoryId: "c", categoryName: "C", amount: 300 },
			],
			new Map(),
		);

		assert.deepEqual(
			result.map((r) => r.categoryId),
			["b", "c", "a"],
		);
	});

	it("categoria sem histórico anterior usa 0 como média (diferença = valor atual)", () => {
		const [result] = buildCategoryBreakdown(
			[{ categoryId: "nova", categoryName: "Nova", amount: 250 }],
			new Map(),
		);

		assert.ok(result);
		assert.equal(result.historicalAverage, 0);
		assert.equal(result.difference, 250);
	});

	it("sem despesas no período não gera divisão por zero", () => {
		const result = buildCategoryBreakdown([], new Map());

		assert.deepEqual(result, []);
	});
});
