import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGoalPlan } from "./goal-plan";

describe("buildGoalPlan", () => {
	it("calcula a diferença e sugere cortes até cobrir o gap", () => {
		const plan = buildGoalPlan(
			{
				name: "Viagem",
				targetAmount: 30000,
				currentAmount: 0,
				monthsRemaining: 12,
			},
			1950,
			[
				{
					categoryId: "alimentacao",
					categoryName: "Alimentação",
					potentialMonthlySavings: 180,
				},
				{
					categoryId: "lazer",
					categoryName: "Lazer",
					potentialMonthlySavings: 140,
				},
				{
					categoryId: "compras",
					categoryName: "Compras",
					potentialMonthlySavings: 160,
				},
				{
					categoryId: "assinaturas",
					categoryName: "Assinaturas",
					potentialMonthlySavings: 70,
				},
			],
		);

		assert.equal(plan.requiredMonthlyContribution, 2500);
		assert.equal(plan.gap, 550);
		assert.equal(plan.totalSuggestedCuts, 550);
		assert.equal(plan.suggestedCuts.length, 4);
		assert.equal(plan.isAchievable, true);
	});

	it("capacidade atual já cobre a meta: nenhum corte sugerido", () => {
		const plan = buildGoalPlan(
			{
				name: "Reserva",
				targetAmount: 12000,
				currentAmount: 0,
				monthsRemaining: 12,
			},
			1500,
			[
				{
					categoryId: "lazer",
					categoryName: "Lazer",
					potentialMonthlySavings: 100,
				},
			],
		);

		assert.equal(plan.requiredMonthlyContribution, 1000);
		assert.equal(plan.gap, 0);
		assert.deepEqual(plan.suggestedCuts, []);
		assert.equal(plan.isAchievable, true);
	});

	it("meta sem data-alvo não gera valor mensal necessário nem gap", () => {
		const plan = buildGoalPlan(
			{
				name: "Sem prazo",
				targetAmount: 5000,
				currentAmount: 1000,
				monthsRemaining: null,
			},
			500,
			[],
		);

		assert.equal(plan.requiredMonthlyContribution, null);
		assert.equal(plan.gap, 0);
		assert.equal(plan.isAchievable, true);
	});

	it("meta já atingida: valor restante e necessário ficam em zero", () => {
		const plan = buildGoalPlan(
			{
				name: "Concluída",
				targetAmount: 10000,
				currentAmount: 10000,
				monthsRemaining: 6,
			},
			200,
			[],
		);

		assert.equal(plan.remainingAmount, 0);
		assert.equal(plan.requiredMonthlyContribution, 0);
		assert.equal(plan.gap, 0);
		assert.equal(plan.isAchievable, true);
	});

	it("quando os cortes disponíveis não cobrem o gap, isAchievable fica false", () => {
		const plan = buildGoalPlan(
			{
				name: "Meta apertada",
				targetAmount: 24000,
				currentAmount: 0,
				monthsRemaining: 12,
			},
			500,
			[
				{
					categoryId: "lazer",
					categoryName: "Lazer",
					potentialMonthlySavings: 100,
				},
			],
		);

		// necessário: 2000/mês, capacidade 500, gap 1500, cortes só cobrem 100
		assert.equal(plan.gap, 1500);
		assert.equal(plan.totalSuggestedCuts, 100);
		assert.equal(plan.isAchievable, false);
	});
});
