import { RiLightbulbFlashLine } from "@remixicon/react";
import { fetchSuggestedCategoryBudgets } from "@/features/budgets/queries";
import { buildPriorityInsights } from "@/features/dashboard/lib/priority-insights";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { getExpensesByCategory } from "@/shared/lib/financial-analysis/category-breakdown";

interface PriorityInsightsCardProps {
	userId: string;
	period: string;
}

/**
 * "No máximo 3 insights prioritários" no Início — server component
 * independente do resto do dashboard (não entra no grid de widgets
 * configuráveis nem no cache por widget), pra ficar simples de adicionar
 * sem mexer no que já existe.
 */
export async function PriorityInsightsCard({
	userId,
	period,
}: PriorityInsightsCardProps) {
	const [categoryBreakdown, suggestedBudgets] = await Promise.all([
		getExpensesByCategory(userId, period).catch((error) => {
			console.error("Falha ao calcular desvios por categoria:", error);
			return [];
		}),
		fetchSuggestedCategoryBudgets(userId, period).catch((error) => {
			console.error("Falha ao calcular metas sugeridas:", error);
			return [];
		}),
	]);

	const insights = buildPriorityInsights(categoryBreakdown, suggestedBudgets);
	if (insights.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<RiLightbulbFlashLine className="size-4 text-primary" />
					Insights do mês
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{insights.map((line) => (
					<p className="text-sm leading-relaxed" key={line}>
						{line}
					</p>
				))}
			</CardContent>
		</Card>
	);
}
