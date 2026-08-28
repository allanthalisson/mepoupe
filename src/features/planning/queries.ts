import { and, asc, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import {
	accountShares,
	categories,
	debts,
	financialAccounts,
	financialGoals,
	transactions,
} from "@/db/schema";
import { estimateDebtPayoff } from "@/features/planning/lib/debt-payoff";
import {
	buildFinancialDiagnosis,
	type DiagnosticTransaction,
} from "@/features/planning/lib/diagnostics";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { addMonthsToPeriod, getCurrentPeriod } from "@/shared/utils/period";

export type PlanningGoal = {
	id: string;
	name: string;
	goalType: string;
	targetAmount: number;
	currentAmount: number;
	monthlyContribution: number;
	targetDate: string | null;
	priority: number;
	status: string;
	note: string | null;
	accountId: string | null;
	accountName: string | null;
	progress: number;
	remainingAmount: number;
	estimatedMonths: number | null;
	isOnTrack: boolean | null;
};

export type PlanningDebt = {
	id: string;
	name: string;
	creditor: string | null;
	currentBalance: number;
	annualInterestRate: number;
	minimumPayment: number;
	plannedPayment: number;
	dueDay: number | null;
	status: string;
	note: string | null;
	estimatedMonths: number | null;
	estimatedInterest: number | null;
	paymentCoversInterest: boolean;
};

const monthsUntil = (date: Date | null) => {
	if (!date) return null;
	const now = new Date();
	const months =
		(date.getFullYear() - now.getFullYear()) * 12 +
		date.getMonth() -
		now.getMonth();
	return Math.max(months, 0);
};

export async function fetchPlanningPageData(userId: string) {
	const currentPeriod = getCurrentPeriod();
	const periods = Array.from({ length: 6 }, (_, index) =>
		addMonthsToPeriod(currentPeriod, index - 5),
	);
	const adminPayerId = await getAdminPayerId(userId);

	const transactionPromise = adminPayerId
		? db
				.select({
					name: transactions.name,
					period: transactions.period,
					amount: transactions.amount,
					transactionType: transactions.transactionType,
					condition: transactions.condition,
					categoryName: categories.name,
				})
				.from(transactions)
				.leftJoin(categories, eq(transactions.categoryId, categories.id))
				.where(
					and(
						buildFinancialAdminAccessFilter({ userId, adminPayerId }),
						gte(transactions.period, periods[0] ?? currentPeriod),
						lte(transactions.period, currentPeriod),
						eq(transactions.isSettled, true),
						inArray(transactions.transactionType, ["Receita", "Despesa"]),
					),
				)
		: Promise.resolve([]);

	const [goalRows, debtRows, transactionRows, accountRows] = await Promise.all([
		db
			.select({
				id: financialGoals.id,
				name: financialGoals.name,
				goalType: financialGoals.goalType,
				targetAmount: financialGoals.targetAmount,
				currentAmount: financialGoals.currentAmount,
				monthlyContribution: financialGoals.monthlyContribution,
				targetDate: financialGoals.targetDate,
				priority: financialGoals.priority,
				status: financialGoals.status,
				note: financialGoals.note,
				accountId: financialGoals.accountId,
				accountName: financialAccounts.name,
			})
			.from(financialGoals)
			.leftJoin(
				financialAccounts,
				eq(financialGoals.accountId, financialAccounts.id),
			)
			.where(eq(financialGoals.userId, userId))
			.orderBy(asc(financialGoals.priority), asc(financialGoals.createdAt)),
		db.query.debts.findMany({
			where: eq(debts.userId, userId),
			orderBy: [desc(debts.annualInterestRate), desc(debts.currentBalance)],
		}),
		transactionPromise,
		db
			.select({
				id: financialAccounts.id,
				name: financialAccounts.name,
			})
			.from(financialAccounts)
			.leftJoin(
				accountShares,
				and(
					eq(accountShares.accountId, financialAccounts.id),
					eq(accountShares.sharedWithUserId, userId),
				),
			)
			.where(
				or(
					eq(financialAccounts.userId, userId),
					eq(accountShares.sharedWithUserId, userId),
				),
			)
			.orderBy(asc(financialAccounts.name)),
	]);

	const goals: PlanningGoal[] = goalRows.map((goal) => {
		const targetAmount = Number(goal.targetAmount);
		const currentAmount = Number(goal.currentAmount);
		const monthlyContribution = Number(goal.monthlyContribution);
		const remainingAmount = Math.max(targetAmount - currentAmount, 0);
		const estimatedMonths =
			monthlyContribution > 0
				? Math.ceil(remainingAmount / monthlyContribution)
				: remainingAmount === 0
					? 0
					: null;
		const targetMonths = monthsUntil(goal.targetDate);
		return {
			...goal,
			targetDate: goal.targetDate?.toISOString().slice(0, 10) ?? null,
			targetAmount,
			currentAmount,
			monthlyContribution,
			progress:
				targetAmount > 0
					? Math.min(
							Math.round((currentAmount / targetAmount) * 1000) / 10,
							100,
						)
					: 0,
			remainingAmount,
			estimatedMonths,
			isOnTrack:
				targetMonths === null || estimatedMonths === null
					? null
					: estimatedMonths <= targetMonths,
		};
	});

	const activeDebts: PlanningDebt[] = debtRows.map((debt) => {
		const currentBalance = Number(debt.currentBalance);
		const plannedPayment = Number(debt.plannedPayment);
		const payoff = estimateDebtPayoff(
			currentBalance,
			Number(debt.annualInterestRate),
			plannedPayment,
		);
		return {
			id: debt.id,
			name: debt.name,
			creditor: debt.creditor,
			currentBalance,
			annualInterestRate: Number(debt.annualInterestRate),
			minimumPayment: Number(debt.minimumPayment),
			plannedPayment,
			dueDay: debt.dueDay,
			status: debt.status,
			note: debt.note,
			estimatedMonths: payoff.months,
			estimatedInterest: payoff.totalInterest,
			paymentCoversInterest: payoff.paymentCoversInterest,
		};
	});

	const diagnosis = buildFinancialDiagnosis(
		transactionRows.map(
			(row): DiagnosticTransaction => ({
				...row,
				amount: Number(row.amount),
			}),
		),
		periods,
	);
	const totalDebt = activeDebts
		.filter((debt) => debt.status === "active")
		.reduce((total, debt) => total + debt.currentBalance, 0);
	const plannedDebtPayment = activeDebts
		.filter((debt) => debt.status === "active")
		.reduce((total, debt) => total + debt.plannedPayment, 0);
	const activeGoals = goals.filter((goal) => goal.status === "active");
	const plannedGoalContribution = activeGoals.reduce(
		(total, goal) => total + goal.monthlyContribution,
		0,
	);

	return {
		diagnosis,
		goals,
		debts: activeDebts,
		accounts: accountRows,
		summary: {
			totalDebt,
			plannedDebtPayment,
			plannedGoalContribution,
			unallocatedMonthlyAmount: Math.max(
				diagnosis.averageSavings - plannedDebtPayment - plannedGoalContribution,
				0,
			),
		},
	};
}

export type PlanningPageData = Awaited<
	ReturnType<typeof fetchPlanningPageData>
>;
