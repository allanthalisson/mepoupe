/**
 * Orquestra `buildInvestmentCapacity` (cálculo puro) com dados reais:
 * renda média dos últimos meses completos + classificação/histórico por
 * categoria já calculado em `fetchSuggestedCategoryBudgets` (Etapa 3) —
 * nenhuma consulta nova de categoria, só reaproveitamento.
 */
import { fetchSuggestedCategoryBudgets } from "@/features/budgets/queries";
import { getMonthlyCashFlow } from "@/shared/lib/financial-analysis/financial-summary";
import {
	buildInvestmentCapacity,
	type InvestmentCapacityResult,
} from "@/shared/lib/financial-analysis/investment-capacity";
import {
	buildPeriodWindow,
	getCurrentPeriod,
	getPreviousPeriod,
} from "@/shared/utils/period";

const INCOME_HISTORY_MONTHS = 6;

export async function getInvestmentCapacity(
	userId: string,
): Promise<InvestmentCapacityResult> {
	const lastCompletePeriod = getPreviousPeriod(getCurrentPeriod());
	const incomePeriods = buildPeriodWindow(
		lastCompletePeriod,
		INCOME_HISTORY_MONTHS,
	);

	const [cashFlow, categoryBudgets] = await Promise.all([
		getMonthlyCashFlow(userId, incomePeriods),
		fetchSuggestedCategoryBudgets(userId, getCurrentPeriod()),
	]);

	const averageIncome =
		cashFlow.length > 0
			? cashFlow.reduce((total, month) => total + month.income, 0) /
				cashFlow.length
			: 0;

	return buildInvestmentCapacity(
		averageIncome,
		categoryBudgets.map((budget) => ({
			classification: budget.classification,
			historicalAverage: budget.historicalAverage,
		})),
	);
}
