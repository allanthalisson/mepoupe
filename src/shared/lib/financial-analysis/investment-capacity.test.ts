import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInvestmentCapacity } from "./investment-capacity";

describe("buildInvestmentCapacity", () => {
	it("calcula a capacidade descontando essenciais, recorrentes, provisão e margem", () => {
		const result = buildInvestmentCapacity(6000, [
			{ classification: "essencial", historicalAverage: 2000 },
			{ classification: "recorrente", historicalAverage: 500 },
			{ classification: "flexivel", historicalAverage: 800 },
			{ classification: "discricionaria", historicalAverage: 400 },
		]);

		// margem = 6000*0.05 = 300; provisão = (800+400)*0.7 = 840
		// capacidade = 6000 - 2000 - 500 - 840 - 300 = 2360
		assert.equal(result.components.essentialExpenses, 2000);
		assert.equal(result.components.recurringCommitments, 500);
		assert.equal(result.components.variableExpenseProvision, 840);
		assert.equal(result.components.safetyMargin, 300);
		assert.equal(result.conservativeCapacity, 2360);
	});

	it("sem categorias, a capacidade é a renda menos só a margem de segurança", () => {
		const result = buildInvestmentCapacity(3000, []);

		assert.equal(result.components.essentialExpenses, 0);
		assert.equal(result.conservativeCapacity, 2850);
	});

	it("mês sem receita não gera capacidade negativa nem margem negativa", () => {
		const result = buildInvestmentCapacity(0, [
			{ classification: "essencial", historicalAverage: 500 },
		]);

		assert.equal(result.components.averageIncome, 0);
		assert.equal(result.components.safetyMargin, 0);
		assert.equal(result.conservativeCapacity, 0);
	});

	it("despesas somadas maiores que a receita: capacidade nunca fica negativa", () => {
		const result = buildInvestmentCapacity(2000, [
			{ classification: "essencial", historicalAverage: 1800 },
			{ classification: "recorrente", historicalAverage: 900 },
		]);

		assert.equal(result.conservativeCapacity, 0);
	});

	it("renda negativa é tratada como zero (não deveria acontecer, mas não deve quebrar)", () => {
		const result = buildInvestmentCapacity(-500, []);

		assert.equal(result.components.averageIncome, 0);
		assert.equal(result.conservativeCapacity, 0);
	});
});
