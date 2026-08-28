import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCoursePortfolioMap, getCourseHorizon } from "./course-method";

describe("getCourseHorizon", () => {
	it("aumenta renda fixa conforme o objetivo se aproxima", () => {
		assert.equal(getCourseHorizon(20).fixedIncomeTarget, 20);
		assert.equal(getCourseHorizon(10).fixedIncomeTarget, 30);
		assert.equal(getCourseHorizon(5).fixedIncomeTarget, 45);
		assert.equal(getCourseHorizon(2).fixedIncomeTarget, 60);
	});
});

describe("buildCoursePortfolioMap", () => {
	it("divide a renda variável em três partes e aplica a banda de 5 p.p.", () => {
		const result = buildCoursePortfolioMap(
			[
				{ name: "CDB", assetClass: "fixed_income", currentValue: 30_000 },
				{ name: "FII", assetClass: "reits", currentValue: 20_000 },
				{ name: "Ação", assetClass: "stocks", currentValue: 40_000 },
				{
					name: "ETF exterior",
					assetClass: "international",
					currentValue: 10_000,
				},
			],
			{
				name: "Liberdade financeira",
				targetDate: "2036-01-01T00:00:00.000Z",
				monthlyContribution: 1_000,
			},
			new Date("2026-01-01T00:00:00.000Z"),
		);

		assert.equal(result.status, "ready");
		assert.equal(result.fixedIncomeTarget, 30);
		assert.equal(result.classes[1]?.targetAllocation.toFixed(2), "23.33");
		assert.equal(result.classes[2]?.action, "reduce");
		assert.equal(result.classes[3]?.action, "reinforce");
		assert.equal(
			result.classes.reduce((total, item) => total + item.contribution, 0),
			1_000,
		);
	});

	it("sinaliza concentração e ativos fora das classes centrais", () => {
		const result = buildCoursePortfolioMap(
			[
				{ name: "Bitcoin", assetClass: "crypto", currentValue: 20_000 },
				{ name: "Ação única", assetClass: "stocks", currentValue: 80_000 },
			],
			{
				name: "Renda passiva",
				targetDate: "2046-01-01T00:00:00.000Z",
				monthlyContribution: 500,
			},
			new Date("2026-01-01T00:00:00.000Z"),
		);

		assert.ok(result.alerts.some((item) => item.includes("10%")));
		assert.ok(result.alerts.some((item) => item.includes("Criptoativos")));
		assert.ok(result.alerts.some((item) => item.includes("fora das quatro")));
	});

	it("pede uma meta com prazo quando não há objetivo", () => {
		const result = buildCoursePortfolioMap([], null);
		assert.equal(result.status, "needs_goal");
		assert.equal(result.classes.length, 0);
	});
});
