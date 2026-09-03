import { connection } from "next/server";
import { InsightsPage } from "@/features/insights/components/insights-page";
import { ContentErrorBoundary } from "@/shared/components/feedback/content-error-boundary";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import { getUserId } from "@/shared/lib/auth/server";
import { getMonthlyCashFlow } from "@/shared/lib/financial-analysis/financial-summary";
import { buildPeriodWindow, parsePeriodParam } from "@/shared/utils/period";

const TREND_HISTORY_MONTHS = 6;

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

export default function Page({ searchParams }: PageProps) {
	return (
		<ContentErrorBoundary
			title="Não foi possível carregar os Insights"
			description="As análises financeiras não puderam ser carregadas agora."
		>
			<InsightsContent searchParams={searchParams} />
		</ContentErrorBoundary>
	);
}

async function InsightsContent({ searchParams }: PageProps) {
	await connection();
	const userId = await getUserId();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const periodoParam = getSingleParam(resolvedSearchParams, "periodo");
	const { period: selectedPeriod } = parsePeriodParam(periodoParam);

	const trend = await getMonthlyCashFlow(
		userId,
		buildPeriodWindow(selectedPeriod, TREND_HISTORY_MONTHS),
	).catch((error) => {
		console.error("Falha ao buscar tendência mensal:", error);
		return [];
	});

	return (
		<main className="flex flex-col gap-6">
			<MonthNavigation />
			<InsightsPage period={selectedPeriod} trend={trend} />
		</main>
	);
}
