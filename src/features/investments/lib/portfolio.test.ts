import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPortfolioMetrics } from "./portfolio";

describe("buildPortfolioMetrics", () => {
	it("calcula patrimônio, rentabilidade e renda", () => {
		const result = buildPortfolioMetrics(
			[
				{
					assetClass: "fixed_income",
					quantity: 10,
					averagePrice: 100,
					currentPrice: 110,
					monthlyIncome: 8,
					targetAllocation: 60,
				},
				{
					assetClass: "stocks",
					quantity: 20,
					averagePrice: 40,
					currentPrice: 45,
					monthlyIncome: 12,
					targetAllocation: 40,
				},
			],
			100,
		);

		assert.equal(result.totalCurrentValue, 2000);
		assert.equal(result.totalCost, 1800);
		assert.equal(result.gain, 200);
		assert.equal(result.monthlyIncome, 20);
		assert.equal(result.annualIncome, 240);
		assert.equal(result.incomeProgress, 20);
		assert.equal(result.classes.length, 2);
	});

	it("identifica concentração e alvo incompleto", () => {
		const result = buildPortfolioMetrics([
			{
				assetClass: "crypto",
				quantity: 1,
				averagePrice: 100,
				currentPrice: 100,
				monthlyIncome: 0,
				targetAllocation: 50,
			},
		]);

		assert.equal(result.totalTargetAllocation, 50);
		assert.ok(result.recommendations.some((item) => item.includes("100%")));
		assert.ok(
			result.recommendations.some((item) => item.includes("concentra")),
		);
	});
});
