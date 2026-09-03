/**
 * "Compras recorrentes" e "assinaturas ativas" — agrupa despesas pelo nome
 * normalizado do estabelecimento (reaproveita `looseMerchantKey`, já usado
 * na importação de faturas) e separa o que é assinatura (lançamentos
 * marcados como "Recorrente") do que só se repete (ex.: Uber, delivery).
 */
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { looseMerchantKey } from "@/features/transactions/lib/import-utils";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export type RecurringMerchant = {
	merchantKey: string;
	displayName: string;
	occurrences: number;
	totalAmount: number;
	averageAmount: number;
	/** `true` quando a maioria dos lançamentos veio marcada como "Recorrente". */
	isSubscription: boolean;
	/** Sugestão simples: revisar quando o gasto acumulado pesa no total. */
	suggestion: "revisar" | "ok";
};

export type RecurringMerchantsSummary = {
	subscriptions: RecurringMerchant[];
	recurringMerchants: RecurringMerchant[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const MIN_OCCURRENCES = 2;
/** Acima disso (em % do total gasto na janela), sugere revisar o merchant. */
const REVIEW_SHARE_THRESHOLD = 0.03;

type RawExpenseRow = {
	name: string;
	amount: number;
	condition: string;
};

/** Parte pura, testável sem banco. */
export function buildRecurringMerchantsSummary(
	rows: RawExpenseRow[],
): RecurringMerchantsSummary {
	const groups = new Map<
		string,
		{ displayName: string; amounts: number[]; recurringCount: number }
	>();

	for (const row of rows) {
		const key = looseMerchantKey(row.name);
		if (!key) continue;
		const group = groups.get(key) ?? {
			displayName: row.name.trim(),
			amounts: [],
			recurringCount: 0,
		};
		group.amounts.push(Math.abs(row.amount));
		if (row.condition === "Recorrente") group.recurringCount += 1;
		groups.set(key, group);
	}

	const totalExpenses = rows.reduce(
		(total, row) => total + Math.abs(row.amount),
		0,
	);

	const merchants: RecurringMerchant[] = [...groups.entries()]
		.filter(([, group]) => group.amounts.length >= MIN_OCCURRENCES)
		.map(([merchantKey, group]) => {
			const totalAmount = group.amounts.reduce((sum, v) => sum + v, 0);
			const averageAmount = totalAmount / group.amounts.length;
			const isSubscription = group.recurringCount >= group.amounts.length / 2;
			const share = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

			return {
				merchantKey,
				displayName: group.displayName,
				occurrences: group.amounts.length,
				totalAmount: round2(totalAmount),
				averageAmount: round2(averageAmount),
				isSubscription,
				suggestion: (share >= REVIEW_SHARE_THRESHOLD
					? "revisar"
					: "ok") as RecurringMerchant["suggestion"],
			};
		})
		.sort((a, b) => b.totalAmount - a.totalAmount);

	return {
		subscriptions: merchants.filter((merchant) => merchant.isSubscription),
		recurringMerchants: merchants.filter(
			(merchant) => !merchant.isSubscription,
		),
	};
}

/**
 * Busca despesas do usuário nos períodos informados e monta o resumo de
 * assinaturas + estabelecimentos recorrentes.
 */
export async function getRecurringMerchants(
	userId: string,
	periods: string[],
): Promise<RecurringMerchantsSummary> {
	if (periods.length === 0) {
		return { subscriptions: [], recurringMerchants: [] };
	}

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return { subscriptions: [], recurringMerchants: [] };
	}

	const rows = await db
		.select({
			name: transactions.name,
			amount: transactions.amount,
			condition: transactions.condition,
		})
		.from(transactions)
		.where(
			and(
				buildFinancialAdminAccessFilter({ userId, adminPayerId }),
				inArray(transactions.period, periods),
				eq(transactions.transactionType, "Despesa"),
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
				excludeTransactionsFromExcludedAccounts(),
			),
		);

	return buildRecurringMerchantsSummary(
		rows.map((row) => ({
			name: row.name,
			amount: Number(row.amount),
			condition: row.condition,
		})),
	);
}
