/**
 * "Quanto gastei com Uber nos últimos 3 meses?" / "iFood este ano?" —
 * gasto com um estabelecimento específico, dentro de um intervalo de
 * períodos. Filtra por nome (ILIKE) direto no banco, sem trazer a tabela
 * inteira de transações pro código (e muito menos pra IA).
 */
import { and, gte, isNull, lte, or, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export type MerchantSpendingRow = {
	period: string;
	amount: number;
};

export type MerchantSpendingSummary = {
	query: string;
	totalAmount: number;
	occurrences: number;
	averageTicket: number;
	byPeriod: { period: string; amount: number }[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Parte pura, testável sem banco. */
export function buildMerchantSpendingSummary(
	query: string,
	rows: MerchantSpendingRow[],
): MerchantSpendingSummary {
	const byPeriod = new Map<string, number>();
	let totalAmount = 0;
	for (const row of rows) {
		const amount = Math.abs(row.amount);
		totalAmount += amount;
		byPeriod.set(row.period, (byPeriod.get(row.period) ?? 0) + amount);
	}

	return {
		query,
		totalAmount: round2(totalAmount),
		occurrences: rows.length,
		averageTicket: rows.length > 0 ? round2(totalAmount / rows.length) : 0,
		byPeriod: [...byPeriod.entries()]
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([period, amount]) => ({ period, amount: round2(amount) })),
	};
}

const MAX_MATCHED_ROWS = 2000;

/**
 * Busca despesas cujo nome contenha `query` (case-insensitive), entre
 * `periodStart` e `periodEnd`. Não faz SQL livre — só um ILIKE parametrizado
 * sobre uma faixa de período sempre limitada pelo chamador.
 */
export async function getMerchantSpending(
	userId: string,
	query: string,
	periodStart: string,
	periodEnd: string = periodStart,
): Promise<MerchantSpendingSummary> {
	const trimmedQuery = query.trim();
	if (!trimmedQuery) {
		return buildMerchantSpendingSummary(query, []);
	}

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return buildMerchantSpendingSummary(trimmedQuery, []);
	}

	const rows = await db
		.select({
			period: transactions.period,
			amount: transactions.amount,
		})
		.from(transactions)
		.where(
			and(
				buildFinancialAdminAccessFilter({ userId, adminPayerId }),
				gte(transactions.period, periodStart),
				lte(transactions.period, periodEnd),
				sql`${transactions.transactionType} = 'Despesa'`,
				sql`${transactions.name} ILIKE ${`%${trimmedQuery}%`}`,
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
				excludeTransactionsFromExcludedAccounts(),
			),
		)
		.limit(MAX_MATCHED_ROWS);

	return buildMerchantSpendingSummary(
		trimmedQuery,
		rows.map((row) => ({ period: row.period, amount: Number(row.amount) })),
	);
}
