import { connection } from "next/server";
import { BudgetsPage } from "@/features/budgets/components/budgets-page";
import {
	fetchBudgetsForUser,
	fetchSuggestedCategoryBudgets,
} from "@/features/budgets/queries";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUserId } from "@/shared/lib/auth/server";
import { parsePeriodParam } from "@/shared/utils/period";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
	searchParams?: PageSearchParams;
};

const getSingleParam = (
	params: Record<string, string | string[] | undefined> | undefined,
	key: string,
) => {
	const value = params?.[key];
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function Page({ searchParams }: PageProps) {
	await connection();
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);
	const [{ budgets, categoriesOptions }, suggestedBudgets] = await Promise.all([
		fetchBudgetsForUser(userId, selectedPeriod),
		fetchSuggestedCategoryBudgets(userId, selectedPeriod).catch((error) => {
			console.error("Falha ao calcular metas sugeridas:", error);
			return [];
		}),
	]);

	const budgetedCategoryIds = new Set(
		budgets
			.map((budget) => budget.category?.id)
			.filter((id): id is string => Boolean(id)),
	);
	const suggestions = suggestedBudgets.filter(
		(suggestion) => !budgetedCategoryIds.has(suggestion.categoryId),
	);

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />
			<BudgetsPage
				budgets={budgets}
				categories={categoriesOptions}
				selectedPeriod={selectedPeriod}
				suggestions={suggestions}
			/>
		</main>
	);
}
