import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMerchantSpendingSummary } from "./merchant-spending";

describe("buildMerchantSpendingSummary", () => {
	it("soma o total, conta ocorrências e calcula o ticket médio", () => {
		const result = buildMerchantSpendingSummary("uber", [
			{ period: "2026-01", amount: 32 },
			{ period: "2026-01", amount: 28 },
			{ period: "2026-02", amount: 40 },
		]);

		assert.equal(result.totalAmount, 100);
		assert.equal(result.occurrences, 3);
		assert.equal(result.averageTicket, 33.33);
	});

	it("agrupa por período em ordem crescente", () => {
		const result = buildMerchantSpendingSummary("ifood", [
			{ period: "2026-03", amount: 50 },
			{ period: "2026-01", amount: 20 },
			{ period: "2026-02", amount: 30 },
		]);

		assert.deepEqual(
			result.byPeriod.map((entry) => entry.period),
			["2026-01", "2026-02", "2026-03"],
		);
	});

	it("sem nenhuma ocorrência devolve zeros, sem dividir por zero", () => {
		const result = buildMerchantSpendingSummary(
			"estabelecimento inexistente",
			[],
		);

		assert.equal(result.totalAmount, 0);
		assert.equal(result.occurrences, 0);
		assert.equal(result.averageTicket, 0);
		assert.deepEqual(result.byPeriod, []);
	});
});
