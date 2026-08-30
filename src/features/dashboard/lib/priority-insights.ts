/**
 * "No máximo 3 insights prioritários" pro Início — reaproveita
 * `getExpensesByCategory` (desvio de cada categoria contra a própria média
 * histórica) e `fetchSuggestedCategoryBudgets` (economia potencial), sem
 * nenhum cálculo novo. Puramente uma camada de priorização + texto.
 */
import type { SuggestedCategoryBudget } from "@/features/budgets/lib/suggested-budgets";
import type { CategoryExpenseBreakdown } from "@/shared/lib/financial-analysis/category-breakdown";
import { formatCurrency } from "@/shared/utils/currency";

const MAX_INSIGHTS = 3;
const MAX_DEVIATION_INSIGHTS = 2;
const MAX_SAVINGS_CATEGORIES_NAMED = 2;
/** Ignora categorias sem base histórica real (ruído de categoria nova). */
const MIN_HISTORICAL_AVERAGE = 1;

function joinCategoryNames(names: string[]): string {
	if (names.length === 1) return names[0] ?? "";
	return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

/**
 * Monta as linhas de insight priorizadas: primeiro os maiores desvios de
 * gasto (categoria acima do próprio padrão), depois, se ainda houver
 * espaço, uma linha combinada de economia potencial a partir das metas
 * sugeridas. Nunca mais que `MAX_INSIGHTS` linhas.
 */
export function buildPriorityInsights(
	categoryBreakdown: CategoryExpenseBreakdown[],
	suggestedBudgets: SuggestedCategoryBudget[],
): string[] {
	const deviations = categoryBreakdown
		.filter(
			(category) =>
				category.historicalAverage >= MIN_HISTORICAL_AVERAGE &&
				category.difference > 0,
		)
		.sort((a, b) => b.difference - a.difference)
		.slice(0, MAX_DEVIATION_INSIGHTS);

	const lines: string[] = deviations.map((category, index) => {
		if (index === 0) {
			return `${category.categoryName} está ${formatCurrency(category.difference)} acima do seu padrão.`;
		}
		const increasePercent = Math.round(
			(category.difference / category.historicalAverage) * 100,
		);
		return `${category.categoryName} aumentou ${increasePercent}% em relação à média.`;
	});

	if (lines.length < MAX_INSIGHTS) {
		const savingsOpportunities = suggestedBudgets
			.filter((budget) => budget.potentialMonthlySavings > 0)
			.sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings)
			.slice(0, MAX_SAVINGS_CATEGORIES_NAMED);

		if (savingsOpportunities.length > 0) {
			const total = savingsOpportunities.reduce(
				(sum, budget) => sum + budget.potentialMonthlySavings,
				0,
			);
			const names = joinCategoryNames(
				savingsOpportunities.map((budget) => budget.categoryName),
			);
			lines.push(
				`Reduzindo ${names} para as metas sugeridas, você pode economizar aproximadamente ${formatCurrency(total)} neste mês.`,
			);
		}
	}

	return lines.slice(0, MAX_INSIGHTS);
}
