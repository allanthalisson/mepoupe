import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCoursePortfolioMap } from "./course-method";
import type { FundamentalSnapshot } from "./fundamental-screening";
import { screenFundamentals } from "./fundamental-screening";
import {
	buildInvestmentSuggestions,
	type SuggestionCandidate,
} from "./suggestions";

const GOOD_STOCK: FundamentalSnapshot = {
	priceToEarnings: 8,
	priceToBook: null,
	enterpriseToEbit: 6,
	dividendYield: null,
	returnOnEquity: 0.18,
	currentRatio: 1.5,
	debtToEquity: 40,
	revenueGrowth: 0.08,
	profitMargin: 0.12,
	vacancyRate: null,
	propertyCount: null,
	dailyLiquidity: null,
};

// Cobertura abaixo de 50% -> status "insufficient", o único caso que o
// motor de sugestões exclui de fato (candidato fraco mas com dado
// suficiente ainda entra, só fica ranqueado por último).
const INSUFFICIENT_STOCK: FundamentalSnapshot = {
	priceToEarnings: null,
	priceToBook: null,
	enterpriseToEbit: null,
	dividendYield: null,
	returnOnEquity: null,
	currentRatio: null,
	debtToEquity: null,
	revenueGrowth: 0.08,
	profitMargin: 0.12,
	vacancyRate: null,
	propertyCount: null,
	dailyLiquidity: null,
};

function candidate(
	ticker: string,
	name: string,
	assetClass: "stocks" | "reits",
	snapshot: FundamentalSnapshot,
): SuggestionCandidate {
	return {
		ticker,
		name,
		assetClass,
		currentPrice: 25,
		hasError: false,
		screening: screenFundamentals(assetClass, snapshot),
	};
}

function readyCourseMap() {
	return buildCoursePortfolioMap(
		[
			{ name: "CDB", assetClass: "fixed_income", currentValue: 30_000 },
			{ name: "Ação existente", assetClass: "stocks", currentValue: 5_000 },
		],
		{
			name: "Liberdade financeira",
			targetDate: "2036-01-01T00:00:00.000Z",
			monthlyContribution: 1_000,
		},
		new Date("2026-01-01T00:00:00.000Z"),
	);
}

describe("buildInvestmentSuggestions", () => {
	it("sugere candidatos aprovados da classe que precisa de reforço", () => {
		const courseMap = readyCourseMap();
		const stocksNeedReinforce = courseMap.classes.find(
			(c) => c.assetClass === "stocks",
		);
		assert.equal(stocksNeedReinforce?.action, "reinforce");

		const candidates = [
			candidate("ITSA4", "Itaúsa", "stocks", GOOD_STOCK),
			candidate("WEGE3", "WEG", "stocks", GOOD_STOCK),
			candidate("XYZW4", "Dado insuficiente SA", "stocks", INSUFFICIENT_STOCK),
		];

		const suggestions = buildInvestmentSuggestions(
			courseMap,
			candidates,
			new Set(),
			new Map(),
			new Set(),
		);

		const tickers = suggestions.map((s) => s.ticker);
		assert.ok(tickers.includes("ITSA4"));
		assert.ok(tickers.includes("WEGE3"));
		assert.ok(
			!tickers.includes("XYZW4"),
			"candidato com dado insuficiente não deveria ser sugerido",
		);
	});

	it("divide o aporte da classe igualmente entre os sugeridos", () => {
		const courseMap = readyCourseMap();
		const candidates = [
			candidate("ITSA4", "Itaúsa", "stocks", GOOD_STOCK),
			candidate("WEGE3", "WEG", "stocks", GOOD_STOCK),
		];

		const suggestions = buildInvestmentSuggestions(
			courseMap,
			candidates,
			new Set(),
			new Map(),
			new Set(),
		);

		const stocksClass = courseMap.classes.find(
			(c) => c.assetClass === "stocks",
		);
		const total = suggestions.reduce(
			(sum, s) => sum + s.suggestedContribution,
			0,
		);
		// Arredondamento por ticker pode perder/ganhar centavos em relação ao
		// valor exato dividido — o que importa é ficar bem próximo do aporte
		// da classe, não bater centavo a centavo.
		assert.ok(Math.abs(total - (stocksClass?.contribution ?? 0)) < 0.05);
	});

	it("não sugere candidato dispensado nem acima do teto de concentração", () => {
		const courseMap = readyCourseMap();
		const candidates = [
			candidate("ITSA4", "Itaúsa", "stocks", GOOD_STOCK),
			candidate("WEGE3", "WEG", "stocks", GOOD_STOCK),
		];

		const suggestions = buildInvestmentSuggestions(
			courseMap,
			candidates,
			new Set(),
			new Map([["WEGE3", 15]]), // acima do teto de 10%
			new Set(["ITSA4"]), // dispensado
		);

		assert.equal(suggestions.length, 0);
	});

	it("não sugere nada sem meta com prazo definido", () => {
		const courseMap = buildCoursePortfolioMap([], null);
		const suggestions = buildInvestmentSuggestions(
			courseMap,
			[candidate("ITSA4", "Itaúsa", "stocks", GOOD_STOCK)],
			new Set(),
			new Map(),
			new Set(),
		);
		assert.equal(suggestions.length, 0);
	});
});
