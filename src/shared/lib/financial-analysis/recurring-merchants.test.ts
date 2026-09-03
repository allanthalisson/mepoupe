import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRecurringMerchantsSummary } from "./recurring-merchants";

describe("buildRecurringMerchantsSummary", () => {
	it("separa assinaturas (condição Recorrente) de estabelecimentos recorrentes", () => {
		const summary = buildRecurringMerchantsSummary([
			{ name: "Spotify", amount: 21.9, condition: "Recorrente" },
			{ name: "Spotify", amount: 21.9, condition: "Recorrente" },
			{ name: "Uber", amount: 30, condition: "À vista" },
			{ name: "Uber", amount: 32, condition: "À vista" },
			{ name: "Uber", amount: 28, condition: "À vista" },
		]);

		assert.equal(summary.subscriptions.length, 1);
		assert.equal(summary.subscriptions[0]?.displayName, "Spotify");
		assert.equal(summary.recurringMerchants.length, 1);
		assert.equal(summary.recurringMerchants[0]?.displayName, "Uber");
		assert.equal(summary.recurringMerchants[0]?.occurrences, 3);
	});

	it("agrupa variações do mesmo nome (ex.: sufixos de transação) na mesma chave", () => {
		const summary = buildRecurringMerchantsSummary([
			{ name: "UBER *TRIP 384920", amount: 25, condition: "À vista" },
			{ name: "UBER *TRIP 573921", amount: 27, condition: "À vista" },
		]);

		assert.equal(summary.recurringMerchants.length, 1);
		assert.equal(summary.recurringMerchants[0]?.occurrences, 2);
		assert.equal(summary.recurringMerchants[0]?.totalAmount, 52);
	});

	it("estabelecimento com uma única ocorrência não entra na lista", () => {
		const summary = buildRecurringMerchantsSummary([
			{ name: "Loja Única", amount: 100, condition: "À vista" },
		]);

		assert.deepEqual(summary.subscriptions, []);
		assert.deepEqual(summary.recurringMerchants, []);
	});

	it("marca 'revisar' quando o gasto acumulado pesa no total, senão 'ok'", () => {
		const rows = [
			{ name: "Grande", amount: 500, condition: "À vista" },
			{ name: "Grande", amount: 500, condition: "À vista" },
			{ name: "Pequeno", amount: 5, condition: "À vista" },
			{ name: "Pequeno", amount: 5, condition: "À vista" },
			// preenche o total pra "Pequeno" ficar com share bem baixo
			{ name: "Outros Gastos", amount: 9000, condition: "À vista" },
		];
		const summary = buildRecurringMerchantsSummary(rows);

		const grande = summary.recurringMerchants.find(
			(m) => m.displayName === "Grande",
		);
		const pequeno = summary.recurringMerchants.find(
			(m) => m.displayName === "Pequeno",
		);
		assert.equal(grande?.suggestion, "revisar");
		assert.equal(pequeno?.suggestion, "ok");
	});

	it("sem nenhum lançamento não gera nenhum grupo", () => {
		const summary = buildRecurringMerchantsSummary([]);
		assert.deepEqual(summary, { subscriptions: [], recurringMerchants: [] });
	});
});
