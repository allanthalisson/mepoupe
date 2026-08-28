import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateDebtPayoff } from "./debt-payoff";

describe("estimateDebtPayoff", () => {
	it("calcula prazo sem juros", () => {
		const result = estimateDebtPayoff(1000, 0, 200);
		assert.deepEqual(result, {
			months: 5,
			totalInterest: 0,
			paymentCoversInterest: true,
		});
	});

	it("inclui juros no prazo e custo", () => {
		const result = estimateDebtPayoff(10000, 12, 1000);
		assert.equal(result.months, 11);
		assert.ok((result.totalInterest ?? 0) > 0);
		assert.equal(result.paymentCoversInterest, true);
	});

	it("avisa quando o pagamento não cobre os juros", () => {
		const result = estimateDebtPayoff(10000, 120, 100);
		assert.equal(result.months, null);
		assert.equal(result.paymentCoversInterest, false);
	});
});
