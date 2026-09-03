import { connection } from "next/server";
import { getGoalPlan } from "@/features/assistant/lib/goal-plan";
import { getInvestmentCapacity } from "@/features/assistant/lib/investment-capacity";
import { SpendingPanelPage } from "@/features/budgets/components/spending-panel/spending-panel-page";
import { fetchSuggestedCategoryBudgets } from "@/features/budgets/queries";
import { ContentErrorBoundary } from "@/shared/components/feedback/content-error-boundary";
import { getUserId } from "@/shared/lib/auth/server";
import { buildInvestmentCapacity } from "@/shared/lib/financial-analysis/investment-capacity";
import { getRecurringMerchants } from "@/shared/lib/financial-analysis/recurring-merchants";
import { buildPeriodWindow, getCurrentPeriod } from "@/shared/utils/period";

const RECURRING_HISTORY_MONTHS = 3;

export default function Page() {
	return (
		<ContentErrorBoundary
			title="Não foi possível carregar o painel de gastos"
			description="Os dados de gastos não puderam ser calculados agora."
		>
			<SpendingPanelContent />
		</ContentErrorBoundary>
	);
}

async function SpendingPanelContent() {
	await connection();
	const userId = await getUserId();
	const period = getCurrentPeriod();

	const [categories, recurring, goalPlan, capacity] = await Promise.all([
		fetchSuggestedCategoryBudgets(userId, period).catch((error) => {
			console.error("Falha ao calcular tetos sugeridos:", error);
			return [];
		}),
		getRecurringMerchants(
			userId,
			buildPeriodWindow(period, RECURRING_HISTORY_MONTHS),
		).catch((error) => {
			console.error("Falha ao calcular estabelecimentos recorrentes:", error);
			return { subscriptions: [], recurringMerchants: [] };
		}),
		getGoalPlan(userId).catch((error) => {
			console.error("Falha ao calcular plano de meta:", error);
			return null;
		}),
		getInvestmentCapacity(userId).catch((error) => {
			console.error("Falha ao calcular capacidade de aporte:", error);
			return buildInvestmentCapacity(0, []);
		}),
	]);

	return (
		<main className="flex flex-col gap-6">
			<SpendingPanelPage
				capacity={capacity}
				categories={categories}
				goalPlan={goalPlan}
				period={period}
				recurring={recurring}
			/>
		</main>
	);
}
