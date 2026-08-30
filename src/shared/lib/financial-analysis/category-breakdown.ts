/**
 * "Onde estou gastando mais / mais que deveria?" — quebra completa das
 * despesas por categoria num período, comparada com a média histórica.
 * Diferente de `categoryOpportunities` (planning/diagnostics), que só
 * destaca um recorte (top 6 com aumento ou alto peso): aqui a lista é
 * completa, pensada pra alimentar tanto o Início quanto o Assistente.
 */
import { and, eq, gte, isNull, lte, or, type SQL, sql } from "drizzle-orm";
import { categories, transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { getPreviousPeriod } from "@/shared/utils/period";

export type CategoryExpenseBreakdown = {
	categoryId: string | null;
	categoryName: string;
	amount: number;
	percentage: number;
	historicalAverage: number;
	difference: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Parte pura, testável sem banco. `current` é o gasto do período analisado
 * por categoria; `historicalAverages` é a média dos meses anteriores usados
 * como referência (tipicamente 3).
 */
export function buildCategoryBreakdown(
	current: {
		categoryId: string | null;
		categoryName: string;
		amount: number;
	}[],
	historicalAverages: Map<string, number>,
): CategoryExpenseBreakdown[] {
	const totalExpenses = current.reduce((total, item) => total + item.amount, 0);

	return current
		.map((item): CategoryExpenseBreakdown => {
			const historicalAverage = round2(
				historicalAverages.get(item.categoryId ?? "") ?? 0,
			);
			return {
				categoryId: item.categoryId,
				categoryName: item.categoryName,
				amount: round2(item.amount),
				percentage:
					totalExpenses > 0
						? Math.round((item.amount / totalExpenses) * 1000) / 10
						: 0,
				historicalAverage,
				difference: round2(item.amount - historicalAverage),
			};
		})
		.sort((a, b) => b.amount - a.amount);
}

const HISTORICAL_REFERENCE_MONTHS = 3;

function expenseConditions(
	userId: string,
	adminPayerId: string,
	periodFilter: SQL,
) {
	return and(
		buildFinancialAdminAccessFilter({ userId, adminPayerId }),
		periodFilter,
		eq(transactions.transactionType, "Despesa"),
		or(
			isNull(transactions.note),
			sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
		),
		excludeTransactionsFromExcludedAccounts(),
	);
}

/**
 * Busca o gasto por categoria de um período e compara com a média dos
 * `HISTORICAL_REFERENCE_MONTHS` meses anteriores.
 */
export async function getExpensesByCategory(
	userId: string,
	period: string,
): Promise<CategoryExpenseBreakdown[]> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) return [];

	let historyStart = period;
	for (let i = 0; i < HISTORICAL_REFERENCE_MONTHS; i++) {
		historyStart = getPreviousPeriod(historyStart);
	}
	const historyEnd = getPreviousPeriod(period);

	const [currentRows, historyRows] = await Promise.all([
		db
			.select({
				categoryId: transactions.categoryId,
				categoryName: categories.name,
				amount: transactions.amount,
			})
			.from(transactions)
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(
				expenseConditions(
					userId,
					adminPayerId,
					eq(transactions.period, period),
				),
			),
		db
			.select({
				categoryId: transactions.categoryId,
				amount: transactions.amount,
			})
			.from(transactions)
			.where(
				expenseConditions(
					userId,
					adminPayerId,
					and(
						gte(transactions.period, historyStart),
						lte(transactions.period, historyEnd),
					) as SQL,
				),
			),
	]);

	const historyTotals = new Map<string, number>();
	for (const row of historyRows) {
		const key = row.categoryId ?? "";
		historyTotals.set(
			key,
			(historyTotals.get(key) ?? 0) + Math.abs(Number(row.amount)),
		);
	}
	const historicalAverages = new Map(
		[...historyTotals.entries()].map(([categoryId, total]) => [
			categoryId,
			total / HISTORICAL_REFERENCE_MONTHS,
		]),
	);

	const grouped = new Map<
		string,
		{ categoryId: string | null; categoryName: string; amount: number }
	>();
	for (const row of currentRows) {
		const key = row.categoryId ?? "";
		const bucket = grouped.get(key) ?? {
			categoryId: row.categoryId,
			categoryName: row.categoryName ?? "Sem categoria",
			amount: 0,
		};
		bucket.amount += Math.abs(Number(row.amount));
		grouped.set(key, bucket);
	}

	return buildCategoryBreakdown([...grouped.values()], historicalAverages);
}
