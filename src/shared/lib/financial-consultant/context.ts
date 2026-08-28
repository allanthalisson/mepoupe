import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
	categories,
	debts,
	financialAccounts,
	financialGoals,
	investmentAssets,
	marketAssetSnapshots,
	transactions,
} from "@/db/schema";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { getPreviousPeriod } from "@/shared/utils/period";

function buildRebalanceContext(
	assets: Array<{ asset: typeof investmentAssets.$inferSelect }>,
	goals: Array<typeof financialGoals.$inferSelect>,
) {
	const goal = goals.find(
		(item) =>
			["investment", "passive_income"].includes(item.goalType) &&
			item.targetDate,
	);
	if (!goal?.targetDate) return { status: "needs_goal" as const };
	const years = Math.max(
		0,
		(new Date(goal.targetDate).getTime() - Date.now()) /
			(365.2425 * 24 * 60 * 60 * 1000),
	);
	const fixedIncomeTarget =
		years <= 3 ? 60 : years < 8 ? 45 : years < 15 ? 30 : 20;
	const variableTarget = (100 - fixedIncomeTarget) / 3;
	const targets: Record<string, number> = {
		fixed_income: fixedIncomeTarget,
		reits: variableTarget,
		stocks: variableTarget,
		international: variableTarget,
	};
	const total = assets.reduce(
		(sum, item) =>
			sum + Number(item.asset.quantity) * Number(item.asset.currentPrice),
		0,
	);
	const classes = Object.entries(targets).map(([assetClass, target]) => {
		const value = assets
			.filter((item) => item.asset.assetClass === assetClass)
			.reduce(
				(sum, item) =>
					sum + Number(item.asset.quantity) * Number(item.asset.currentPrice),
				0,
			);
		const current = total > 0 ? (value / total) * 100 : 0;
		const gap = current - target;
		return {
			assetClass,
			current,
			target,
			lowerBand: Math.max(target - 5, 0),
			upperBand: Math.min(target + 5, 100),
			gap,
			action: gap < -5 ? "reinforce" : gap > 5 ? "review_excess" : "hold",
		};
	});
	return {
		status: "ready" as const,
		goal: goal.name,
		yearsToGoal: years,
		monthlyContribution: Number(goal.monthlyContribution),
		classes,
		concentrations: assets
			.map((item) => ({
				name: item.asset.name,
				allocation:
					total > 0
						? ((Number(item.asset.quantity) * Number(item.asset.currentPrice)) /
								total) *
							100
						: 0,
			}))
			.filter((item) => item.allocation > 5),
	};
}

export async function buildFinancialConsultantContext(
	userId: string,
	period: string,
) {
	const adminPayerId = await getAdminPayerId(userId);
	const previousPeriod = getPreviousPeriod(period);
	const twoMonthsAgo = getPreviousPeriod(previousPeriod);
	const periods = [twoMonthsAgo, previousPeriod, period];
	const payerCondition = adminPayerId
		? eq(transactions.payerId, adminPayerId)
		: sql`false`;
	const [
		cashFlow,
		goalRows,
		debtRows,
		assetRows,
		trendRows,
		categoryRows,
		recentExpenseRows,
	] = await Promise.all([
		db
			.select({
				transactionType: transactions.transactionType,
				total: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.period, period),
					payerCondition,
					excludeTransactionsFromExcludedAccounts(),
				),
			)
			.groupBy(transactions.transactionType),
		db
			.select()
			.from(financialGoals)
			.where(
				and(
					eq(financialGoals.userId, userId),
					eq(financialGoals.status, "active"),
				),
			),
		db
			.select()
			.from(debts)
			.where(and(eq(debts.userId, userId), eq(debts.status, "active"))),
		db
			.select({ asset: investmentAssets, market: marketAssetSnapshots })
			.from(investmentAssets)
			.leftJoin(
				marketAssetSnapshots,
				and(
					eq(marketAssetSnapshots.assetId, investmentAssets.id),
					eq(marketAssetSnapshots.userId, userId),
				),
			)
			.where(eq(investmentAssets.userId, userId)),
		db
			.select({
				period: transactions.period,
				transactionType: transactions.transactionType,
				total: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					eq(transactions.userId, userId),
					inArray(transactions.period, periods),
					payerCondition,
					excludeTransactionsFromExcludedAccounts(),
				),
			)
			.groupBy(transactions.period, transactions.transactionType),
		db
			.select({
				name: categories.name,
				total: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
			})
			.from(transactions)
			.innerJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.period, period),
					eq(transactions.transactionType, "Despesa"),
					payerCondition,
					excludeTransactionsFromExcludedAccounts(),
				),
			)
			.groupBy(categories.name)
			.orderBy(sql`sum(abs(${transactions.amount})) desc`)
			.limit(8),
		db
			.select({
				name: transactions.name,
				period: transactions.period,
				amount: transactions.amount,
				condition: transactions.condition,
				installmentCount: transactions.installmentCount,
				currentInstallment: transactions.currentInstallment,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					eq(transactions.userId, userId),
					inArray(transactions.period, periods),
					eq(transactions.transactionType, "Despesa"),
					payerCondition,
					excludeTransactionsFromExcludedAccounts(),
				),
			),
	]);

	const income = Number(
		cashFlow.find((row) => row.transactionType === "Receita")?.total ?? 0,
	);
	const expenses = Number(
		cashFlow.find((row) => row.transactionType === "Despesa")?.total ?? 0,
	);
	const totalDebt = debtRows.reduce(
		(sum, item) => sum + Number(item.currentBalance),
		0,
	);
	const portfolioValue = assetRows.reduce(
		(sum, item) =>
			sum + Number(item.asset.quantity) * Number(item.asset.currentPrice),
		0,
	);
	const latestMarketUpdate = assetRows
		.map((item) => item.market?.quoteUpdatedAt?.getTime() ?? 0)
		.reduce((latest, current) => Math.max(latest, current), 0);
	const portfolioRebalance = buildRebalanceContext(assetRows, goalRows);
	const trend = periods.map((trendPeriod) => {
		const rows = trendRows.filter((row) => row.period === trendPeriod);
		return {
			period: trendPeriod,
			income: Number(
				rows.find((row) => row.transactionType === "Receita")?.total ?? 0,
			),
			expenses: Number(
				rows.find((row) => row.transactionType === "Despesa")?.total ?? 0,
			),
		};
	});
	const recurringByName = new Map<
		string,
		Array<{ period: string; amount: number }>
	>();
	for (const row of recentExpenseRows) {
		const key = row.name.trim().toLocaleLowerCase("pt-BR");
		const occurrences = recurringByName.get(key) ?? [];
		occurrences.push({
			period: row.period,
			amount: Math.abs(Number(row.amount)),
		});
		recurringByName.set(key, occurrences);
	}
	const recurringExpenses = Array.from(recurringByName.entries())
		.map(([name, occurrences]) => {
			const months = new Set(occurrences.map((item) => item.period)).size;
			const average =
				occurrences.reduce((sum, item) => sum + item.amount, 0) /
				occurrences.length;
			const amounts = occurrences.map((item) => item.amount);
			const variation = Math.max(...amounts) - Math.min(...amounts);
			return { name, months, average, stable: variation <= average * 0.2 };
		})
		.filter((item) => item.months >= 2 && item.stable)
		.map(({ name, months, average }) => ({ name, months, average }))
		.slice(0, 10);
	const installments = recentExpenseRows
		.filter(
			(row) =>
				row.period === period &&
				row.condition === "Parcelado" &&
				(row.installmentCount ?? 0) > 1,
		)
		.map((row) => ({
			name: row.name,
			amount: Math.abs(Number(row.amount)),
			current: row.currentInstallment ?? 1,
			total: row.installmentCount ?? 1,
			futureCommitment:
				Math.abs(Number(row.amount)) *
				Math.max(
					(row.installmentCount ?? 1) - (row.currentInstallment ?? 1),
					0,
				),
		}));

	return {
		period,
		cashFlow: {
			income,
			expenses,
			surplus: income - expenses,
			savingsRate: income > 0 ? ((income - expenses) / income) * 100 : null,
		},
		threeMonthTrend: trend,
		topExpenseCategories: categoryRows.map((row) => ({
			name: row.name,
			total: Number(row.total),
		})),
		recurringExpenses,
		installments: {
			count: installments.length,
			currentAmount: installments.reduce((sum, item) => sum + item.amount, 0),
			futureCommitment: installments.reduce(
				(sum, item) => sum + item.futureCommitment,
				0,
			),
			items: installments.slice(0, 10),
		},
		emergencyReserveReference: expenses * 6,
		goals: goalRows.map((goal) => ({
			name: goal.name,
			type: goal.goalType,
			target: Number(goal.targetAmount),
			current: Number(goal.currentAmount),
			monthlyContribution: Number(goal.monthlyContribution),
			targetDate: goal.targetDate,
		})),
		debts: debtRows.map((debt) => ({
			name: debt.name,
			balance: Number(debt.currentBalance),
			annualInterestRate: Number(debt.annualInterestRate),
			plannedPayment: Number(debt.plannedPayment),
		})),
		totalDebt,
		portfolioValue,
		portfolioRebalance,
		investments: assetRows.map(({ asset, market }) => ({
			name: asset.name,
			ticker: asset.ticker,
			assetClass: asset.assetClass,
			value: Number(asset.quantity) * Number(asset.currentPrice),
			priceUpdatedAt: market?.quoteUpdatedAt ?? null,
			fundamentalsUpdatedAt: market?.fundamentalsUpdatedAt ?? null,
			fundamentals: market
				? {
						priceToEarnings: market.priceToEarnings,
						priceToBook: market.priceToBook,
						enterpriseToEbit: market.enterpriseToEbit,
						dividendYield: market.dividendYield,
						returnOnEquity: market.returnOnEquity,
						currentRatio: market.currentRatio,
						debtToEquity: market.debtToEquity,
						revenueGrowth: market.revenueGrowth,
						profitMargin: market.profitMargin,
						vacancyRate: market.vacancyRate,
						propertyCount: market.propertyCount,
						dailyLiquidity: market.dailyLiquidity,
					}
				: null,
		})),
		marketDataUpdatedAt: latestMarketUpdate
			? new Date(latestMarketUpdate)
			: null,
		dataCoverage: {
			assets: assetRows.length,
			assetsWithTicker: assetRows.filter((item) => item.asset.ticker).length,
			assetsWithQuote: assetRows.filter((item) => item.market?.marketPrice)
				.length,
			assetsWithFundamentals: assetRows.filter(
				(item) => item.market?.fundamentalsUpdatedAt,
			).length,
		},
	};
}
