import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCsvTemplate, parseCsv } from "./csv-parser";

describe("parseCsv", () => {
	it("lê o modelo brasileiro separado por ponto e vírgula", () => {
		const result = parseCsv(generateCsvTemplate(), "nubank.csv");

		assert.equal(result.source, "nubank");
		assert.deepEqual(result.period, {
			from: "2026-03-01",
			to: "2026-03-02",
		});
		assert.equal(result.transactions.length, 2);
		assert.deepEqual(result.transactions[1], {
			externalId: null,
			externalIdOccurrence: 0,
			date: "2026-03-02",
			amount: 289.9,
			description: "Mercado, feira do mês",
			sourceDescription: "Mercado, feira do mês",
			transactionType: "expense",
			categoryRaw: "Alimentação",
		});
	});

	it("infere receita e despesa pelo sinal e respeita campos entre aspas", () => {
		const result = parseCsv(
			[
				"Date,Description,Amount,Transaction ID",
				'2026-03-05,"Loja, Centro","-1,234.56",abc-1',
				"2026-03-06,Pagamento,2500.00,abc-2",
			].join("\n"),
		);

		assert.equal(result.transactions[0]?.amount, 1234.56);
		assert.equal(result.transactions[0]?.transactionType, "expense");
		assert.equal(result.transactions[0]?.externalId, "abc-1");
		assert.equal(result.transactions[1]?.transactionType, "income");
	});

	it("aceita colunas separadas de débito e crédito", () => {
		const result = parseCsv(
			[
				"Data\tHistórico\tDébito\tCrédito",
				"07/03/2026\tEnergia\tR$ 180,40\t",
				"08/03/2026\tReembolso\t\tR$ 50,00",
			].join("\r\n"),
		);

		assert.deepEqual(
			result.transactions.map(({ amount, transactionType }) => ({
				amount,
				transactionType,
			})),
			[
				{ amount: 180.4, transactionType: "expense" },
				{ amount: 50, transactionType: "income" },
			],
		);
	});

	it("explica quais colunas obrigatórias estão ausentes", () => {
		assert.throws(() => parseCsv("Nome;Preço\nProduto;10"), /Data.*Descrição/);
	});

	it("lê a fatura do Nubank exportada em inglês (date,title,amount)", () => {
		const result = parseCsv(
			[
				"date,title,amount",
				"2026-03-10,Uber,32.50",
				"2026-03-11,Salário,-1500",
			].join("\n"),
		);

		assert.equal(result.transactions.length, 2);
		assert.equal(result.transactions[0]?.description, "Uber");
		assert.equal(result.transactions[0]?.amount, 32.5);
		assert.equal(result.transactions[0]?.transactionType, "expense");
	});

	it("cai para o mapeamento posicional (data, descrição, valor) quando o cabeçalho não é reconhecido", () => {
		const result = parseCsv(
			["Quando;O que;Quanto", "10/03/2026;Uber;32,50"].join("\n"),
		);

		assert.equal(result.transactions.length, 1);
		assert.equal(result.transactions[0]?.description, "Uber");
		assert.equal(result.transactions[0]?.amount, 32.5);
	});
});
