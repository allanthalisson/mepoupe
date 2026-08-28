import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonthlyAllocationPlan } from "./allocation-plan";

describe("buildMonthlyAllocationPlan", () => {
	it("prioriza mínimos, dívida cara, reserva e investimentos", () => {
		const result = buildMonthlyAllocationPlan({
			monthlyCapacity: 1000,
			debts: [
				{
					id: "debt",
					name: "Cartão",
					currentBalance: 5000,
					annualInterestRate: 200,
					minimumPayment: 200,
					plannedPayment: 500,
					status: "active",
				},
			],
			goals: [
				{
					id: "investment",
					name: "Renda passiva",
					goalType: "investment",
					monthlyContribution: 300,
					priority: 1,
					status: "active",
				},
				{
					id: "reserve",
					name: "Reserva",
					goalType: "emergency_reserve",
					monthlyContribution: 300,
					priority: 2,
					status: "active",
				},
			],
		});

		assert.deepEqual(
			result.items.map((item) => item.kind),
			["debt-minimum", "debt-extra", "emergency", "investment"],
		);
		assert.equal(result.allocated, 1000);
		assert.equal(result.totalShortfall, 100);
		assert.equal(result.items.at(-1)?.funded, 200);
	});

	it("rateia mínimos quando a sobra não é suficiente", () => {
		const result = buildMonthlyAllocationPlan({
			monthlyCapacity: 150,
			debts: [
				{
					id: "a",
					name: "A",
					currentBalance: 1000,
					annualInterestRate: 10,
					minimumPayment: 100,
					plannedPayment: 100,
					status: "active",
				},
				{
					id: "b",
					name: "B",
					currentBalance: 1000,
					annualInterestRate: 20,
					minimumPayment: 200,
					plannedPayment: 200,
					status: "active",
				},
			],
			goals: [],
		});

		assert.deepEqual(
			result.items.map((item) => item.funded),
			[100, 50],
		);
		assert.equal(result.totalShortfall, 150);
	});
});
