import {
	and,
	asc,
	eq,
	inArray,
	isNotNull,
	isNull,
	or,
	sql,
	sum,
} from "drizzle-orm";
import {
	budgets,
	categories,
	financialAccounts,
	transactions,
} from "@/db/schema";
import {
	buildSuggestedCategoryBudgets,
	type CategoryBudgetInput,
	type SuggestedCategoryBudget,
} from "@/features/budgets/lib/suggested-budgets";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import {
	buildPeriodWindow,
	dateToPeriod,
	getPreviousPeriod,
} from "@/shared/utils/period";

const toNumber = (value: string | number | null | undefined) => {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
};

type BudgetData = {
	id: string;
	amount: number;
	spent: number;
	period: string;
	createdAt: string;
	category: {
		id: string;
		name: string;
		icon: string | null;
	} | null;
};

type CategoryOption = {
	id: string;
	name: string;
	icon: string | null;
};

export async function fetchBudgetsForUser(
	userId: string,
	selectedPeriod: string,
): Promise<{
	budgets: BudgetData[];
	categoriesOptions: CategoryOption[];
}> {
	const adminPayerId = await getAdminPayerId(userId);

	const [budgetRows, categoryRows] = await Promise.all([
		db.query.budgets.findMany({
			where: and(
				eq(budgets.userId, userId),
				eq(budgets.period, selectedPeriod),
			),
			with: {
				category: true,
			},
		}),
		db.query.categories.findMany({
			columns: {
				id: true,
				name: true,
				icon: true,
			},
			where: and(eq(categories.userId, userId), eq(categories.type, "despesa")),
			orderBy: asc(categories.name),
		}),
	]);

	const categoryIds = budgetRows
		.map((budget) => budget.categoryId)
		.filter((id: string | null): id is string => Boolean(id));

	let totalsByCategory = new Map<string, number>();

	if (categoryIds.length > 0 && adminPayerId) {
		const totals = await db
			.select({
				categoryId: transactions.categoryId,
				totalAmount: sum(transactions.amount).as("totalAmount"),
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.period, selectedPeriod),
					eq(transactions.transactionType, "Despesa"),
					eq(transactions.payerId, adminPayerId),
					inArray(transactions.categoryId, categoryIds),
					or(
						isNull(transactions.note),
						sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
					excludeTransactionsFromExcludedAccounts(),
				),
			)
			.groupBy(transactions.categoryId);

		totalsByCategory = new Map(
			totals.map(
				(row: { categoryId: string | null; totalAmount: string | null }) => [
					row.categoryId ?? "",
					Math.abs(toNumber(row.totalAmount)),
				],
			),
		);
	}

	const budgetList = budgetRows
		.map((budget) => ({
			id: budget.id,
			amount: toNumber(budget.amount),
			spent: totalsByCategory.get(budget.categoryId ?? "") ?? 0,
			period: budget.period,
			createdAt: budget.createdAt.toISOString(),
			category: (() => {
				type Cat = { id: string; name: string; icon: string | null };
				const cat = budget.category as Cat | null | undefined;
				return cat ? { id: cat.id, name: cat.name, icon: cat.icon } : null;
			})(),
		}))
		.sort((a, b) =>
			(a.category?.name ?? "").localeCompare(b.category?.name ?? "", "pt-BR", {
				sensitivity: "base",
			}),
		);

	const categoriesOptions = categoryRows.map((category) => ({
		id: category.id,
		name: category.name,
		icon: category.icon,
	}));

	return { budgets: budgetList, categoriesOptions };
}

export type CategoryBudgetSummary = {
	amount: number;
	spent: number;
};

export async function fetchCategoryBudgetSummary(
	userId: string,
	categoryId: string,
	period: string,
): Promise<CategoryBudgetSummary | null> {
	const [adminPayerId, budget] = await Promise.all([
		getAdminPayerId(userId),
		db.query.budgets.findFirst({
			columns: { amount: true },
			where: and(
				eq(budgets.userId, userId),
				eq(budgets.categoryId, categoryId),
				eq(budgets.period, period),
			),
		}),
	]);

	if (!adminPayerId || !budget) return null;

	const totals = await db
		.select({
			totalAmount: sum(transactions.amount).as("totalAmount"),
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
				eq(transactions.transactionType, "Despesa"),
				eq(transactions.payerId, adminPayerId),
				eq(transactions.categoryId, categoryId),
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
				excludeTransactionsFromExcludedAccounts(),
			),
		);

	return {
		amount: toNumber(budget.amount),
		spent: Math.abs(toNumber(totals[0]?.totalAmount ?? 0)),
	};
}

const SUGGESTED_BUDGET_HISTORY_MONTHS = 6;

/**
 * Monta o histórico de gastos por categoria (últimos 6 meses completos
 * antes de `targetPeriod`) e devolve as metas sugeridas já calculadas por
 * `buildSuggestedCategoryBudgets`. Zero-fill dos meses sem lançamento, mas
 * só a partir do mês em que a categoria foi criada — uma categoria nova
 * não deve aparecer com 6 meses de histórico "zerado".
 */
export async function fetchSuggestedCategoryBudgets(
	userId: string,
	targetPeriod: string,
): Promise<SuggestedCategoryBudget[]> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) return [];

	const historyPeriods = buildPeriodWindow(
		getPreviousPeriod(targetPeriod),
		SUGGESTED_BUDGET_HISTORY_MONTHS,
	);
	const allPeriods = [...historyPeriods, targetPeriod];

	const [categoryRows, transactionRows] = await Promise.all([
		db.query.categories.findMany({
			columns: { id: true, name: true, createdAt: true },
			where: and(eq(categories.userId, userId), eq(categories.type, "despesa")),
		}),
		db
			.select({
				categoryId: transactions.categoryId,
				period: transactions.period,
				condition: transactions.condition,
				amount: transactions.amount,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					buildFinancialAdminAccessFilter({ userId, adminPayerId }),
					inArray(transactions.period, allPeriods),
					eq(transactions.transactionType, "Despesa"),
					isNotNull(transactions.categoryId),
					or(
						isNull(transactions.note),
						sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
					excludeTransactionsFromExcludedAccounts(),
				),
			),
	]);

	type Bucket = {
		amount: number;
		recurringAmount: number;
		installmentAmount: number;
	};
	const byCategoryPeriod = new Map<string, Map<string, Bucket>>();
	for (const row of transactionRows) {
		if (!row.categoryId) continue;
		const amount = Math.abs(toNumber(row.amount));
		const periodMap = byCategoryPeriod.get(row.categoryId) ?? new Map();
		const bucket = periodMap.get(row.period) ?? {
			amount: 0,
			recurringAmount: 0,
			installmentAmount: 0,
		};
		bucket.amount += amount;
		if (row.condition === "Recorrente") bucket.recurringAmount += amount;
		if (row.condition === "Parcelado") bucket.installmentAmount += amount;
		periodMap.set(row.period, bucket);
		byCategoryPeriod.set(row.categoryId, periodMap);
	}

	const inputs: CategoryBudgetInput[] = categoryRows.map((category) => {
		const categoryCreatedPeriod = dateToPeriod(category.createdAt);
		const periodMap = byCategoryPeriod.get(category.id);
		const relevantHistoryPeriods = historyPeriods.filter(
			(period) => period >= categoryCreatedPeriod,
		);
		const history = relevantHistoryPeriods.map((period) => {
			const bucket = periodMap?.get(period);
			return {
				period,
				amount: bucket?.amount ?? 0,
				recurringAmount: bucket?.recurringAmount ?? 0,
				installmentAmount: bucket?.installmentAmount ?? 0,
			};
		});
		const currentBucket = periodMap?.get(targetPeriod);

		return {
			categoryId: category.id,
			categoryName: category.name,
			history,
			currentMonthSpent: currentBucket?.amount ?? 0,
		};
	});

	return buildSuggestedCategoryBudgets(inputs);
}
