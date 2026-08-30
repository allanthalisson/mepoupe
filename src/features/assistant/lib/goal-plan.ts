/**
 * Orquestra `buildGoalPlan` com dados reais: a meta financeira ativa de
 * maior prioridade (ou uma específica, por id), a capacidade de aporte
 * (Etapa 6) e as metas sugeridas por categoria (Etapa 3) — nenhuma
 * consulta nova de meta, só reaproveitamento do que `financialGoals` já
 * guarda.
 */
import { and, asc, eq } from "drizzle-orm";
import { financialGoals } from "@/db/schema";
import { getInvestmentCapacity } from "@/features/assistant/lib/investment-capacity";
import { fetchSuggestedCategoryBudgets } from "@/features/budgets/queries";
import { db } from "@/shared/lib/db";
import {
	buildGoalPlan,
	type GoalPlan,
} from "@/shared/lib/financial-analysis/goal-plan";
import { getCurrentPeriod } from "@/shared/utils/period";

function monthsUntil(date: Date | null): number | null {
	if (!date) return null;
	const now = new Date();
	const months =
		(date.getFullYear() - now.getFullYear()) * 12 +
		date.getMonth() -
		now.getMonth();
	return Math.max(months, 1);
}

/**
 * Monta o plano pra uma meta financeira: se `goalId` não for informado, usa
 * a meta ativa de maior prioridade. Devolve `null` se não houver meta ativa
 * (nesse caso não há o que planejar).
 */
export async function getGoalPlan(
	userId: string,
	goalId?: string,
): Promise<GoalPlan | null> {
	const goal = await db.query.financialGoals.findFirst({
		where: goalId
			? and(eq(financialGoals.id, goalId), eq(financialGoals.userId, userId))
			: and(
					eq(financialGoals.userId, userId),
					eq(financialGoals.status, "active"),
				),
		orderBy: [asc(financialGoals.priority), asc(financialGoals.createdAt)],
	});
	if (!goal) return null;

	const [capacity, suggestedBudgets] = await Promise.all([
		getInvestmentCapacity(userId),
		fetchSuggestedCategoryBudgets(userId, getCurrentPeriod()),
	]);

	return buildGoalPlan(
		{
			name: goal.name,
			targetAmount: Number(goal.targetAmount),
			currentAmount: Number(goal.currentAmount),
			monthsRemaining: monthsUntil(goal.targetDate),
		},
		capacity.conservativeCapacity,
		suggestedBudgets.map((budget) => ({
			categoryId: budget.categoryId,
			categoryName: budget.categoryName,
			potentialMonthlySavings: budget.potentialMonthlySavings,
		})),
	);
}
