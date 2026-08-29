import { and, asc, desc, eq } from "drizzle-orm";
import {
	financialConsultations,
	financialGoals,
	investmentAssets,
	investmentSuggestionDismissals,
	marketAssetSnapshots,
} from "@/db/schema";
import { buildCoursePortfolioMap } from "@/features/investments/lib/course-method";
import { screenFundamentals } from "@/features/investments/lib/fundamental-screening";
import { buildPortfolioMetrics } from "@/features/investments/lib/portfolio";
import { buildInvestmentSuggestions } from "@/features/investments/lib/suggestions";
import { db } from "@/shared/lib/db";
import { fetchUserIntegrationSecrets } from "@/shared/lib/integrations/user-keys";
import { fetchScreenedCandidates } from "@/shared/lib/market-data/candidates-sync";
import { FinancialConsultationSchema } from "@/shared/lib/schemas/financial-consultation";

export type InvestmentAsset = {
	id: string;
	name: string;
	ticker: string | null;
	assetClass: string;
	institution: string | null;
	quantity: number;
	averagePrice: number;
	currentPrice: number;
	monthlyIncome: number;
	targetAllocation: number;
	note: string | null;
	goalId: string | null;
	goalName: string | null;
	currentValue: number;
	cost: number;
	gain: number;
	allocation: number;
};

export async function fetchInvestmentsPageData(userId: string) {
	const period = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
	const userIntegrations = await fetchUserIntegrationSecrets(userId);
	const [
		rows,
		goalRows,
		snapshotRows,
		consultation,
		consultationHistory,
		candidates,
		dismissalRows,
	] = await Promise.all([
		db
			.select({
				id: investmentAssets.id,
				name: investmentAssets.name,
				ticker: investmentAssets.ticker,
				assetClass: investmentAssets.assetClass,
				institution: investmentAssets.institution,
				quantity: investmentAssets.quantity,
				averagePrice: investmentAssets.averagePrice,
				currentPrice: investmentAssets.currentPrice,
				monthlyIncome: investmentAssets.monthlyIncome,
				targetAllocation: investmentAssets.targetAllocation,
				note: investmentAssets.note,
				goalId: investmentAssets.goalId,
				goalName: financialGoals.name,
			})
			.from(investmentAssets)
			.leftJoin(financialGoals, eq(investmentAssets.goalId, financialGoals.id))
			.where(eq(investmentAssets.userId, userId))
			.orderBy(asc(investmentAssets.assetClass), asc(investmentAssets.name)),
		db
			.select({
				id: financialGoals.id,
				name: financialGoals.name,
				goalType: financialGoals.goalType,
				targetAmount: financialGoals.targetAmount,
				monthlyContribution: financialGoals.monthlyContribution,
				targetDate: financialGoals.targetDate,
			})
			.from(financialGoals)
			.where(
				and(
					eq(financialGoals.userId, userId),
					eq(financialGoals.status, "active"),
				),
			)
			.orderBy(asc(financialGoals.priority), asc(financialGoals.name)),
		db
			.select()
			.from(marketAssetSnapshots)
			.where(eq(marketAssetSnapshots.userId, userId)),
		db.query.financialConsultations.findFirst({
			where: and(
				eq(financialConsultations.userId, userId),
				eq(financialConsultations.period, period),
			),
		}),
		db
			.select({
				period: financialConsultations.period,
				modelId: financialConsultations.modelId,
				updatedAt: financialConsultations.updatedAt,
			})
			.from(financialConsultations)
			.where(eq(financialConsultations.userId, userId))
			.orderBy(desc(financialConsultations.period))
			.limit(6),
		fetchScreenedCandidates(),
		db
			.select({ ticker: investmentSuggestionDismissals.ticker })
			.from(investmentSuggestionDismissals)
			.where(eq(investmentSuggestionDismissals.userId, userId)),
	]);
	const snapshots = new Map(
		snapshotRows.map((snapshot) => [snapshot.assetId, snapshot]),
	);

	const rawAssets = rows.map((row) => ({
		...row,
		quantity: Number(row.quantity),
		averagePrice: Number(row.averagePrice),
		currentPrice: Number(row.currentPrice),
		monthlyIncome: Number(row.monthlyIncome),
		targetAllocation: Number(row.targetAllocation),
	}));
	const targetMonthlyIncome = goalRows
		.filter((goal) => goal.goalType === "passive_income")
		.reduce((total, goal) => total + Number(goal.targetAmount), 0);
	const metrics = buildPortfolioMetrics(rawAssets, targetMonthlyIncome);
	const methodGoal = goalRows.find(
		(goal) =>
			["investment", "passive_income"].includes(goal.goalType) &&
			goal.targetDate,
	);
	const courseMethod = buildCoursePortfolioMap(
		rawAssets.map((asset) => ({
			name: asset.name,
			assetClass: asset.assetClass,
			currentValue: asset.quantity * asset.currentPrice,
		})),
		methodGoal?.targetDate
			? {
					name: methodGoal.name,
					targetDate: methodGoal.targetDate,
					monthlyContribution: Number(methodGoal.monthlyContribution),
				}
			: null,
	);
	const assets = rawAssets.map((asset) => {
		const currentValue = asset.quantity * asset.currentPrice;
		const cost = asset.quantity * asset.averagePrice;
		const snapshot = snapshots.get(asset.id) ?? null;
		const fundamentalData = snapshot
			? {
					priceToEarnings:
						snapshot.priceToEarnings === null
							? null
							: Number(snapshot.priceToEarnings),
					priceToBook:
						snapshot.priceToBook === null ? null : Number(snapshot.priceToBook),
					enterpriseToEbit:
						snapshot.enterpriseToEbit === null
							? null
							: Number(snapshot.enterpriseToEbit),
					dividendYield:
						snapshot.dividendYield === null
							? null
							: Number(snapshot.dividendYield),
					returnOnEquity:
						snapshot.returnOnEquity === null
							? null
							: Number(snapshot.returnOnEquity),
					currentRatio:
						snapshot.currentRatio === null
							? null
							: Number(snapshot.currentRatio),
					debtToEquity:
						snapshot.debtToEquity === null
							? null
							: Number(snapshot.debtToEquity),
					revenueGrowth:
						snapshot.revenueGrowth === null
							? null
							: Number(snapshot.revenueGrowth),
					profitMargin:
						snapshot.profitMargin === null
							? null
							: Number(snapshot.profitMargin),
					vacancyRate:
						snapshot.vacancyRate === null ? null : Number(snapshot.vacancyRate),
					propertyCount: snapshot.propertyCount,
					dailyLiquidity:
						snapshot.dailyLiquidity === null
							? null
							: Number(snapshot.dailyLiquidity),
				}
			: null;
		return {
			...asset,
			currentValue,
			cost,
			gain: currentValue - cost,
			allocation:
				metrics.totalCurrentValue > 0
					? (currentValue / metrics.totalCurrentValue) * 100
					: 0,
			market: snapshot
				? {
						status: snapshot.status,
						source: snapshot.source,
						quoteUpdatedAt: snapshot.quoteUpdatedAt?.toISOString() ?? null,
						fundamentalsUpdatedAt:
							snapshot.fundamentalsUpdatedAt?.toISOString() ?? null,
						lastError: snapshot.lastError,
					}
				: null,
			screening: screenFundamentals(asset.assetClass, fundamentalData),
		};
	});

	const ownedTickers = new Set(
		assets
			.filter((asset) => asset.ticker)
			.map((asset) => (asset.ticker as string).toUpperCase()),
	);
	const concentrationByTicker = new Map(
		assets
			.filter((asset) => asset.ticker)
			.map((asset) => [
				(asset.ticker as string).toUpperCase(),
				asset.allocation,
			]),
	);
	const dismissedTickers = new Set(
		dismissalRows.map((row) => row.ticker.toUpperCase()),
	);
	const suggestions = buildInvestmentSuggestions(
		courseMethod,
		candidates,
		ownedTickers,
		concentrationByTicker,
		dismissedTickers,
	);
	const candidatesSyncedAt = candidates.reduce<string | null>(
		(latest, candidate) =>
			!latest || candidate.lastSyncedAt > latest
				? candidate.lastSyncedAt
				: latest,
		null,
	);

	return {
		assets,
		metrics,
		courseMethod,
		suggestions,
		suggestionsFreshness: {
			configured: Boolean(process.env.BRAPI_TOKEN),
			candidatesTracked: candidates.length,
			lastSyncedAt: candidatesSyncedAt,
		},
		period,
		consultation:
			consultation &&
			FinancialConsultationSchema.safeParse(consultation.data).success
				? {
						data: FinancialConsultationSchema.parse(consultation.data),
						modelId: consultation.modelId,
						updatedAt: consultation.updatedAt.toISOString(),
						marketDataUpdatedAt:
							consultation.marketDataUpdatedAt?.toISOString() ?? null,
					}
				: null,
		marketFreshness: {
			configured: Boolean(
				userIntegrations.brapiToken || process.env.BRAPI_TOKEN,
			),
			tracked: snapshotRows.length,
			partial: snapshotRows.filter((item) => item.status === "partial").length,
			failed: snapshotRows.filter((item) => item.status === "error").length,
			latestQuoteAt: (() => {
				const latest = snapshotRows
					.map((item) => item.quoteUpdatedAt?.getTime() ?? 0)
					.reduce((current, value) => Math.max(current, value), 0);
				return latest ? new Date(latest).toISOString() : null;
			})(),
		},
		consultantModel:
			userIntegrations.consultantModelId ??
			process.env.FINANCIAL_CONSULTANT_MODEL ??
			"gpt-5.5",
		consultationHistory: consultationHistory.map((item) => ({
			period: item.period,
			modelId: item.modelId,
			updatedAt: item.updatedAt.toISOString(),
		})),
		goals: goalRows.map(({ id, name }) => ({ id, name })),
	};
}

export type InvestmentsPageData = Awaited<
	ReturnType<typeof fetchInvestmentsPageData>
>;
