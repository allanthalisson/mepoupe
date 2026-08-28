import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { screenFundamentals } from "./fundamental-screening";

const base = {
	priceToEarnings: 10,
	priceToBook: 0.95,
	enterpriseToEbit: 8,
	dividendYield: 0.09,
	returnOnEquity: 0.18,
	currentRatio: 1.5,
	debtToEquity: 40,
	revenueGrowth: 0.08,
	profitMargin: 0.12,
	vacancyRate: 0.05,
	propertyCount: 15,
	dailyLiquidity: 500_000,
};

describe("screenFundamentals", () => {
	it("aplica os filtros das aulas às ações", () => {
		const result = screenFundamentals("stocks", base);
		assert.equal(result?.status, "approved");
		assert.equal(result?.passed, 7);
	});

	it("aplica os filtros das aulas aos FIIs", () => {
		const result = screenFundamentals("reits", base);
		assert.equal(result?.status, "approved");
		assert.equal(result?.passed, 5);
	});

	it("não transforma falta de dados em aprovação", () => {
		const result = screenFundamentals("stocks", {
			...base,
			priceToEarnings: null,
			enterpriseToEbit: null,
			returnOnEquity: null,
			currentRatio: null,
			debtToEquity: null,
		});
		assert.equal(result?.status, "insufficient");
	});
});
