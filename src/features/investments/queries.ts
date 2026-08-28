import { and, asc, eq } from "drizzle-orm";
import { financialGoals, investmentAssets } from "@/db/schema";
import { buildCoursePortfolioMap } from "@/features/investments/lib/course-method";
import { buildPortfolioMetrics } from "@/features/investments/lib/portfolio";
import { db } from "@/shared/lib/db";

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
	const [rows, goalRows] = await Promise.all([
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
	]);

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
	const assets: InvestmentAsset[] = rawAssets.map((asset) => {
		const currentValue = asset.quantity * asset.currentPrice;
		const cost = asset.quantity * asset.averagePrice;
		return {
			...asset,
			currentValue,
			cost,
			gain: currentValue - cost,
			allocation:
				metrics.totalCurrentValue > 0
					? (currentValue / metrics.totalCurrentValue) * 100
					: 0,
		};
	});

	return {
		assets,
		metrics,
		courseMethod,
		goals: goalRows.map(({ id, name }) => ({ id, name })),
	};
}

export type InvestmentsPageData = Awaited<
	ReturnType<typeof fetchInvestmentsPageData>
>;
