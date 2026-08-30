/**
 * "O que preciso mudar para atingir essa meta?" — liga a meta financeira
 * ativa à capacidade de aporte (Etapa 6) e às oportunidades de economia
 * por categoria (Etapa 3), sem nenhum cálculo novo além da própria
 * diferença entre o necessário e o que já é possível.
 */

export type GoalPlanCategoryCut = {
	categoryId: string;
	categoryName: string;
	amount: number;
};

export type GoalPlanInput = {
	name: string;
	targetAmount: number;
	currentAmount: number;
	/** Meses restantes até a data-alvo; `null` se a meta não tem prazo. */
	monthsRemaining: number | null;
};

export type GoalPlan = {
	goalName: string;
	targetAmount: number;
	currentAmount: number;
	remainingAmount: number;
	monthsRemaining: number | null;
	/** `null` quando a meta não tem prazo (não dá pra calcular um valor mensal). */
	requiredMonthlyContribution: number | null;
	currentCapacity: number;
	/** Quanto falta por mês além da capacidade atual (nunca negativo). */
	gap: number;
	suggestedCuts: GoalPlanCategoryCut[];
	totalSuggestedCuts: number;
	/** `true` quando a capacidade atual, ou a capacidade + os cortes sugeridos, cobre o necessário. */
	isAchievable: boolean;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export type SuggestedBudgetForGoalPlan = {
	categoryId: string;
	categoryName: string;
	potentialMonthlySavings: number;
};

export function buildGoalPlan(
	goal: GoalPlanInput,
	currentCapacity: number,
	suggestedBudgets: SuggestedBudgetForGoalPlan[],
): GoalPlan {
	const remainingAmount = round2(
		Math.max(goal.targetAmount - goal.currentAmount, 0),
	);
	const requiredMonthlyContribution =
		goal.monthsRemaining && goal.monthsRemaining > 0
			? round2(remainingAmount / goal.monthsRemaining)
			: null;
	const gap =
		requiredMonthlyContribution === null
			? 0
			: round2(Math.max(requiredMonthlyContribution - currentCapacity, 0));

	const suggestedCuts: GoalPlanCategoryCut[] = [];
	if (gap > 0) {
		const sorted = [...suggestedBudgets]
			.filter((budget) => budget.potentialMonthlySavings > 0)
			.sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings);

		let accumulated = 0;
		for (const budget of sorted) {
			if (accumulated >= gap) break;
			suggestedCuts.push({
				categoryId: budget.categoryId,
				categoryName: budget.categoryName,
				amount: budget.potentialMonthlySavings,
			});
			accumulated += budget.potentialMonthlySavings;
		}
	}

	const totalSuggestedCuts = round2(
		suggestedCuts.reduce((total, cut) => total + cut.amount, 0),
	);

	return {
		goalName: goal.name,
		targetAmount: round2(goal.targetAmount),
		currentAmount: round2(goal.currentAmount),
		remainingAmount,
		monthsRemaining: goal.monthsRemaining,
		requiredMonthlyContribution,
		currentCapacity: round2(currentCapacity),
		gap,
		suggestedCuts,
		totalSuggestedCuts,
		isAchievable: gap <= 0 || totalSuggestedCuts >= gap,
	};
}
